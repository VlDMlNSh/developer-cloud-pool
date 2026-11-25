/**
 * Normalize GitHub's trusted Actions context into the narrow D1 event-binder
 * contract. Call this only inside the workflow with the `github` context and
 * process environment supplied by the Actions runner; never build these
 * arguments from workflow_dispatch inputs, issue text, repository variables,
 * or caller-provided JSON.
 *
 * This is a pure adapter. It does not authenticate the runner, write D1, or
 * authorize execution. The downstream binder remains fail-closed.
 */
export function mapGitHubActionsContext(github, env) {
  const event = github?.event ?? {};
  const issue = event.issue ?? {};
  const comment = event.comment ?? {};
  const author = comment.user ?? {};

  return {
    githubActions: env?.GITHUB_ACTIONS,
    serverUrl: env?.GITHUB_SERVER_URL,
    eventName: github?.event_name,
    eventAction: event.action,
    repository: github?.repository,
    repositoryId: github?.repository_id,
    ownerNumericId: github?.repository_owner_id,
    ownerLogin: github?.repository_owner,
    actorId: github?.actor_id,
    actorLogin: github?.actor,
    issueNumber: issue.number,
    isPullRequest: Boolean(issue.pull_request),
    commentId: comment.id,
    commentBody: comment.body,
    commentUserId: author.id,
    commentUserLogin: author.login,
    commentAuthorAssociation: author.author_association,
    ref: github?.ref,
    sha: github?.sha,
    workflowRef: github?.workflow_ref,
    workflowSha: github?.workflow_sha,
    runId: Number(github?.run_id),
    runAttempt: Number(github?.run_attempt)
  };
}
