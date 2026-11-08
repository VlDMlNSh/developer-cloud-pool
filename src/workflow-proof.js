import { WorkflowEntrypoint } from "cloudflare:workers";
import { claimAttempt, commitAttemptReceipt } from "./attempt-ledger.js";

export class ProofWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const { taskId, attemptId, generation, receipt, simulateTimeoutAfterCommit = false } = event.payload;
    const claim = await claimAttempt(this.env.DB, { taskId, attemptId, generation });
    if (claim.outcome !== "ALLOW") {
      throw new Error(`attempt denied: ${claim.reason}`);
    }

    return await step.do(
      "commit-d1-receipt",
      { retries: { limit: 2, delay: "1 second", backoff: "constant" } },
      async () => {
        await this.env.DB.prepare(
          `INSERT INTO pool_attempt_step_invocations (attempt_id, invocation_count)
           VALUES (?, 1)
           ON CONFLICT(attempt_id) DO UPDATE SET invocation_count = invocation_count + 1`
        ).bind(attemptId).run();

        const result = await commitAttemptReceipt(this.env.DB, {
          taskId, attemptId, generation, receipt
        });
        if (result.outcome !== "COMMITTED") {
          throw new Error(`receipt commit denied: ${result.reason}`);
        }

        // Deterministic local fault injection: the D1 write has completed,
        // then the Workflow step fails once and must retry against the receipt.
        if (simulateTimeoutAfterCommit) {
          const fault = await this.env.DB.prepare(
            `UPDATE pool_test_faults
             SET remaining_failures = remaining_failures - 1
             WHERE attempt_id = ? AND remaining_failures > 0
             RETURNING remaining_failures`
          ).bind(attemptId).first();
          if (fault) {
            throw new Error("synthetic timeout after durable D1 commit");
          }
        }
        return result;
      }
    );
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/create" || request.method !== "POST") {
      return new Response("not found", { status: 404 });
    }
    const payload = await request.json();
    const instance = await env.PROOF_WORKFLOW.create({ params: payload });
    return Response.json({ id: instance.id });
  }
};
