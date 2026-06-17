# AGENTS.md

Repository instructions for Codex.

## Project

This repo is `viam-community-mcp`: an unofficial community MCP server for inspecting and diagnosing Viam robotics fleets from Codex.

This project is not affiliated with, endorsed by, or supported by Viam.

V0 is:

* Codex-first
* local-only
* stdio-only
* read-only
* TypeScript
* small enough to understand in one sitting

Other MCP clients may work later, but do not claim support for Claude Code, Cursor, ChatGPT, or any other client until that path is implemented, tested, and documented.

## Mission

Build the smallest useful MCP server that lets Codex inspect a Viam robotics fleet and answer:

> What machines exist, what looks unhealthy, what recent errors exist, and what should I inspect first?

The product is not “AI controls robots.”

The product is:

> Agent-native inspection and diagnosis for Viam robotics fleets.

Inspection before action.

## Hard scope

Allowed in V0:

* local stdio MCP server
* TypeScript
* explicit MCP tools
* explicit schemas
* fake Viam client for tests
* live Viam client behind a small interface
* environment-variable credentials
* read-only fleet/machine/log/data inspection
* concise structured outputs
* README
* SECURITY.md
* tests
* lint/typecheck/build scripts
* Codex setup docs

Forbidden in V0:

* robot control
* motor/base/arm/camera movement tools
* arbitrary `DoCommand`
* machine restart
* config mutation
* fragment mutation
* data deletion
* module deployment
* hosted server
* remote HTTP server
* OAuth
* UI
* daemon
* scheduler
* agent loop
* Viam module
* Viam driver
* generic Viam API proxy
* dynamic tool generation
* plugin framework
* dependency-injection framework
* support claims for clients other than Codex

If a requested change violates this scope, stop and explain the smallest safer alternative.

## Product naming

Default names:

* repo: `viam-community-mcp`
* package: `viam-community-mcp`
* CLI binary: `viam-mcp`
* server display name: `Viam Community MCP`

Do not use names that imply official Viam support.

Avoid:

* `viam-official-*`
* `viam-platform-*`
* `viam-cloud-*`
* `viam-ops-*` if it sounds too official
* vague names like `viam-dev-mcp` unless the README makes the unofficial community status unmistakable

If the repo name changes, update package metadata and docs only. Do not broaden product scope.

## Operating mode for Codex

For every non-trivial task, use this shape:

```text
Goal:
Context:
Constraints:
Done when:
```

Before editing code, state:

1. the goal
2. the files likely to change
3. what will be verified
4. what is explicitly out of scope

Then implement.

Do not ask for clarification unless blocked by destructive ambiguity, missing credentials, or conflicting instructions. Prefer the smallest reversible assumption and state it.

## Execution loop

Use this loop:

1. Read relevant files.
2. Plan the smallest change.
3. Patch.
4. Run checks.
5. Fix failures.
6. Self-review.
7. Report changed files, commands run, failures, and remaining risks.

Do not skip validation unless impossible. If impossible, say exactly why.

Required checks before declaring done:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

If a script does not exist yet, add the smallest reasonable script or explain why it is deferred.

## Milestone discipline

This repo is built by milestones, not open-ended coding.

Expected milestones:

* M0 — repo rails
* M1 — fake-client MCP tools
* M2 — live Viam client
* M3 — Codex dogfood
* M4 — public release polish
* M5 — better engineering pass

Do not implement a later milestone while working on an earlier one.

Do not add “while we are here” features.

A milestone is done only when:

* the requested behavior works
* tests pass
* docs match behavior
* unsupported claims are absent
* no secrets are present
* the diff is smaller than expected, not larger

## File discipline

Prefer fewer files.

A new file must earn its existence.

Create a file only when it gives a clear boundary:

* MCP server setup
* tool implementation
* Viam client interface
* fake client
* live client
* config/env parsing
* redaction/errors
* tests

Do not create architecture folders for future features.

Avoid:

* `core/`
* `framework/`
* `plugins/`
* `orchestrator/`
* `runtime/`
* `managers/`
* `services/` unless there are real services
* abstract registries
* generic factories
* one-method classes

V0 code should be boring functions over clever objects.

## Preferred repo shape

Use this as the target shape unless implementation proves it wrong:

```text
.
├── AGENTS.md
├── PLAN.md
├── REVIEW.md
├── README.md
├── SECURITY.md
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── eslint.config.js
├── .gitignore
├── .env.example
├── src
│   ├── index.ts
│   ├── server.ts
│   ├── config.ts
│   ├── errors.ts
│   ├── redaction.ts
│   ├── tools
│   │   ├── whoami.ts
│   │   ├── machines.ts
│   │   ├── logs.ts
│   │   ├── data.ts
│   │   └── fleetHealth.ts
│   └── viam
│       ├── client.ts
│       ├── fakeClient.ts
│       └── liveClient.ts
└── test
    ├── config.test.ts
    ├── redaction.test.ts
    ├── tools.test.ts
    └── fleetHealth.test.ts
```

This is a ceiling, not a quota. Fewer files is better if clarity survives.

## Coding style

Use plain TypeScript.

Prefer:

* explicit functions
* explicit input/output types
* small modules
* direct data flow
* Zod or the MCP SDK’s stable schema mechanism
* deterministic fake data
* simple error types
* tests that read like examples

Avoid:

* inheritance
* decorators
* clever generics
* dependency injection containers
* dynamic imports
* broad utility libraries
* global mutable state
* hidden environment reads deep in business logic
* raw API response dumping

A function over roughly 80 lines should be treated as suspicious. It may be fine, but review it.

An abstraction with one caller is guilty until proven useful.

## Dependency policy

Dependencies are expensive.

Runtime dependencies must be justified.

Allowed expected dependencies:

* MCP TypeScript SDK
* Viam SDK/client package if needed
* Zod or equivalent schema validation if required by the MCP SDK path

Allowed expected dev dependencies:

* TypeScript
* Vitest
* ESLint
* Prettier only if already chosen deliberately

Do not add frameworks.

Do not add logging libraries in V0 unless console/error handling becomes insufficient.

Do not copy examples from unstable SDK branches. Use the installed package types and stable docs as source of truth.

## MCP tool design

Expose a tiny, legible tool surface.

Initial V0 tools:

* `viam_whoami`
* `viam_list_machines`
* `viam_get_recent_errors`
* `viam_summarize_fleet_health`

Potential later tools, not V0 unless explicitly planned:

* `viam_get_machine_status`
* `viam_list_machine_resources`
* `viam_get_machine_logs`
* `viam_search_machine_logs`
* `viam_get_latest_sensor_readings`
* `viam_query_data`
* `viam_compare_configs`
* `viam_export_diagnostic_bundle`

Each tool must have:

* stable name
* concise description
* explicit input schema
* predictable output shape
* redacted error behavior
* fake-client test coverage
* no write behavior

Tool descriptions should help the model decide when to call the tool.

Bad description:

> Calls Viam API.

Good description:

> Lists Viam machines visible to the configured credentials, returning IDs, names, locations, and basic health fields when available.

## MCP output rules

Return structured, model-legible results.

Bad:

```json
{
  "raw": "{ huge API blob }"
}
```

Good:

```json
{
  "machineCount": 3,
  "offlineMachines": [
    {
      "id": "machine-2",
      "name": "greenhouse-pi-02",
      "lastSeen": "2026-06-17T14:03:00Z"
    }
  ],
  "recentErrors": [
    {
      "machineId": "machine-2",
      "timestamp": "2026-06-17T14:01:00Z",
      "message": "module exited with status 1"
    }
  ],
  "unknowns": [
    "Data sync status not available from current client implementation."
  ]
}
```

Preserve evidence:

* machine IDs
* machine names
* timestamps
* severities
* short error messages
* relevant resource names

Do not invent diagnosis. If the server lacks evidence, return `unknowns`.

## Viam client boundary

All tools must call through a `ViamClient` interface.

Tools must not directly import or call the live Viam SDK.

Expected interface shape should stay small and earned by tools.

Example:

```ts
export interface ViamClient {
  whoami(): Promise<WhoamiResult>;
  listMachines(): Promise<MachineSummary[]>;
  getRecentErrors(input: RecentErrorsInput): Promise<LogEntry[]>;
}
```

Do not mirror the entire Viam API.

Do not expose generic request methods.

Do not add write methods in V0.

## Fake client policy

Tests use `FakeViamClient`.

The fake client should be:

* deterministic
* tiny
* realistic enough to catch basic mistakes
* easy to read
* not a second implementation of Viam

Fake data must not contain real private org IDs, machine IDs, API keys, locations, or logs.

Fake data should include:

* at least two machines
* at least one healthy machine
* at least one unhealthy/offline machine
* at least one error log
* at least one non-error log
* at least one empty-state case in tests

## Live client policy

Live Viam calls come after fake-client tools work.

Live tests must be opt-in.

Normal test runs must not require credentials or network access.

The server reads credentials from environment variables:

* `VIAM_API_KEY_ID`
* `VIAM_API_KEY`
* `VIAM_ORG_ID`

Optional variables may be added only when needed and documented.

Never prompt the model/user to paste secrets into chat.

Never log credential values.

Never include credential values in thrown errors.

## Security rules

Default posture: read-only and local.

Never commit:

* `.env`
* API keys
* private machine IDs
* private org IDs
* private logs
* raw API responses from a real org
* screenshots containing secrets

Redact suspicious values in errors and diagnostics.

Redaction must cover at least:

* `VIAM_API_KEY`
* `VIAM_API_KEY_ID`
* bearer tokens
* long opaque token-like strings when practical

If redaction is uncertain, prefer omitting the value.

No tool may:

* mutate Viam config
* mutate fragments
* move hardware
* restart services
* delete data
* call arbitrary commands
* deploy modules
* write files outside explicit local diagnostic output paths

## Error handling

Errors should be clear, short, and safe.

Prefer this shape internally:

```ts
{
  code: "missing_config",
  message: "VIAM_API_KEY_ID, VIAM_API_KEY, and VIAM_ORG_ID are required.",
  retryable: false
}
```

Do not expose stack traces through MCP tool responses unless running in an explicit development mode.

Do not swallow errors and return fake success.

If live Viam support is incomplete, fail clearly:

> Live Viam client is not implemented for this method yet.

Do not pretend live behavior works.

## Testing policy

Every MCP tool needs tests.

Test behavior, not implementation details.

Required test categories:

* config parsing
* missing env vars
* redaction
* fake-client tool success
* empty states
* recent error filtering
* fleet health summary
* no secret leakage in errors

Normal tests must not call live Viam.

Live smoke tests, if present, must skip unless required env vars exist.

Do not weaken tests to make implementation pass.

## Documentation policy

README must be honest.

README must include:

* unofficial status
* Codex-first support
* what this server does
* what this server does not do
* install/run instructions
* environment variables
* Codex MCP setup
* implemented tool list
* example prompts
* safety model
* limitations
* development commands

Do not claim:

* official Viam support
* Claude Code support
* Cursor support
* ChatGPT support
* remote MCP support
* production readiness
* write-operation support
* actuator safety beyond what exists

Roadmap must be clearly labeled as roadmap.

No fake transcripts.

No fake screenshots.

No private data in docs.

## README tone

Use direct, plain language.

Good:

> `viam-community-mcp` is an unofficial read-only MCP server that lets Codex inspect Viam machines, recent errors, and fleet health.

Bad:

> A powerful next-generation autonomous robotics operations framework for AI-native embodied intelligence.

If a sentence sounds like a startup landing page, delete it.

## Planning files

Use `PLAN.md` for the project plan.

Use `PLAN-M0.md`, `PLAN-M1.md`, etc. for milestone plans.

When planning a milestone:

1. Read `AGENTS.md`, `PLAN.md`, and `REVIEW.md`.
2. Inspect the repo.
3. Write the plan file.
4. Do not implement.
5. Keep the plan narrow.
6. Include validation steps.
7. Include review prompts.
8. Include non-goals.
9. Include human verification steps.

When implementing a milestone:

1. Read the relevant plan file.
2. Implement only that plan.
3. Run checks.
4. Update the plan file with validation results.
5. Report changed files and remaining risks.

## Review policy

Use reviews to cut, not expand.

Subagents are for isolated review after implementation, not for initial architecture.

Preferred review dimensions:

1. KISS / code sprawl
2. correctness
3. security / secrets / unsafe tools
4. MCP usability
5. docs honesty
6. Viam terminology/API accuracy
7. test quality

Reviewers must not edit code unless explicitly instructed.

Reviewers must not propose new features.

Reviewers should cite files and lines.

Reviewers should rank findings by severity:

* blocker
* high
* medium
* low
* nit

Fix blockers and high-severity findings before continuing.

Defer medium/low/nit unless they prevent a clean V0.

## Self-review checklist

Before declaring a task done, check:

* Did I stay inside the milestone?
* Did I add only necessary files?
* Did I add only necessary dependencies?
* Do all tools go through `ViamClient`?
* Are all tools read-only?
* Are outputs structured and concise?
* Are errors redacted?
* Do tests avoid live credentials?
* Does README describe only what works?
* Are unsupported clients avoided?
* Are secrets absent?
* Do all required commands pass?

If not, fix or report the gap.

## Sprawl alarms

Stop and report if any of these happen:

* V0 exceeds the planned tool list without explicit approval
* production code exceeds roughly 10 files before M2
* a tool bypasses `ViamClient`
* tests require live credentials
* a new abstraction has one caller
* a generic registry appears
* a plugin system appears
* dynamic tool generation appears
* README claims support not tested
* a write/mutation method appears
* raw API responses are returned directly
* errors might contain secrets
* implementation starts resembling a framework

The correct response to sprawl is deletion, not organization.

## Git policy

Use one branch per milestone.

Suggested branch names:

* `m0-repo-rails`
* `m1-fake-client-tools`
* `m2-live-viam-client`
* `m3-codex-dogfood`
* `m4-release-polish`
* `m5-better-engineering`

Suggested commit messages:

* `Scaffold Codex-first MCP server`
* `Add fake-client Viam MCP tools`
* `Wire read-only Viam live client`
* `Document Codex MCP setup`
* `Prepare initial public release`
* `Simplify V0 architecture`

Do not mix milestones in one commit.

## Definition of done

A change is done only when:

* implementation matches the requested goal
* no extra features were added
* tests pass
* typecheck passes
* lint passes
* build passes
* docs match behavior
* no secrets are present
* no unsupported claims are present
* changed files are reported
* validation commands are reported
* remaining risks are stated

Partial completion is acceptable only if clearly labeled.

Fake completeness is not acceptable.
