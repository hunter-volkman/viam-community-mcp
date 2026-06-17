# viam-community-mcp

`viam-community-mcp` is an unofficial, and read-only, MCP server to inspect fleets of Viam machines.

## Current Status

M2 is a local stdio MCP server with live read-only Viam calls behind a small `ViamClient` interface.

The server starts with environment-variable credentials and exposes four read-only tools. Normal tests still use deterministic fake data and do not require credentials or network access.

## Implemented Tools

* `viam_whoami` - reports whether the configured Viam client can identify the scoped organization.
* `viam_list_machines` - lists visible Viam machines with IDs, names, locations, status, health, and last-seen timestamps when available.
* `viam_get_recent_errors` - returns bounded recent error logs, optionally filtered by machine ID and since timestamp.
* `viam_summarize_fleet_health` - summarizes machine health, recent errors, and evidence-backed machines to inspect first.

All tools route through `ViamClient`. Runtime uses the live client; tests use `FakeViamClient`.

## V0 Scope

V0 behavior is local-only, stdio-only, read-only, and Codex-first.

## Out of Scope

V0 will not control robots, move hardware, call arbitrary `DoCommand`, mutate config, restart machines, deploy modules, delete data, run as a hosted service, expose remote HTTP MCP, provide a UI, or claim support for clients other than Codex.

## Install

```bash
npm install
```

## Run

Build the package, then run the stdio server:

```bash
export VIAM_API_KEY_ID=replace-me
export VIAM_API_KEY=replace-me
export VIAM_ORG_ID=replace-me
npm run build
node dist/index.js
```

The server does not load `.env` files itself. If you keep credentials in a local `.env`, load them into the environment before starting the server and do not commit that file.

## Development Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` includes a live smoke test file, but that file skips unless `VIAM_API_KEY_ID`, `VIAM_API_KEY`, and `VIAM_ORG_ID` are all present.

To run only the live smoke check with credentials already set:

```bash
npm test -- test/liveSmoke.test.ts
```

## Environment Variables

Required for the runtime server:

```bash
VIAM_API_KEY_ID=replace-me
VIAM_API_KEY=replace-me
VIAM_ORG_ID=replace-me
```

Do not paste credentials into prompts. Do not commit `.env`.

## Codex Setup

After `npm run build`, configure Codex to run the local stdio server with `node dist/index.js` from this repo.

Detailed Codex setup docs are planned for M3.

## Example Prompts

* What Viam machines are visible to this MCP server?
* Which machines look unhealthy?
* Show recent Viam errors and what I should inspect first.

## Safety Model

Inspection before action. The project is scoped so Codex can inspect fleet-like state, but cannot operate hardware.

## Limitations

Live output is intentionally concise and bounded. The server does not return raw Viam API responses, raw machine configs, credential values, host stacks, or unbounded logs.

The live client currently uses organization lookup, machine summaries, and bounded part log reads. It does not control robots, call `DoCommand`, mutate config, expose remote HTTP, or provide a raw Viam API proxy.
