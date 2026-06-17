# viam-community-mcp

`viam-community-mcp` is an unofficial community project for a Codex-first MCP server that will inspect and diagnose Viam robotics fleets.

This project is not affiliated with, endorsed by, or supported by Viam.

## Current Status

M0 is repo rails only. The TypeScript package can build, typecheck, lint, and test, but it does not start an MCP server yet.

No MCP tools are implemented yet. No Viam client is implemented yet. No live Viam calls are made.

## Intended V0 Scope

Planned V0 behavior is local-only, stdio-only, read-only, and Codex-first.

The intended tool surface for a later milestone is:

* `viam_whoami`
* `viam_list_machines`
* `viam_get_recent_errors`
* `viam_summarize_fleet_health`

Those tools are not implemented in M0.

## Out of Scope

V0 will not control robots, move hardware, call arbitrary `DoCommand`, mutate config, restart machines, deploy modules, delete data, run as a hosted service, expose remote HTTP MCP, provide a UI, or claim support for clients other than Codex.

## Install

```bash
npm install
```

## Development Commands

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

## Environment Variables

Future live Viam support will read credentials from environment variables:

```bash
VIAM_API_KEY_ID=replace-me
VIAM_API_KEY=replace-me
VIAM_ORG_ID=replace-me
```

Do not paste credentials into prompts. Do not commit `.env`.

## Codex Setup

Codex MCP setup is deferred until the MCP server exists. M0 only creates the package rails.

## Safety Model

Inspection before action. The project is scoped so Codex can inspect fleet state in a later milestone, but cannot operate hardware.

## Limitations

M0 is not useful as an MCP server yet. It is only the smallest project skeleton needed for later milestones.
