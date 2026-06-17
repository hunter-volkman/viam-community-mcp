# PLAN.md

Project plan for `viam-community-mcp`.

## Project stance

`viam-community-mcp` is an unofficial community MCP server for inspecting and diagnosing Viam robotics fleets from Codex.

V0 is Codex-first, local-only, stdio-only, and read-only.

This repo is not affiliated with, endorsed by, or supported by Viam.

## Product rule

Inspection before action.

V0 must help Codex answer:

> What machines exist, what looks unhealthy, what recent errors exist, and what should I inspect first?

V0 must not control hardware, mutate config, restart machines, update fragments, delete data, or expose arbitrary `DoCommand`.

## Scope lock

Allowed in V0:

* TypeScript
* local stdio MCP server
* fake Viam client for tests
* live Viam client behind a small interface
* environment-variable credentials
* read-only tools
* README
* SECURITY.md
* tests
* lint/typecheck/build scripts

Forbidden in V0:

* remote HTTP server
* OAuth
* hosted service
* UI
* Viam module
* Viam driver
* write tools
* actuator tools
* generic API proxy
* plugin system
* dynamic tool generation
* broad framework abstractions
* Claude Code support claims
* Cursor support claims
* unsupported package claims
* fake examples from private data

## Milestones

### M0 — Repo rails

Goal: create the smallest disciplined project skeleton.

Deliverables:

* `AGENTS.md`
* `PLAN.md`
* `REVIEW.md`
* `README.md`
* `SECURITY.md`
* `.gitignore`
* `.env.example`
* TypeScript package scaffold
* test/lint/typecheck/build scripts
* empty but compiling `src/index.ts`

Done when:

* `npm run build` passes
* `npm run typecheck` passes
* `npm run lint` passes
* `npm test` passes
* README states only the intended V0 scope
* no MCP tools exist yet

### M1 — Fake-client MCP V0

Goal: implement a working MCP server with fake-client-backed read-only tools.

Tools:

* `viam_whoami`
* `viam_list_machines`
* `viam_get_recent_errors`
* `viam_summarize_fleet_health`

Requirements:

* all tools route through a `ViamClient` interface
* tests use `FakeViamClient`
* no real Viam network calls in normal tests
* outputs are structured and model-legible
* errors are predictable and redacted
* no write tools exist

Done when:

* MCP server starts locally over stdio
* fake tools return deterministic results
* tests cover each tool
* build/typecheck/lint/test pass
* README tool list matches implementation

### M2 — Live Viam client

Goal: wire real Viam read-only calls behind the existing client interface.

Requirements:

* keep fake tests
* add opt-in live smoke test only when env vars exist
* use official Viam SDK/API docs as source of truth
* preserve tool schemas unless a real API mismatch requires a correction
* do not expose raw credentials
* do not dump unbounded raw API responses

Done when:

* fake tests still pass
* live smoke test skips safely without credentials
* live smoke test can run with credentials
* README documents live setup honestly
* no write operations exist

### M3 — Codex dogfood

Goal: make this server easy to use from Codex.

Requirements:

* local Codex setup instructions
* example `codex mcp add` command
* example `.codex/config.toml` snippet if useful
* example prompts
* troubleshooting section
* server `instructions` field is concise and useful
* no claim of Claude Code or Cursor support

Done when:

* a clean checkout can run the server
* Codex can list/use the MCP tools locally
* docs match observed behavior
* all checks pass

### M4 — Public release polish

Goal: make the repo safe and useful for strangers.

Requirements:

* README is crisp
* SECURITY.md is accurate
* package metadata is accurate
* license exists
* install instructions are tested
* no secrets
* no private org data
* no unsupported claims
* no generated slop docs

Done when:

* release checklist passes
* reviewer findings are addressed or intentionally deferred
* V0.1.0 can be tagged

### M5 — Better engineering pass

Goal: reduce code sprawl after the product works.

This is not a feature milestone.

Review for:

* unnecessary abstractions
* duplicate types
* vague names
* too many files
* weak boundaries
* raw API leakage
* excessive comments
* brittle tests
* unclear errors
* future-proofing that is not needed yet

Done when:

* code is smaller or clearer
* abstractions have earned their existence
* no behavior changes unless fixing bugs
* all checks pass

## Planning instructions for Codex

When asked to plan a milestone:

1. Read `AGENTS.md`, `PLAN.md`, and `REVIEW.md`.
2. Inspect the current repo state.
3. Identify the exact milestone.
4. Produce `PLAN-M{n}.md`.
5. Keep the milestone plan narrow.
6. Include implementation steps.
7. Include validation steps.
8. Include reviewer prompts.
9. Include explicit non-goals.
10. Ask at most three clarifying questions at the beginning.
11. If the answers are not necessary, proceed with conservative assumptions.
12. Do not implement while planning.

The milestone plan must include these sections:

* Goal
* Current state
* Non-goals
* Files expected to change
* Implementation steps
* Validation steps
* Review prompts
* Risks
* Done when
* Human verification

## Implementation instructions for Codex

When asked to implement a milestone plan:

1. Read `AGENTS.md`, `PLAN.md`, `REVIEW.md`, and the specific `PLAN-M{n}.md`.
2. Restate the goal in one paragraph.
3. Implement only that milestone.
4. Keep diffs surgical.
5. Run validation commands.
6. Fix failures.
7. Run a self-review.
8. If useful, spawn focused review subagents after implementation.
9. Address high-signal reviewer findings.
10. Update `PLAN-M{n}.md` with validation results and human verification steps.
11. Report changed files, commands run, failures, and remaining risks.

Do not ask for mid-run clarification unless blocked by missing credentials, destructive ambiguity, or an unavailable dependency.

## Review policy

Use subagents only for review, not initial implementation.

Preferred review dimensions:

1. KISS / code sprawl
2. correctness
3. security / secrets / unsafe tools
4. MCP usability
5. docs honesty
6. Viam terminology/API accuracy

Subagents must not edit code unless explicitly instructed.

## Commit policy

One milestone equals one branch and usually one commit.

Branch names:

* `m0-repo-rails`
* `m1-fake-client-tools`
* `m2-live-viam-client`
* `m3-codex-dogfood`
* `m4-release-polish`
* `m5-better-engineering`

Commit messages:

* `Scaffold Codex-first MCP server`
* `Add fake-client Viam MCP tools`
* `Wire read-only Viam live client`
* `Document Codex MCP setup`
* `Prepare initial public release`
* `Simplify V0 architecture`

## Sprawl alarms

Stop and report before continuing if any of these happen:

* more than 10 production files exist before M2
* a tool bypasses `ViamClient`
* a test requires live credentials
* a function exceeds roughly 80 lines without a strong reason
* a new abstraction has only one caller
* README claims support not tested
* package adds dependencies that are not necessary for V0
* any write/mutation method appears
* raw API responses are returned directly to MCP users
* errors might contain secrets
