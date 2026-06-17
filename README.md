# viam-community-mcp

`viam-community-mcp` is an unofficial read-only MCP server for Codex-first inspection of Viam robotics fleets.

This project is not affiliated with, endorsed by, or supported by Viam.

## Current Status

M1 is a fake-client-backed local stdio MCP server.

The server starts and exposes four read-only tools backed by deterministic fake data only. No live Viam calls are made.

## Implemented Tools

* `viam_whoami` - reports the fake identity and organization used by the local M1 server.
* `viam_list_machines` - lists fake machines with IDs, names, locations, status, health, and last-seen timestamps.
* `viam_get_recent_errors` - returns bounded fake recent error logs, optionally filtered by machine ID and since timestamp.
* `viam_summarize_fleet_health` - summarizes fake machine health, recent errors, and evidence-backed machines to inspect first.

All tools route through a small `ViamClient` interface and use `FakeViamClient` in M1.

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
npm run build
node dist/index.js
```

The M1 server uses fake data and does not read credentials.

## Development Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

M1 does not read environment variables.

Future live Viam support will read credentials from:

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

* What Viam machines are visible to this fake MCP server?
* Which fake machines look unhealthy?
* Show recent fake Viam errors and what I should inspect first.

## Safety Model

Inspection before action. The project is scoped so Codex can inspect fleet-like state, but cannot operate hardware.

## Limitations

M1 uses deterministic fake data only. Live Viam API support is not implemented yet.

Tool output is intentionally concise and bounded. It preserves evidence such as fake machine IDs, names, timestamps, severities, and short messages, but it does not provide a real diagnosis of any Viam fleet.
