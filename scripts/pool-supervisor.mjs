const dispatchEnabled = process.env.POOL_DISPATCH_ENABLED === "true";

if (dispatchEnabled) {
  console.error(
    "LEGACY_LABEL_DISPATCH_RETIRED: label-driven DSH dispatch is permanently blocked. " +
    "The replacement must consume a qualified D1 admission receipt through the approved controller."
  );
  process.exitCode = 2;
} else {
  console.log(
    "Pool Supervisor heartbeat only: legacy label-driven DSH dispatch is retired; " +
    "D1-backed admission and the qualified CODE executor are not yet deployed."
  );
  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = await import("node:fs");
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      "Pool Supervisor heartbeat only. Legacy DSH label dispatch retired; no API calls, mutations, or worker dispatch occurred.\n"
    );
  }
}
