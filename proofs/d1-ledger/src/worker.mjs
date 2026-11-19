// Deliberately inert entrypoint required by Wrangler's local test configuration.
// The ledger adapter is imported directly by tests and is not exposed over HTTP.
export default {
  fetch() {
    return new Response("D1 ledger proof only", { status: 404 });
  }
};
