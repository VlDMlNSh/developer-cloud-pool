# Root-signed Qualified Route Registry Bundle v1

Status: isolated cryptographic proof contract. Not production-qualified.

## Trust anchor

The verifier MUST load `ROUTE_REGISTRY_ROOT_KEY_ID` and `ROUTE_REGISTRY_ROOT_PUBLIC_JWK` from platform environment bindings. The request and signed bundle MUST NOT supply or override the root public key. The configured JWK is public material; its integrity depends on independently controlled deployment/configuration permissions. The proof does not configure a production root or qualify those permissions.

## Canonical bundle

Version 1 uses UTF-8 JSON for a fixed-position array prefixed by `trusted-route-registry-bundle-v1`. The signed fields are schema version, monotonic registry epoch, registry version, issued/expiry timestamps, root key ID, ordered issuer-key records and ordered route-evidence/signature records.

- Exact field allowlists apply at every object level.
- Issuer records are ordered uniquely by issuer ID/key ID.
- Route records are ordered uniquely by qualification ID.
- Duplicate, unsorted, unknown, malformed or missing records fail closed.
- Bundle age is at most 300 seconds; lifetime is at most one hour.
- Root signature is detached ES256 (ECDSA P-256 / SHA-256).
- Each route evidence signature is independently verified against the issuer public key carried in the root-signed bundle.
- Every route evidence registry version must equal the bundle registry version.
- Verified results are immutable and always set `dispatch: false`.

## Required production controls not implemented here

This verifier authenticates one bundle against the configured public root. It does NOT:
- persist accepted registry state or enforce monotonic registry epochs across requests;
- prevent replay or rollback using a durable authoritative watermark;
- implement root-key custody, dual-control root rotation or authenticated deployment configuration;
- implement an append-only issuer/key registry or durable revocation writer;
- re-check exact registry epoch, issuer key ID and revocation watermark in the same D1 transaction as approval consumption;
- wire the verified bundle into `admitQualifiedTask`;
- prove live provider account identity, credential ownership or quota.

Therefore the verifier result MUST NOT be treated as production route qualification or passed into production admission. Qualified Route Evidence remains NOT QUALIFIED. Dispatch remains disabled.

## Validation boundary

The proof uses ephemeral synthetic P-256 keys generated inside tests. No provider login/call, secret access, hosted D1, Worker deployment, external dispatch, executor qualification or merge is performed.
