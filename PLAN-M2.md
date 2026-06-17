# PLAN-M2.md

Milestone plan for M2: live Viam client.

## Goal

Wire real, read-only Viam fleet inspection calls behind the existing `ViamClient` interface.

M2 should keep the public MCP tool surface unchanged while replacing the default runtime client with a live Viam client when the server is started with environment-variable credentials.

Keep exactly these MCP tools:

* `viam_whoami`
* `viam_list_machines`
* `viam_get_recent_errors`
* `viam_summarize_fleet_health`

## Current state

The current repo is at the M1 fake-client shape:

* `src/viam/client.ts` defines a small `ViamClient` interface with `whoami`, `listMachines`, and `getRecentErrors`.
* `src/viam/fakeClient.ts` implements deterministic fake data for tests and local M1 behavior.
* `src/tools.ts` implements all four tool handlers and keeps inputs bounded.
* `src/server.ts` registers exactly the four V0 tools.
* `src/index.ts` currently instantiates `FakeViamClient`.
* `src/errors.ts` provides redacted safe tool errors.
* `test/tools.test.ts` covers fake-client behavior, redaction, and the client boundary.
* `README.md` says the server is fake-client-backed and live Viam support is not implemented.
* There is no Viam SDK dependency yet.
* There is no config/env parser yet.
* There is no live client.
* At this planning pass, `git status --short` shows only `PLAN-M2.md` as untracked.

Official docs checked for this plan on 2026-06-17:

* Viam authentication concepts: https://docs.viam.com/build-apps/concepts/authentication/
* Viam API keys: https://docs.viam.com/organization/api-keys/
* Viam fleet management API: https://docs.viam.com/reference/apis/fleet/
* Viam machine monitoring concepts: https://docs.viam.com/monitor/monitor/
* TypeScript SDK `createViamClient`: https://ts.viam.dev/functions/createViamClient.html
* TypeScript SDK `ViamClientOptions`: https://ts.viam.dev/interfaces/ViamClientOptions.html
* TypeScript SDK `Credentials`: https://ts.viam.dev/types/Credentials.html
* TypeScript SDK `ViamClient`: https://ts.viam.dev/classes/ViamClient.html
* TypeScript SDK `AppClient`: https://ts.viam.dev/classes/AppClient.html
* TypeScript SDK `LocationSummary`: https://ts.viam.dev/classes/appApi.LocationSummary.html
* TypeScript SDK `MachineSummary`: https://ts.viam.dev/classes/appApi.MachineSummary.html
* TypeScript SDK `PartSummary`: https://ts.viam.dev/classes/appApi.PartSummary.html
* TypeScript SDK `OnlineState`: https://ts.viam.dev/enums/appApi.OnlineState.html
* TypeScript SDK `LogEntry`: https://ts.viam.dev/classes/commonApi.LogEntry.html
* TypeScript SDK `GetRobotPartLogsResponse`: https://ts.viam.dev/classes/appApi.GetRobotPartLogsResponse.html

Important source-of-truth notes from the docs:

* API key credentials include an ID (`authEntity`) and a secret (`payload`).
* API keys can be scoped to organization, location, or machine; M2 expects the configured key to have enough read access for the configured org.
* `createViamClient` returns a `ViamClient` with an `appClient`.
* Read-only `AppClient` methods relevant to M2 include `getOrganization`, `listMachineSummaries`, and `getRobotPartLogs`.
* `getRobotPartLogs` returns one page of logs sorted newest first and has `filter`, `levels`, `start`, `end`, and `pageToken` parameters.
* `tailRobotPartLogs` streams logs and is not appropriate for M2 request/response tools.
* `ViamClientOptions` has `credentials` and optional `serviceHost`; do not add `serviceHost` env support unless installed SDK types or live testing prove it is required.
* `LocationSummary`, `MachineSummary`, `PartSummary`, `OnlineState`, and `GetRobotPartLogsResponse` are generated TypeScript SDK shapes; some TypeDoc pages mark these generated classes deprecated, so implementation must verify the installed package before coding against them.
* The same `AppClient` also exposes many mutation methods; M2 must use a strict allowlist.

## Non-goals

Do not change the MCP tool names.

Do not add new MCP tools.

Do not change the existing public tool input schemas unless an installed SDK type mismatch makes a correction unavoidable. The expected inputs remain:

* no input for `viam_whoami`
* no input for `viam_list_machines`
* optional `machineId`, `since`, and bounded `limit` for `viam_get_recent_errors`
* optional bounded `recentErrorLimit` for `viam_summarize_fleet_health`

Do not add write operations.

Do not call or expose:

* robot control
* motor/base/arm/camera movement
* arbitrary `DoCommand`
* config mutation
* fragment mutation
* machine or part restart
* module deployment
* data deletion
* key creation, key rotation, or key deletion
* `tailRobotPartLogs`
* generic Viam API proxy behavior

Do not add OAuth, hosted server behavior, remote HTTP, UI, daemon behavior, scheduler behavior, a plugin system, dynamic tool generation, or a dependency-injection framework.

Do not expose `VIAM_API_KEY`, `VIAM_API_KEY_ID`, bearer tokens, full raw SDK errors, raw SDK response objects, machine configs, robot secrets, location auth, or unbounded logs.

Do not make normal tests require credentials or network access.

Do not claim support for clients other than Codex.

## Files expected to change

Expected existing files to update during M2 implementation:

* `package.json`
* `package-lock.json`
* `src/index.ts`
* `src/tools.ts`
* `src/server.ts`
* `src/errors.ts`
* `src/viam/client.ts`
* `test/tools.test.ts`
* `README.md`
* `.env.example`
* `PLAN-M2.md` after implementation, to record validation results

Expected new production files:

* `src/config.ts`
* `src/viam/liveClient.ts`

Expected new test files:

* `test/config.test.ts`
* `test/liveClient.test.ts`

Possible small test-only helper file only if tests become hard to read:

* `test/liveSmoke.test.ts`

Files that should not change unless a direct mismatch is found:

* `AGENTS.md`
* `PLAN.md`
* `REVIEW.md`
* `SECURITY.md`
* `PLAN-M0.md`
* `PLAN-M1.md`

## Implementation steps

1. Add the official Viam TypeScript SDK dependency.
   * Use `@viamrobotics/sdk`.
   * Use the installed package types and official TypeScript docs as source of truth.
   * Do not add other runtime dependencies unless the SDK path requires them.

2. Run an SDK/API verification gate before writing live-client logic.
   * Verify these exact calls exist in the installed package and record any mismatch in `PLAN-M2.md` during implementation:
     * `createViamClient(options)`
     * `createViamClient({ credentials })`
     * credentials with `type: "api-key"`, `authEntity: VIAM_API_KEY_ID`, and `payload: VIAM_API_KEY`
     * `client.appClient.getOrganization(VIAM_ORG_ID)`
     * `client.appClient.listMachineSummaries(VIAM_ORG_ID, fragmentIds?, locationIds?, limit?)`
     * `client.appClient.getRobotPartLogs(partId, filter?, levels?, start?, end?, pageToken?)`
   * Verify the response fields used for mapping:
     * `LocationSummary.locationId`, `locationName`, `machineSummaries`
     * `MachineSummary.machineId`, `machineName`, `partSummaries`
     * `PartSummary.partId`, `partName`, `isMainPart`, `onlineState`, `lastAccess`, `lastOnline`, `secondsSinceOnline`
     * `OnlineState.ONLINE`, `OFFLINE`, `AWAITING_SETUP`, `UNSPECIFIED`
     * `GetRobotPartLogsResponse.logs`, `nextPageToken`
     * `LogEntry.level`, `time`, `loggerName`, `message`
   * If a call or field is missing, do not guess from raw SDK objects. Use the smallest safe placeholder:
     * keep the public MCP tool and `ViamClient` method present
     * return a redacted `live_viam_error` saying the live mapping is not implemented for that method yet
     * update this plan with the exact docs/type mismatch and the next research step
   * Do not claim M2 done until all three live `ViamClient` methods either work against verified read-only calls or the implementation is clearly labeled partial.

3. Add config parsing in `src/config.ts`.
   * Read only:
     * `VIAM_API_KEY_ID`
     * `VIAM_API_KEY`
     * `VIAM_ORG_ID`
   * Return a small explicit config object.
   * Fail with a short `missing_config` error listing missing variable names only.
   * Do not include env values in errors.
   * Do not add optional env vars unless the installed SDK requires one.
   * Add tests for complete config, missing config, empty strings, and no secret leakage.

4. Extend the local error model only as needed.
   * Add `missing_config` and possibly `live_viam_error` to `ViamMcpErrorCode`.
   * Keep `retryable: false` for now unless a clear retryable case is explicitly handled.
   * Redact SDK-originated messages before returning them through MCP or logging startup failures.
   * Do not expose stack traces.

5. Keep the `ViamClient` boundary small.
   * Keep the same three methods: `whoami`, `listMachines`, and `getRecentErrors`.
   * Do not add generic request methods.
   * Do not mirror the Viam API.
   * Update output types only as needed to support both fake and live mode, such as `mode: "fake" | "live"`.
   * Preserve existing output property names where possible.

6. Implement `LiveViamClient` in `src/viam/liveClient.ts`.
   * Create the SDK client with `createViamClient` and API key credentials.
   * Confirm the exact `Credentials` shape from installed types before coding. The docs identify `authEntity` as the API key ID and `payload` as the API key secret.
   * Use only the `appClient` read methods needed by the three interface methods.
   * Keep SDK objects private to the live client.
   * Convert SDK responses into the repo's compact `WhoamiResult`, `MachineSummary`, and `LogEntry` types.
   * Never return raw SDK objects.

7. Use a strict allowlist of live SDK calls.
   * Allowed for M2:
     * `createViamClient`
     * `viamClient.appClient.getOrganization`
     * `viamClient.appClient.listMachineSummaries`
     * `viamClient.appClient.getRobotPartLogs`
   * Possible fallback only if `listMachineSummaries` cannot provide enough typed data after implementation inspection:
     * `listLocations`
     * `listRobots`
   * Forbidden even though the SDK exposes them:
     * any `create*`, `update*`, `delete*`, `new*`, `mark*`, `rotate*`, `share*`, `unshare*`, role mutation, key mutation, fragment mutation, module mutation, `locationAuth`, `getRobotAPIKeys`, `tailRobotPartLogs`, and `connectToMachine`.

8. Implement `whoami` with live evidence.
   * Call `getOrganization(VIAM_ORG_ID)`.
   * Return `authenticated: true` only if the call succeeds.
   * Return `mode: "live"`.
   * Return the configured org ID and organization name from the API when available.
   * Use a non-secret subject such as `"viam-api-key"` or `"configured-api-key"`.
   * Do not return the API key ID or API key value.

9. Implement `listMachines` with compact summaries.
   * Prefer `listMachineSummaries(VIAM_ORG_ID, undefined, undefined, internalLimit)`.
   * Use an internal machine cap, such as 100, because the tool has no public limit input.
   * Map `LocationSummary.locationName`, `MachineSummary.machineId`, `MachineSummary.machineName`, and `PartSummary` status fields.
   * Derive `status` from `PartSummary.onlineState`:
     * all relevant parts online: `online`
     * all relevant parts offline: `offline`
     * mixed online/offline: `degraded`
     * awaiting setup or unspecified only: `unknown`
   * Derive `lastSeen` from the best available `lastAccess` or `lastOnline` timestamp. If none exists, keep the field present with `"unknown"` and record an `unknowns` entry at the tool level.
   * Do not treat online as healthy unless the API exposes health evidence. Prefer `health: "unknown"` for online machines and `health: "unhealthy"` only for direct offline/degraded/error evidence.
   * Build `issues` only from observed status evidence, such as offline parts or awaiting setup.
   * Do not include FQDNs, public IP addresses, configs, secrets, fragments, or raw part objects in output.

10. Implement `getRecentErrors` with finite log pages.
   * Use `listMachineSummaries` to find target machine part IDs and names.
   * If `machineId` is provided, scan only that machine.
   * For each selected part, call `getRobotPartLogs(partId, undefined, ["ERROR"], startDate, undefined, "")`.
   * Use `since` as the `start` date when provided and validated by the existing input normalizer.
   * Fetch at most one page per part unless a very small bounded second page is necessary to satisfy the requested global limit.
   * Apply an internal scan cap for machines and parts so large orgs cannot produce unbounded work or output.
   * Merge, normalize, sort newest first, and slice to the requested `limit`.
   * Map SDK `LogEntry` to the repo `LogEntry` shape:
     * stable local `id` composed from part ID, timestamp, and index if the SDK does not provide one
     * `machineId`
     * `machineName`
     * `resourceName` from `loggerName`, part name, or `"unknown"`
     * ISO `timestamp`
     * normalized `severity`
     * short `message`
     * `trustedAsInstruction: false`
   * Do not include `stack`, `caller`, arbitrary `fields`, host names, raw protobuf JSON, or raw SDK log entries.
   * Truncate long messages to a small documented maximum, such as 500 characters, and add an `unknowns`/limitation note if truncation happened.

11. Keep `viam_summarize_fleet_health` evidence-based.
    * Continue composing only `client.listMachines()` and `client.getRecentErrors()`.
    * Do not let the summary import or call the Viam SDK directly.
    * Prioritize inspect-first hints using offline/degraded status first, then recent error evidence.
    * Do not invent root causes.
    * Keep `unknowns` explicit for unsupported signals such as resource-level health, data sync status, config state, or logs skipped by internal caps.

12. Make tool descriptions and server instructions source-neutral.
    * Keep the same tool names and input schemas.
    * Remove hard-coded "fake M1" wording from server instructions, tool descriptions, and handler warning strings.
    * Keep instructions read-only and remind clients that machine names, resource names, and log messages are untrusted data.
    * It is fine for fake tests to still use `FakeViamClient`; the runtime `index.ts` should use `LiveViamClient`.

13. Update `src/index.ts` to start live mode by default.
    * Parse env config once at startup.
    * Instantiate `LiveViamClient`.
    * Connect over stdio only.
    * On missing config or startup failure, print a redacted short error to stderr and set a nonzero exit code.
    * Do not silently fall back to fake data when credentials are missing.

14. Keep fake-client tests as the normal test foundation.
    * Existing tests should continue to use `FakeViamClient` or tiny `ViamClient` test doubles.
    * Adjust expected warnings/unknowns if wording becomes source-neutral.
    * Keep exact tool registration tests.
    * Add tests proving handlers still route only through `ViamClient`.

15. Add live-client unit tests that do not call the network.
    * Test pure mapping behavior for online, offline, degraded, awaiting setup, empty locations, missing timestamps, long messages, and prompt-injection-like log messages.
    * If constructing SDK message classes is simple, use those classes; otherwise use narrow plain objects shaped like the typed SDK fields.
    * Do not instantiate `createViamClient` in normal unit tests.
    * Do not require env vars in normal unit tests.

16. Add opt-in live smoke tests.
    * The live smoke test file must skip unless all required env vars are present.
    * When skipped, it must not instantiate the SDK client or perform network access.
    * When env vars are present, run bounded checks:
      * `whoami()` returns live mode and the configured org ID.
      * `listMachines()` returns a structured array, possibly empty.
      * `getRecentErrors({ limit: 1 })` returns a structured bounded result and does not require actual errors to exist.
    * The smoke test must not print credentials, machine configs, raw API responses, or private logs.

17. Update docs honestly.
    * README should say M2 uses live Viam calls by default.
    * Document required env vars.
    * Tell users to store credentials in environment variables or local `.env` files that are not committed.
    * Mention that normal tests do not need credentials.
    * Mention live smoke tests skip without env vars.
    * Keep fake data described only as test support.
    * Keep limitations clear: read-only, bounded logs, no raw configs, no control, no unsupported clients.
    * `.env.example` should keep placeholders only.

18. Stop after M2.
    * Do not add Codex setup polish beyond what is needed to document live env variables. M3 owns dogfood setup.
    * Do not split tools into per-tool files unless `src/tools.ts` becomes hard to read.
    * Do not add future data-query, resources, config comparison, or diagnostic bundle tools.

## Validation steps

Run the required commands:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Then verify normal validation does not require credentials:

* Temporarily unset `VIAM_API_KEY_ID`, `VIAM_API_KEY`, and `VIAM_ORG_ID`.
* Run `npm test`.
* Confirm live smoke tests skip and no live network call is attempted.

Run opt-in live validation only with credentials already set in the local shell or local secret manager:

```bash
npm test -- test/liveClient.test.ts
```

If the live smoke tests are split into a separate file, run that file directly instead.

Suggested inspection commands:

```bash
git status --short
git diff --stat
rg -n "viam_whoami|viam_list_machines|viam_get_recent_errors|viam_summarize_fleet_health" src test README.md
rg -n "DoCommand|connectToMachine|tailRobotPartLogs|create[A-Z]|update[A-Z]|delete[A-Z]|newRobot|markPart|rotateKey|locationAuth|getRobotAPIKeys|listen|express|fastify|oauth" src test README.md package.json
rg -n "VIAM_API_KEY(_ID)?=.*[^replace\\-me]|Bearer [A-Za-z0-9]|Authorization:|secret|payload|authEntity|robotConfig|raw" src test README.md .env.example
```

Manual validation after build:

* Run `node dist/index.js` without env vars and confirm it fails with missing variable names only.
* Run `node dist/index.js` with env vars only if using it through an MCP client; do not paste secrets into chat or docs.
* Confirm stdout remains reserved for MCP stdio messages and startup errors go to stderr.

## Review prompts

Ask reviewers to check:

1. KISS / sprawl: Did M2 add only config, live client, minimal tests, and docs updates, or did it start becoming a framework?
2. Public MCP surface: Are the tool names and input schemas unchanged?
3. Client boundary: Do all tool handlers still call only the local `ViamClient` interface, with no direct SDK imports in `src/tools.ts` or `src/server.ts`?
4. SDK allowlist: Are live SDK calls limited to read-only methods needed for M2?
5. Security: Are there no write calls, no control calls, no `DoCommand`, no raw SDK response dumps, no secrets, and no unredacted SDK errors?
6. Output quality: Are live outputs structured, bounded, and evidence-preserving without returning raw configs or raw logs?
7. Log handling: Are logs bounded, newest first, error-only for `viam_get_recent_errors`, and marked `trustedAsInstruction: false`?
8. Docs honesty: Does README distinguish implemented live behavior from future M3 setup polish and avoid unsupported client claims?
9. Test quality: Do normal tests avoid credentials/network, while live smoke tests skip safely unless env vars are present?
10. Viam terminology/API accuracy: Are machine, part, location, organization, API key, and log concepts mapped according to official docs?

## Risks

* The TypeScript SDK credential shape may differ slightly from examples; use installed package types before coding.
* `listMachineSummaries` and related generated classes are marked deprecated in TypeDoc but still documented by the fleet API page; if the installed SDK points to a newer read-only replacement, use the newer typed read method and update this plan during implementation results.
* Live machine health may be less precise than fake M1 data; prefer `unknown` over invented health.
* Large organizations can produce too many machines, parts, or logs; internal caps are required because public inputs stay unchanged.
* `RobotPart` SDK objects can contain secret/config fields if fallback calls are used; never return raw part objects or serialize them for debugging.
* Live Viam SDK errors may include request metadata; all errors must pass through redaction.
* API key scope may be too narrow for org-wide listing; fail clearly without suggesting users paste secrets into chat.
* Updating runtime to require env vars may surprise anyone using fake M1 behavior manually; README must explain fake data is now test support, not default runtime.
* Live smoke tests can become flaky due to network or org permissions; keep them tiny and skip without env vars.

## Done when

M2 implementation is done when:

* Runtime server startup uses `LiveViamClient` with env credentials.
* Fake client remains available for tests.
* Exactly four MCP tools are registered.
* Tool names and input schemas are unchanged.
* All live Viam calls sit behind the existing `ViamClient` interface.
* Normal tests do not require credentials or network access.
* Live smoke tests skip safely without env vars.
* Live smoke tests can run with env vars present.
* SDK calls are read-only and allowlisted.
* No write, control, restart, mutation, arbitrary command, generic proxy, remote HTTP, scheduler, daemon, UI, or plugin behavior exists.
* Outputs are structured, bounded, and do not expose raw SDK responses.
* Errors are redacted and do not expose credentials.
* README documents live setup honestly.
* `.env.example` contains placeholders only.
* `npm test` passes.
* `npm run typecheck` passes.
* `npm run lint` passes.
* `npm run build` passes.
* No secrets or private Viam data are committed.

This planning task is done when:

* `PLAN-M2.md` exists.
* The plan is narrow.
* No implementation files were changed as part of planning.

## Human verification

Before approving M2 implementation, a human should:

1. Read `PLAN-M2.md` and confirm it stays limited to live read-only client wiring.
2. Confirm the public MCP tool surface remains the four existing tools.
3. Confirm the SDK allowlist excludes write/control methods.
4. Confirm the expected credential variables are correct for the intended Viam org/key setup.

After M2 implementation, a human should:

1. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` without credentials.
2. Confirm live smoke tests skip without credentials.
3. With a least-privilege Viam API key set in the local shell, run the live smoke test.
4. Inspect README and confirm it states unofficial, Codex-first, local-only, stdio-only, read-only live behavior.
5. Inspect tool output from a real org and confirm it is concise, bounded, redacted, and contains no raw configs, secrets, or raw API blobs.
6. Run the forbidden-call search from the validation section and confirm any matches are docs/tests discussing forbidden behavior, not production calls.

## Implementation results

Recorded on 2026-06-17 after implementing M2.

### What changed

* Added `@viamrobotics/sdk` as the only new runtime dependency.
* Added `src/config.ts` for `VIAM_API_KEY_ID`, `VIAM_API_KEY`, and `VIAM_ORG_ID` parsing.
* Added `src/viam/liveClient.ts` and kept all tool code behind the existing `ViamClient` interface.
* Updated `src/index.ts` so the runtime stdio server starts with the live Viam client by default.
* Kept the public MCP tool names and input schemas unchanged:
  * `viam_whoami`
  * `viam_list_machines`
  * `viam_get_recent_errors`
  * `viam_summarize_fleet_health`
* Preserved `FakeViamClient` for normal tests.
* Added unit tests for config parsing, live-client mapping/redaction, and skip-safe live smoke behavior.
* Updated `README.md` to document live env vars, bounded outputs, normal test behavior, and live smoke behavior.

### Verified SDK/API calls

M2 uses only these live SDK calls:

* `createViamClient({ credentials: { type: "api-key", authEntity, payload } })`
* `client.appClient.getOrganization(VIAM_ORG_ID)`
* `client.appClient.listMachineSummaries(VIAM_ORG_ID, undefined, undefined, 100)`
* `client.appClient.getRobotPartLogs(partId, undefined, ["ERROR"], sinceDate)`

The live client maps only bounded, selected fields from:

* `Organization.id`
* `Organization.name`
* `LocationSummary.locationName`
* `MachineSummary.machineId`
* `MachineSummary.machineName`
* `MachineSummary.partSummaries`
* `PartSummary.partId`
* `PartSummary.partName`
* `PartSummary.onlineState`
* `PartSummary.lastAccess`
* `PartSummary.lastOnline`
* `LogEntry.level`
* `LogEntry.time`
* `LogEntry.loggerName`
* `LogEntry.message`

It does not return raw SDK responses, credentials, host fields, log stacks, full machine configs, IP addresses, DNS names, fragments, or unbounded log pages.

### Validation results

Required checks:

```bash
npm test
# Passed: 21 tests, 1 live smoke test skipped because live env vars were absent.

npm run typecheck
# Passed.

npm run lint
# Passed.

npm run build
# Passed.
```

Live smoke:

* `VIAM_API_KEY_ID`, `VIAM_API_KEY`, and `VIAM_ORG_ID` were not present in this shell.
* The live smoke test skipped during `npm test`.
* No live Viam network call was attempted in normal validation.
* The live smoke test should be run separately only when all three env vars are already set:

```bash
npm test -- test/liveSmoke.test.ts
```

Safety inspection:

* A forbidden-call grep found no production use of `DoCommand`, `connectToMachine`, `tailRobotPartLogs`, write/mutation APIs, remote HTTP frameworks, or OAuth.
* Matches for `create*` were limited to local factory names and the allowed `createViamClient` SDK constructor.
* Secret-like grep matches were limited to synthetic redaction tests, README safety wording, redaction code, and the required SDK credential fields inside `createLiveViamClient`.

### Human verification still needed

1. Create or choose a least-privilege Viam API key with read access to the intended org.
2. Set `VIAM_API_KEY_ID`, `VIAM_API_KEY`, and `VIAM_ORG_ID` in the local shell without pasting them into chat.
3. Run `npm test -- test/liveSmoke.test.ts`.
4. Build with `npm run build` and run `node dist/index.js` as a local stdio MCP server from Codex.
5. Call each of the four tools and confirm outputs are structured, bounded, and contain no credentials, raw configs, raw host stacks, IP addresses, DNS names, or raw API blobs.
6. Confirm the Viam org has expected machines or accept empty structured arrays if the org is empty.

### Remaining risks

* Live smoke was not executed in this environment because the required env vars were absent.
* The M2 health summary uses machine part online-state evidence only; resource-level health, data sync state, and full config comparison remain unknowns.
* `getRobotPartLogs` is intentionally first-page and capped by part scan count plus output limit; it may omit older or paginated errors by design.
