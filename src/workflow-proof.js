import { WorkflowEntrypoint } from "cloudflare:workers";

export class ProofWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const result = await step.do("deterministic-proof-step", async () => ({
      proof: "local-workflow-runtime",
      input: event.payload
    }));
    return result;
  }
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== "/create") {
      return new Response("not found", { status: 404 });
    }
    const payload = { marker: "synthetic-only" };
    const instance = await env.PROOF_WORKFLOW.create({ params: payload });
    return Response.json({ id: instance.id });
  }
};
