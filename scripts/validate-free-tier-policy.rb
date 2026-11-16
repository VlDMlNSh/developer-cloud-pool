#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"
require "pathname"

module FreeTierWorkflowPolicy
  ALLOWED_RUNNER = /\A(?:ubuntu-(?:latest|[0-9]{2}\.[0-9]{2})|windows-(?:latest|20[0-9]{2})|macos-(?:latest|[0-9]{2}))\z/
  MAX_TIMEOUT_MINUTES = 30
  MAX_MATRIX_PARALLEL = 4

  module_function

  def validate_yaml_mapping_keys!(source, file)
    stream = Psych.parse_stream(source)
    walk = lambda do |node|
      case node
      when Psych::Nodes::Mapping
        seen = {}
        node.children.each_slice(2) do |key, value|
          unless key.is_a?(Psych::Nodes::Scalar)
            raise "#{file}: non-scalar YAML mapping keys are forbidden"
          end

          key_name = key.value
          if key_name == "<<" || key.tag == "tag:yaml.org,2002:merge"
            raise "#{file}: YAML merge keys are forbidden"
          end
          if seen.key?(key_name)
            raise "#{file}: duplicate YAML mapping key #{key_name.inspect}"
          end

          seen[key_name] = true
          walk.call(key)
          walk.call(value)
        end
      when Psych::Nodes::Sequence, Psych::Nodes::Document, Psych::Nodes::Stream
        node.children.each { |child| walk.call(child) }
      end
    end
    walk.call(stream)
  end

  def parse_workflow(source, file)
    validate_yaml_mapping_keys!(source, file)
    parsed = YAML.safe_load(source, permitted_classes: [], permitted_symbols: [], aliases: true)
    raise "#{file}: workflow root must be a YAML mapping" unless parsed.is_a?(Hash)
    parsed
  rescue Psych::Exception => e
    raise "#{file}: invalid workflow YAML: #{e.message}"
  end

  def truthy_policy_value?(value)
    value == true || %w[true enabled paid].include?(value.to_s.downcase)
  end

  def inspect_policy_keys(value, file, errors, path = [])
    case value
    when Hash
      value.each do |key, child|
        key_name = key.to_s
        current = path + [key_name]
        if key_name.match?(/\A(?:paid[-_ ]?fallback|allow[-_ ]?paid[-_ ]?fallback|automatic[-_ ]?upgrade)\z/i) && truthy_policy_value?(child)
          errors << "#{file}: paid fallback/automatic upgrade configuration is forbidden at #{current.join(".")}"
        end
        inspect_policy_keys(child, file, errors, current)
      end
    when Array
      value.each_with_index { |child, index| inspect_policy_keys(child, file, errors, path + [index.to_s]) }
    when String
      if value.match?(/\A(?:gpu|ubuntu-.*(?:large|[0-9]+core)|(?:ubuntu|windows|macos)-.*(?:xlarge|2xlarge|4xlarge))\z/i)
        errors << "#{file}: paid/larger/GPU runner selector detected: #{value}"
      end
    end
  end

  def validate_job(job_id, job, file, errors)
    unless job.is_a?(Hash)
      errors << "#{file} job #{job_id}: job definition must be a YAML mapping"
      return
    end

    if job.key?("uses")
      target = job["uses"]
      if !target.is_a?(String) || !target.start_with?("./.github/workflows/") || target.include?("@")
        errors << "#{file} job #{job_id}: external/unpinned reusable workflows are not allowed; only local reusable workflows can be recursively audited"
      end
    else
      runner = job["runs-on"]
      unless runner.is_a?(String) && ALLOWED_RUNNER.match?(runner)
        errors << "#{file} job #{job_id}: runs-on must be one literal standard hosted runner label; got #{runner.inspect}"
      end

      timeout = job["timeout-minutes"]
      unless timeout.is_a?(Integer) && timeout.between?(1, MAX_TIMEOUT_MINUTES)
        errors << "#{file} job #{job_id}: timeout-minutes must be an integer from 1 to #{MAX_TIMEOUT_MINUTES}"
      end
    end

    if job.key?("container") || job.key?("image")
      errors << "#{file} job #{job_id}: custom job containers/images are forbidden"
    end

    services = job["services"]
    if services.is_a?(Hash) && services.any? { |_name, service| service.is_a?(Hash) && service.key?("image") }
      errors << "#{file} job #{job_id}: service containers/images are forbidden"
    end

    strategy = job["strategy"]
    if strategy.is_a?(Hash) && strategy.key?("matrix")
      max_parallel = strategy["max-parallel"]
      unless max_parallel.is_a?(Integer) && max_parallel.between?(1, MAX_MATRIX_PARALLEL)
        errors << "#{file} job #{job_id}: matrix requires max-parallel integer from 1 to #{MAX_MATRIX_PARALLEL}"
      end
    end
  end

  def validate_workflow_set(workflows)
    errors = []
    parsed = {}
    workflows.each do |file, source|
      begin
        parsed[file] = parse_workflow(source, file)
      rescue StandardError => e
        errors << e.message
      end
    end

    parsed.each do |file, workflow|
      jobs = workflow["jobs"]
      unless jobs.is_a?(Hash) && !jobs.empty?
        errors << "#{file}: missing or empty jobs mapping"
        next
      end
      inspect_policy_keys(workflow, file, errors)
      jobs.each { |job_id, job| validate_job(job_id, job, file, errors) }
    end

    errors
  end

  def validate_workflow_directory(directory)
    root = Pathname.new(directory).expand_path
    files = Dir.glob(root.join("**/*.{yml,yaml}").to_s).sort
    return ["#{directory}: no workflow YAML files found"] if files.empty?

    workflows = files.to_h { |file| [Pathname.new(file).relative_path_from(root).to_s, File.read(file)] }
    errors = validate_workflow_set(workflows)
    parsed = {}
    workflows.each do |file, source|
      begin
        parsed[file] = parse_workflow(source, file)
      rescue StandardError
        next
      end
    end

    visited = {}
    walk = lambda do |file, stack|
      return if visited[file]
      if stack.include?(file)
        errors << "#{file}: reusable workflow cycle detected: #{(stack + [file]).join(" -> ")}"
        return
      end
      workflow = parsed[file]
      return unless workflow && workflow["jobs"].is_a?(Hash)

      workflow["jobs"].each do |job_id, job|
        next unless job.is_a?(Hash) && job["uses"].is_a?(String) && job["uses"].start_with?("./.github/workflows/")
        target = job["uses"].delete_prefix("./.github/workflows/")
        unless target.match?(/\A[A-Za-z0-9_.-]+\.ya?ml\z/)
          errors << "#{file} job #{job_id}: invalid local reusable workflow path #{job["uses"].inspect}"
          next
        end
        unless workflows.key?(target)
          errors << "#{file} job #{job_id}: referenced local reusable workflow #{target} is missing"
          next
        end
        walk.call(target, stack + [file])
      end
      visited[file] = true
    end
    parsed.keys.sort.each { |file| walk.call(file, []) }
    errors.uniq
  end
end

if $PROGRAM_NAME == __FILE__
  directory = ARGV.fetch(0, ".github/workflows")
  errors = FreeTierWorkflowPolicy.validate_workflow_directory(directory)
  if errors.empty?
    count = Dir.glob(File.join(directory, "**", "*.{yml,yaml}")).length
    puts "PASS #{count} workflow YAML files comply with GitHub Free-only runner policy"
    puts "FREE_TIER_POLICY_VALIDATION=PASS"
  else
    errors.each { |error| warn "FAIL #{error}" }
    exit 1
  end
end
