import test from "node:test";
import assert from "node:assert/strict";
import * as oauth from "oauth4webapi";

const issuer = "https://github.com";
const authorizationEndpoint = "https://github.com/login/oauth/authorize";
const tokenEndpoint = "https://github.com/login/oauth/access_token";
const redirectUri = "https://jarvis.example.test/auth/github/callback";
const client = { client_id: "synthetic-client-id" };
const clientSecret = "synthetic-client-secret";
const as = { issuer, authorization_endpoint: authorizationEndpoint, token_endpoint: tokenEndpoint };

test("GitHub Authorization Code + PKCE S256 works with form-body client authentication", async () => {
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  const state = oauth.generateRandomState();
  assert.equal(codeChallenge.length, 43);
  assert.match(codeChallenge, /^[A-Za-z0-9_-]{43}$/);

  const authorizationUrl = new URL(authorizationEndpoint);
  authorizationUrl.searchParams.set("client_id", client.client_id);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const callback = new URL(redirectUri);
  callback.searchParams.set("code", "synthetic-one-time-code");
  callback.searchParams.set("state", state);
  const callbackParameters = oauth.validateAuthResponse(as, client, callback, state);
  assert.equal(callbackParameters.get("code"), "synthetic-one-time-code");
  assert.throws(() => oauth.validateAuthResponse(as, client, callback, "different-state"), /state/i);

  let tokenRequestObserved = false;
  const tokenResponse = await oauth.authorizationCodeGrantRequest(
    as, client, oauth.ClientSecretPost(clientSecret), callbackParameters, redirectUri, codeVerifier,
    { [oauth.customFetch]: async (url, options) => {
      assert.equal(url, tokenEndpoint);
      assert.equal(options.method, "POST");
      assert.equal(options.body instanceof URLSearchParams, true);
      assert.equal(options.headers.accept, "application/json");
      assert.ok(options.headers["content-type"].startsWith("application/x-www-form-urlencoded"));
      assert.equal(options.headers.authorization, undefined);
      const body = options.body;
      assert.equal(body.get("grant_type"), "authorization_code");
      assert.equal(body.get("client_id"), client.client_id);
      assert.equal(body.get("client_secret"), clientSecret);
      assert.equal(body.get("code"), "synthetic-one-time-code");
      assert.equal(body.get("redirect_uri"), redirectUri);
      assert.equal(body.get("code_verifier"), codeVerifier);
      tokenRequestObserved = true;
      const response = new Response(JSON.stringify({
        access_token: "synthetic-access-token", token_type: "bearer", scope: ""
      }), { status: 200, headers: { "content-type": "application/json" } });
      Object.defineProperty(response, "url", { value: tokenEndpoint });
      return response;
    } }
  );
  assert.equal(tokenRequestObserved, true);
  const token = await oauth.processAuthorizationCodeResponse(as, client, tokenResponse);
  assert.equal(token.access_token, "synthetic-access-token");
  assert.equal(token.token_type, "bearer");

  let userRequestObserved = false;
  const userResponse = await oauth.protectedResourceRequest(
    token.access_token, "GET", new URL("https://api.github.com/user"),
    new Headers({ accept: "application/vnd.github+json" }), undefined,
    { [oauth.customFetch]: async (url, options) => {
      assert.equal(url, "https://api.github.com/user");
      assert.equal(options.method, "GET");
      assert.equal(options.headers.authorization, "Bearer synthetic-access-token");
      userRequestObserved = true;
      return new Response(JSON.stringify({ id: 123456789, login: "synthetic-owner" }), {
        status: 200, headers: { "content-type": "application/json" }
      });
    } }
  );
  assert.equal(userRequestObserved, true);
  const identity = await userResponse.json();
  assert.equal(identity.id, 123456789);
  assert.equal(identity.login, "synthetic-owner");
});
