# frozen_string_literal: true

require "minitest/autorun"
require "tmpdir"
require "fileutils"
require_relative "validate-free-tier-policy"

class FreeTierWorkflowPolicyTest < Minitest::Test
  VALID = <<~YAML
    name: Valid
    on:
      workflow_dispatch:
    jobs:
      check:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    steps:
      - run: node --version
  YAML

  def errors(source)
    FreeTierWorkflowPolicy.validate_workflow_set("workflow.yml" => source)
  end

  def test_accepts_standard_runner_and_bounded_timeout
    assert_empty errors(VALID)
  end

  def test_accepts_standard_macos_runner
    assert_empty errors(VALID.sub("ubuntu-24.04", "macos-15"))
  end

  def test_rejects_runner_arrays_expressions_and_nonstandard_skus
    [
      VALID.sub("ubuntu-24.04", "[self-hosted, linux]"),
      VALID.sub("ubuntu-24.04", "${{ matrix.runner }}"),
      VALID.sub("ubuntu-24.04", "ubuntu-24.04-8core"),
      VALID.sub("ubuntu-24.04", "ubuntu-latest-large"),
      VALID.sub("ubuntu-24.04", "gpu-linux")
    ].each do |source|
      refute_empty errors(source)
    end
  end

  def test_rejects_missing_and_excessive_timeout
    assert errors(VALID.sub("    timeout-minutes: 5\n", "")).any? { |e| e.include?("timeout-minutes") }
    assert errors(VALID.sub("timeout-minutes: 5", "timeout-minutes: 31")).any? { |e| e.include?("timeout-minutes") }
  end

  def test_rejects_custom_job_and_service_images
    job_container = VALID.sub("    timeout-minutes: 5", "    timeout-minutes: 5\n        container: node:latest")
    service_image = VALID.sub("    steps:", "        services:\n      db:\n        image: postgres:latest\n    steps:")
    assert errors(job_container).any? { |e| e.include?("containers/images") }
    assert errors(service_image).any? { |e| e.include?("service containers/images") }
  end

  def test_requires_bounded_matrix_parallelism
    matrix = VALID.sub("    steps:", "        strategy:\n      matrix:\n        node: [20, 22]\n    steps:")
    assert errors(matrix).any? { |e| e.include?("max-parallel") }
    bounded = matrix.sub("      matrix:", "      max-parallel: 2\n      matrix:")
    assert_empty errors(bounded)
  end

  def test_rejects_enabled_paid_fallback
    source = VALID.sub("jobs:", "model:\n  paid-fallback: true\njobs:")
    assert errors(source).any? { |e| e.include?("paid fallback") }
  end

  def test_rejects_invalid_yaml
    assert errors("jobs:\n  broken: [").any? { |e| e.include?("invalid workflow YAML") }
  end

  def test_recursively_validates_local_reusable_workflows
    Dir.mktmpdir do |directory|
      FileUtils.mkdir_p(File.join(directory, ".github", "workflows"))
      root = File.join(directory, "root.yml")
      child = File.join(directory, "child.yml")
      File.write(root, <<~YAML)
        name: Root
        jobs:
          call:
            uses: ./.github/workflows/child.yml
      YAML
      File.write(child, VALID.sub("ubuntu-24.04", "ubuntu-24.04-large"))
      assert FreeTierWorkflowPolicy.validate_workflow_directory(directory).any? { |e| e.include?("runner") }
    end
  end

  def test_rejects_external_reusable_workflows
    source = VALID.sub("    runs-on: ubuntu-24.04\n    timeout-minutes: 5\n    steps:\n      - run: node --version", "    uses: vendor/workflow/.github/workflows/build.yml@v1")
    assert errors(source).any? { |e| e.include?("external/unpinned reusable workflows") }
  end

  def test_rejects_missing_local_reusable_workflow
    Dir.mktmpdir do |directory|
      File.write(File.join(directory, "root.yml"), <<~YAML)
        name: Root
        jobs:
          call:
            uses: ./.github/workflows/missing.yml
      YAML
      assert FreeTierWorkflowPolicy.validate_workflow_directory(directory).any? { |e| e.include?("is missing") }
    end
  end
end
