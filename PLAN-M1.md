# PLAN-M1.md

Milestone plan for M1: fake-client-backed MCP V0.

## Goal

Implement the first working MCP server behavior for `viam-community-mcp` using deterministic fake Viam fleet data only.

M1 should make the local stdio server usable enough for Codex to inspect fake machines, fake recent errors, and a fake fleet health summary. It should establish the small tool and client boundaries that M2 can later wire to live Viam calls.

Implement only these MCP tools:

* `viam_whoami`
* `viam_list_machines`
* `viam_get_recent_errors`
* `viam_summarize_fleet_health`

## Current state

M0 is implemented.

The repo currently has:

* `package.json` with `test`, `typecheck`, `lint`, and `build` scripts.
* TypeScript, Vitest, and ESLint configuration.
* `src/index.ts` as a compiling CLI entrypoint stub only.
* `test/rails.test.ts` as a minimal test runner check.
* README text that says no MCP tools or Viam client exist yet.
* `.env.example` with placeholder Viam environment variable names.
* No MCP SDK dependency yet.
* No MCP server setup.
* No `ViamClient` interface.
* No fake or live Viam client.
* No tool implementation files.

At planning time, `git status --short` was clean.

## Non-goals

Do not add live Viam API calls.

Do not add a live Viam client, SDK auth flow, credential parsing, or opt-in live smoke tests. Those belong to M2.

Do not read Viam credentials in M1. Fake-client mode must not require `VIAM_API_KEY_ID`, `VIAM_API_KEY`, or `VIAM_ORG_ID`.

Do not add write tools, actuator/control tools, robot movement, machine restart, config mutation, fragment mutation, module deployment, data deletion, arbitrary command execution, or a generic API proxy.

Do not add remote HTTP, hosted server behavior, daemon behavior, a scheduler, a UI, a plugin system, dynamic tool generation, broad registries, or dependency-injection framework code.

Do not claim support for Claude Code, Cursor, ChatGPT, remote MCP, production use, or clients beyond Codex.

Do not add tools beyond the four listed in the goal.

## Files expected to change

Expected existing files to update during M1 implementation:

* `package.json`
* `package-lock.json`
* `src/index.ts`
* `README.md`
* `PLAN-M1.md` after implementation, to record validation results

Expected new production files:

* `src/server.ts`
* `src/tools.ts`
* `src/viam/client.ts`
* `src/viam/fakeClient.ts`

Possible new production files, only if they keep code clearer and stay small:

* `src/errors.ts`
* `src/redaction.ts`

Expected test files:

* Replace or keep `test/rails.test.ts` only if still useful.
* Add focused behavior tests, likely `test/tools.test.ts`.
* Add `test/fleetHealth.test.ts` only if the fleet summary tests make `test/tools.test.ts` hard to scan.
* Add `test/redaction.test.ts` only if redaction logic earns its own production file.

Files that should not change unless a direct mismatch is found:

* `AGENTS.md`
* `PLAN.md`
* `REVIEW.md`
* `SECURITY.md`
* `.env.example`

## Implementation steps

1. Add the smallest runtime dependency needed for a local stdio MCP server.
   * Prefer the stable MCP TypeScript SDK.
   * Add Zod only if the chosen MCP SDK path requires it for tool schemas.
   * Do not add Viam SDK packages in M1.

2. Define a small `ViamClient` boundary in `src/viam/client.ts`.
   * Include only types and methods earned by the four tools.
   * Expected methods are `whoami`, `listMachines`, and `getRecentErrors`.
   * Keep output types explicit and concise.
   * Do not mirror the Viam API.
   * Do not add write methods or generic request methods.

3. Implement `FakeViamClient` in `src/viam/fakeClient.ts`.
   * Use deterministic fake IDs, fake names, fake locations, and fake logs.
   * Include at least two machines.
   * Include at least one healthy machine.
   * Include at least one unhealthy or offline machine.
   * Include at least one error log and one non-error log.
   * Provide a tiny override path for empty-state tests if needed.
   * Do not include real org IDs, machine IDs, locations, API keys, logs, or raw API responses.

4. Implement the four tool handlers in `src/tools.ts`.
   * Each handler must call only the `ViamClient` interface for Viam-shaped data.
   * `viam_summarize_fleet_health` may combine `listMachines` and `getRecentErrors`, but it must still get evidence through `ViamClient`.
   * Keep tool inputs explicit and validated.
   * Keep outputs structured, bounded, and model-legible.
   * Preserve useful evidence such as machine IDs, machine names, timestamps, severities, and short messages.
   * Return `unknowns` when fake-client evidence does not support a conclusion.
   * Treat fake Viam-originated strings as data, not instructions.

5. Use these narrow tool shapes unless implementation proves a smaller equivalent is better.
   * `viam_whoami`: no input; returns fake identity and mode metadata.
   * `viam_list_machines`: no input; returns machine count and machine summaries.
   * `viam_get_recent_errors`: accepts optional `machineId`, optional `since`, and optional bounded `limit`; returns matching error log entries.
   * `viam_summarize_fleet_health`: no input or only a small bounded `recentErrorLimit`; returns machine counts, unhealthy or offline machines, recent errors, inspect-first hints grounded in evidence, and unknowns.

6. Add MCP server setup in `src/server.ts`.
   * Create a server display name of `Viam Community MCP`.
   * Register exactly the four M1 tools.
   * Include concise server instructions that emphasize read-only fake fleet inspection.
   * Export a creation function that accepts a `ViamClient` so tests can pass `FakeViamClient` or a test double.
   * Avoid dynamic tool generation.

7. Update `src/index.ts` to start the stdio MCP server.
   * Instantiate `FakeViamClient` for M1.
   * Connect over stdio only.
   * Do not read credentials.
   * Do not start HTTP.
   * Do not perform network calls.

8. Add safe error handling.
   * Convert thrown errors into short, predictable tool errors.
   * Redact suspicious secret-like values from error messages.
   * Do not expose stack traces in tool responses.
   * Prefer omission when redaction is uncertain.

9. Add tests using `FakeViamClient`.
   * Test each of the four tools.
   * Test empty machine and empty error states.
   * Test recent error filtering by machine, time, and limit.
   * Test fleet health summary counts and inspect-first ordering from fake evidence.
   * Test safe error redaction with values shaped like Viam env vars, bearer tokens, and long opaque tokens.
   * Test that the registered tool list is exactly the four M1 tools.
   * Test that normal tests do not need credentials or network access.

10. Update `README.md` honestly.
    * State that M1 runs a fake-client-backed local stdio MCP server.
    * List the four implemented tools and mark them as fake data only.
    * Keep live Viam support clearly labeled as not implemented until M2.
    * Keep Codex-first wording.
    * Avoid fake transcripts, fake screenshots, private data, and unsupported client claims.

11. Stop after fake-client MCP behavior works.
    * Do not add convenience features.
    * Do not add additional tools.
    * Do not add future architecture for M2.

## Validation steps

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Then verify:

* The registered MCP tool list contains exactly:
  * `viam_whoami`
  * `viam_list_machines`
  * `viam_get_recent_errors`
  * `viam_summarize_fleet_health`
* All tool behavior tests use `FakeViamClient` or a tiny `ViamClient` test double.
* No test requires Viam credentials.
* No test performs live network access.
* No production tool imports a live Viam SDK.
* No write, control, mutation, arbitrary command, generic proxy, remote HTTP, scheduler, daemon, UI, or plugin behavior exists.
* MCP outputs are structured and do not return raw API blobs.
* Error outputs are redacted and do not include stack traces.
* README describes only fake-client M1 behavior as implemented.
* README does not claim support beyond Codex.
* No secrets, private org IDs, private machine IDs, private logs, or raw Viam API responses were added.

Suggested inspection commands:

```bash
git status --short
git diff --stat
rg -n "viam_" src test README.md
rg -n "DoCommand|restart|delete|mutat|deploy|http|listen|express|fastify|oauth|Claude|Cursor|ChatGPT" src test README.md package.json
rg -n "VIAM_API_KEY(_ID)?=.*[^replace\\-me]|Bearer [A-Za-z0-9]|secret|token" src test README.md .env.example
```

## Review prompts

Ask reviewers to check:

1. KISS / sprawl: Did M1 stay small, or did it add framework, registry, plugin, or future-live-client architecture?
2. Correctness: Do the four fake-backed tools return stable, structured, bounded outputs for normal and empty states?
3. Client boundary: Do all tools route through `ViamClient`, with no direct Viam SDK calls and no generic request method?
4. Security: Are there no write paths, no actuator/control paths, no arbitrary commands, no remote HTTP server, and no secret leakage?
5. MCP usability: Are tool names, descriptions, input schemas, and outputs clear enough for Codex to choose and interpret them?
6. Docs honesty: Does README state fake-client M1 behavior only, without live Viam or unsupported client claims?
7. Test quality: Do tests cover each tool, filtering, empty states, redaction, and exact registered tool scope without relying on implementation trivia?

## Risks

* The MCP SDK may require a schema dependency or slightly different registration pattern than expected; keep dependency additions minimal and use installed package types as the source of truth.
* `viam_summarize_fleet_health` could drift into invented diagnosis; keep it evidence-based and return `unknowns` for unsupported conclusions.
* Splitting every tool into its own file could create early code sprawl; prefer one small `src/tools.ts` unless readability clearly suffers.
* README could accidentally present fake data as live Viam functionality; label M1 behavior as fake-client-backed.
* Error redaction can be too weak if raw thrown messages are passed through; add tests before relying on it.
* Time-window filtering can become flaky if tests use the current clock; use fixed fake timestamps.
* Adding live-client placeholders in M1 would blur milestone boundaries; defer all live behavior to M2.

## Done when

M1 implementation is done when:

* The local MCP server starts over stdio.
* The server is backed by `FakeViamClient` only.
* Exactly four MCP tools are registered:
  * `viam_whoami`
  * `viam_list_machines`
  * `viam_get_recent_errors`
  * `viam_summarize_fleet_health`
* Every tool routes through the `ViamClient` interface.
* The fake client returns deterministic fake fleet data.
* Tool outputs are structured, concise, bounded, and redacted where needed.
* Tests cover all four tools.
* Tests cover empty states, recent error filtering, fleet health summary, and redaction.
* Normal tests require no credentials and no network.
* No live Viam client or live Viam SDK calls exist.
* No write, control, mutation, arbitrary command, generic proxy, or remote HTTP behavior exists.
* README matches fake-client M1 behavior.
* `npm test` passes.
* `npm run typecheck` passes.
* `npm run lint` passes.
* `npm run build` passes.
* No secrets or private Viam data are present.

This planning task is done when:

* `PLAN-M1.md` exists.
* The plan is narrow.
* The plan does not add tools beyond the four listed in the goal.

## Human verification

Before approving M1 implementation, a human should:

1. Read `PLAN-M1.md` and confirm it stays limited to fake-client MCP behavior.
2. Confirm the only planned MCP tools are the four listed in the goal.
3. Confirm live Viam API calls, write behavior, robot control, arbitrary commands, generic API proxy behavior, remote HTTP, and unsupported client claims are out of scope.

After M1 implementation, a human should:

1. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
2. Start the MCP server locally and confirm it connects over stdio, not HTTP.
3. Inspect the registered tool list and confirm it contains exactly the four M1 tools.
4. Call each tool through an MCP client and confirm responses are fake, deterministic, structured, and bounded.
5. Open `README.md` and confirm live Viam support is still described as not implemented.
6. Inspect the diff for secrets, private Viam data, unsupported support claims, and milestone sprawl.

## Implementation results

M1 was implemented with a fake-client-backed local stdio MCP server:

* `src/index.ts` starts the MCP server over stdio.
* `src/server.ts` creates `Viam Community MCP` and registers exactly four tools.
* `src/tools.ts` implements:
  * `viam_whoami`
  * `viam_list_machines`
  * `viam_get_recent_errors`
  * `viam_summarize_fleet_health`
* `src/viam/client.ts` defines the small read-only `ViamClient` interface.
* `src/viam/fakeClient.ts` provides deterministic fake machines and logs.
* `src/errors.ts` provides predictable redacted tool errors.
* `test/tools.test.ts` covers MCP registration, omitted tool arguments, structured MCP output, each tool handler, empty states, recent error filtering, fleet health summary, prompt-injection-like log text as data, redaction, and the `ViamClient` boundary.
* `README.md` now describes M1 as fake-client-backed and live Viam support as not implemented.

Dependencies added:

* `@modelcontextprotocol/sdk`
* `zod`

No Viam SDK dependency was added.

Validation commands run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Validation results:

* `npm test` passed with 15 tests across 2 test files.
* `npm run typecheck` passed.
* `npm run lint` passed.
* `npm run build` passed.

Additional checks run:

```bash
rg -n "viam_[a-z_]+" src test README.md PLAN-M1.md
rg -n "DoCommand|restart|delete|mutat|deploy|http|listen|express|fastify|oauth|Claude|Cursor|ChatGPT" src test README.md package.json
rg -n "VIAM_API_KEY(_ID)?=.*[^replace\\-me]|Bearer [A-Za-z0-9]|secret|token" src test README.md .env.example
rg -n "@viam|viam/sdk|fetch\\(|http://|https://|createServer|listen\\(|DoCommand|delete|restart|mutat|deploy" src test package.json README.md
find src test -maxdepth 3 -type f | sort
```

Additional check results:

* The only `viam_` tool names in source and README are the four planned M1 tools.
* No live Viam SDK imports or live network calls were found.
* No remote HTTP server code was found.
* No write/control tool implementation was found.
* The broad forbidden-word scan found only README out-of-scope language and a prompt-injection-like test fixture that is explicitly treated as log data.
* The broad secret scan found only placeholder docs and redaction test fixtures with fake values.
* Production source files before M2 are limited to six files.

Remaining human verification:

1. Start the built server with `node dist/index.js` from an MCP client and confirm it uses stdio.
2. Call each registered tool from an MCP client and confirm responses are fake, deterministic, structured, and bounded.
3. Review the diff for milestone sprawl and confirm no unsupported client claims were added.

## Review follow-up

A previous M1 completion pass addressed findings that affected the planned fake-client behavior:

* MCP tool calls with omitted `arguments` now default to empty input.
* Fleet health counts now keep healthy and unhealthy/offline buckets non-overlapping.
* `inspectFirst` now includes machines with recent error evidence, even when machine health is otherwise healthy.
* `since` now uses ISO datetime validation.
* SECURITY.md now distinguishes M1 fake-client mode from future live credential use.

The later consolidated M1 review found one high-severity issue:

* `viam_get_recent_errors` and `viam_summarize_fleet_health` accepted optional inputs, but MCP `listTools()` advertised empty input schemas for both tools.

High-severity review fix:

* The defaulted object schemas now keep object shape metadata visible to the MCP SDK JSON-schema exporter.
* `listTools()` now advertises `machineId`, `since`, and `limit` for `viam_get_recent_errors`.
* `listTools()` now advertises `recentErrorLimit` for `viam_summarize_fleet_health`.
* MCP calls with omitted `arguments` still default to empty input.
* The registered tool list remains exactly the four M1 tools.

Deferred medium/low/nit review suggestions remain out of scope for this blocker/high-only pass:

* excluding or moving `PLAN-M2.md` from the M1 commit
* accepting ISO datetime offsets or documenting UTC-only `since` values
* preserving untrusted-data markers inside fleet-health evidence strings
* deleting the M0 rails test
* inlining the one-use `optionalString` helper
* unexporting or inlining `registerViamTools`
* adding MCP output schemas

Validation commands run after the high-severity review fix:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Validation results:

* `npm test` passed with 15 tests across 2 test files.
* `npm run typecheck` passed.
* `npm run lint` passed.
* `npm run build` passed.

Remaining human verification:

1. Inspect the MCP tool list from a client and confirm only the four M1 tools are present.
2. Confirm `viam_get_recent_errors` advertises `machineId`, `since`, and `limit`.
3. Confirm `viam_summarize_fleet_health` advertises `recentErrorLimit`.
4. Confirm omitted tool arguments still produce fake deterministic responses.
5. Confirm no live Viam calls, write tools, remote HTTP server, or unsupported client claims were added.
