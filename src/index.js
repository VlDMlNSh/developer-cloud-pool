import { Hono } from "hono";

const app = new Hono();

app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "no-referrer");
  await next();
});

app.get("/api/v1/health", (c) => {
  return c.json({
    service: "jarvis-web-console",
    status: "ok",
    pool_status: "unknown",
    authentication: "not_configured",
    dispatch: "disabled"
  });
});

// Fail closed until GitHub OAuth, owner-ID authorization and session
// validation are implemented and independently qualified.
app.all("/api/*", (c) => {
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    c.header("Allow", "GET, HEAD");
    return c.json({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  return c.json({
    error: "AUTHENTICATION_NOT_CONFIGURED",
    message: "Protected API access is unavailable until authentication is qualified."
  }, 503);
});

app.notFound((c) => c.json({ error: "NOT_FOUND" }, 404));

export { app };
export default app;
