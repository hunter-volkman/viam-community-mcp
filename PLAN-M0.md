# PLAN-M0.md

Milestone plan for M0: repo rails.

## Goal

Create the smallest TypeScript project skeleton for `viam-community-mcp` so the repo can build, typecheck, lint, and test before MCP tools or Viam clients exist.

M0 should establish rails only. It should not make the server useful yet.

## Current state

The repo currently contains planning and policy documents only:

* `AGENTS.md`
* `PLAN.md`
* `REVIEW.md`
* `README.md` is present but empty
* `SECURITY.md`

There is no `package.json`, TypeScript config, lint config, test config, source directory, test directory, `.gitignore`, or `.env.example`.

## Non-goals

Do not add MCP tools.

Do not add a Viam client interface, fake client, or live client.

Do not add server setup beyond an empty compiling entrypoint.

Do not add tool schemas, tool registration, or dynamic tool generation.

Do not add robot control, write behavior, `DoCommand`, config mutation, restart behavior, module deployment, data deletion, schedulers, daemons, UI, hosted servers, or remote HTTP MCP.

Do not claim support for Claude Code, Cursor, ChatGPT, remote MCP, production use, or clients other than Codex.

Do not add broad architecture folders, framework abstractions, registries, factories, plugin systems, or dependency-injection patterns.

Do not add runtime dependencies unless a later implementation proves one is necessary for M0. M0 should likely use only dev dependencies.

## Files expected to change

Expected new files during M0 implementation:

* `package.json`
* `package-lock.json`
* `tsconfig.json`
* `vitest.config.ts`
* `eslint.config.js`
* `.gitignore`
* `.env.example`
* `src/index.ts`
* one tiny test file, likely `test/rails.test.ts`

Expected existing files to update during M0 implementation:

* `README.md`

Files that should not change during M0 unless a specific mismatch is found:

* `AGENTS.md`
* `PLAN.md`
* `REVIEW.md`
* `SECURITY.md`

## Implementation steps

1. Create `package.json` with:
   * package name `viam-community-mcp`
   * CLI binary name `viam-mcp`
   * ESM TypeScript setup
   * scripts for `build`, `typecheck`, `lint`, and `test`
   * package metadata that clearly does not imply official Viam support
   * no runtime dependencies for M0 unless required by the chosen scaffold

2. Add minimal dev dependencies:
   * TypeScript
   * Vitest
   * ESLint and the smallest TypeScript ESLint setup needed for linting TypeScript
   * no Prettier unless deliberately added later

3. Add `tsconfig.json` for a strict, small Node-oriented TypeScript build:
   * source under `src`
   * output under `dist`
   * tests included for typechecking only if that keeps the config simple

4. Add `eslint.config.js` with a minimal flat config:
   * lint TypeScript files
   * ignore `dist`
   * avoid stylistic churn

5. Add `vitest.config.ts` only if Vitest needs explicit configuration. Keep it tiny.

6. Add `.gitignore` for:
   * `node_modules`
   * `dist`
   * coverage output
   * `.env`
   * common local editor and OS noise

7. Add `.env.example` with placeholders only:
   * `VIAM_API_KEY_ID=replace-me`
   * `VIAM_API_KEY=replace-me`
   * `VIAM_ORG_ID=replace-me`

8. Add `src/index.ts` as an empty or near-empty compiling entrypoint:
   * no MCP server setup yet
   * no Viam imports
   * no tool registration
   * no environment reads
   * no network calls

9. Add one tiny test that proves the test runner is wired:
   * keep it about repo rails, not product behavior
   * do not test MCP tools because none should exist

10. Update `README.md` honestly:
    * state the project is unofficial and Codex-first
    * state M0 is only a scaffold and tools are not implemented yet
    * list the intended V0 scope as roadmap/planned behavior, not current behavior
    * document development commands
    * document environment variable names with placeholders only
    * avoid fake transcripts, fake screenshots, private data, and unsupported client claims

11. Stop after rails are in place. Do not add convenience helpers or future architecture.

## Validation steps

Run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Then verify:

* `src/index.ts` exists and is the only production source file.
* No MCP tools exist.
* No Viam client files exist.
* No runtime server behavior is claimed as implemented in `README.md`.
* `.env.example` contains placeholders only.
* `.env` is ignored and not tracked.
* `README.md` states unofficial status and Codex-first scope without claiming support for other clients.
* No secrets, private org IDs, private machine IDs, private logs, or raw Viam API responses were added.

Suggested inspection commands:

```bash
find src test -maxdepth 3 -type f | sort
git status --short
git diff --stat
```

## Review prompts

Ask reviewers to check:

1. KISS / sprawl: Is M0 just rails, or did it add architecture that belongs to M1 or later?
2. Correctness: Do `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass from a clean checkout after install?
3. Security: Are `.env` files ignored, placeholders safe, and no secrets or private Viam data present?
4. Docs honesty: Does `README.md` clearly distinguish current M0 scaffold from planned V0 tools?
5. Scope: Are there zero MCP tools, zero Viam client files, zero write paths, and zero unsupported support claims?
6. Dependency discipline: Are dependencies limited to what is necessary for TypeScript, linting, testing, and building?

## Risks

* `README.md` could accidentally describe planned V0 behavior as already implemented.
* Adding a CLI binary in `package.json` could imply a functional MCP server before one exists; wording should make the M0 status clear.
* ESLint TypeScript setup can pull in more dev dependency surface than expected; keep it minimal.
* A placeholder `src/index.ts` can become a place for premature server setup; keep it empty or nearly empty.
* `package-lock.json` will be generated during dependency installation and may be larger than the rest of M0, but that is expected npm metadata.
* Network access may be needed to install dev dependencies during implementation.

## Done when

M0 implementation is done when:

* `package.json` has the expected scripts.
* `npm test` passes.
* `npm run typecheck` passes.
* `npm run lint` passes.
* `npm run build` passes.
* `src/index.ts` compiles.
* No MCP tools exist.
* No Viam client exists.
* No write behavior exists.
* `README.md` describes only the scaffold as current behavior and labels V0 tool behavior as planned.
* `.env.example` uses placeholders only.
* `.env` is ignored.
* No secrets or private Viam data are present.
* The diff is small enough to understand in one sitting.

This planning task is done when `PLAN-M0.md` exists and no source files have been created yet.

## Human verification

Before approving M0 implementation, a human should:

1. Read `PLAN-M0.md` and confirm it stays limited to repo rails.
2. Confirm that M0 does not include MCP tools, Viam client code, broad architecture, or unsupported client claims.

After M0 implementation, a human should:

1. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
2. Open `README.md` and confirm it says the project is unofficial, Codex-first, read-only, local-only, and not yet functionally implemented beyond rails.
3. Inspect `src` and confirm only the minimal entrypoint exists.
4. Inspect `.env.example` and confirm it contains placeholders only.
5. Review `git diff --stat` and confirm the milestone stayed small.

## Implementation results

M0 was implemented with the planned minimal scaffold:

* `package.json` defines `test`, `typecheck`, `lint`, and `build`.
* `src/index.ts` is the only production source file.
* `test/rails.test.ts` is a tiny rails test only.
* No MCP tools were added.
* No Viam client, fake client, or live client was added.
* No runtime dependencies were added.
* `README.md` describes M0 as rails only and labels V0 tool behavior as planned.
* `.env.example` contains placeholders only.

Validation commands run:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Validation results:

* `npm test` passed with 1 test.
* `npm run typecheck` passed.
* `npm run lint` passed.
* `npm run build` passed.

Additional checks:

```bash
find src test -maxdepth 3 -type f | sort
rg -n "viam_|DoCommand|createServer|McpServer|Stdio|ViamClient|FakeViam|liveClient|fetch\(|http://|https://|delete|restart|mutat" src test package.json tsconfig.json vitest.config.ts eslint.config.js README.md .env.example .gitignore
rg -n "VIAM_API_KEY(_ID)?=.*[^replace\-me]|Bearer [A-Za-z0-9]|secret|token" src test package.json tsconfig.json vitest.config.ts eslint.config.js README.md .env.example .gitignore
```

Additional check results:

* `find src test -maxdepth 3 -type f | sort` returned only `src/index.ts` and `test/rails.test.ts`.
* The scope search found only planned tool names and forbidden behavior statements in `README.md`, not implemented code.
* The secret search returned no matches.

Notes:

* `npm install` completed and generated `package-lock.json`. It reported one transitive engine warning for the local Node 23 runtime and one low-severity audit notice.
* `npm audit --json` was attempted as an extra, non-required check, but the sandbox could not resolve `registry.npmjs.org`.

Remaining human verification:

1. Review `README.md` and confirm the M0 status is clear.
2. Review `package.json` dependency choices and confirm dev-only tooling is acceptable for M0.
3. Optionally run `npm audit` outside the sandbox if dependency audit status matters before merging.
