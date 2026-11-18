// Isolated local Vitest harness only. This worker exposes no HTTP or dispatch capability.
export default { async fetch() { return new Response("local D1 proof harness", { status: 404 }); } };
