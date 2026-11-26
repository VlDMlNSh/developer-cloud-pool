// Deliberately inert entrypoint for the local Workers-runtime proof.
// No HTTP ingress, provider client, GitHub mutation, or dispatch capability.
export default {
  fetch() {
    return new Response("D1 ledger proof only", { status: 404 });
  }
};
