# REVIEW.md

Review instructions for `viam-community-mcp`.

Use this file for Codex `/review`, subagent review, and side-thread review.

## Review standard

The bar is not “does it work once.”

The bar is:

* small
* understandable
* testable
* safe
* honest
* easy to delete
* easy for a stranger to run

V0 should feel like a careful tool, not a generated framework.

## Review dimensions

### 1. KISS / code sprawl

Look for:

* unnecessary abstractions
* too many files
* generic registries
* plugin systems
* dynamic tool factories
* duplicated types
* abstractions with one caller
* helpers that obscure simple logic
* comments explaining code that should be clearer
* future-proofing for features not in V0

Preferred fix:

* delete code
* inline code
* rename for clarity
* consolidate files
* make data flow obvious

### 2. Correctness

Look for:

* schema mismatch
* bad defaults
* unhandled empty states
* incorrect time-window logic
* ambiguous IDs
* unstable output shape
* tests that assert implementation details instead of behavior
* fake client behavior that hides live-client risk
* errors swallowed or over-summarized

Preferred fix:

* add focused tests
* make output shapes explicit
* keep fake data realistic enough to catch mistakes
* fail clearly

### 3. Security

Look for:

* secret leakage
* logging env vars
* raw errors with credentials
* raw API response dumps
* accidental write operations
* config mutation
* unsafe `DoCommand`
* actuator control
* overbroad docs
* instructions that encourage users to paste secrets into prompts

Preferred fix:

* redact
* remove
* make read-only status explicit
* require env vars instead of prompt input
* add tests for redaction

### 4. MCP usability

Look for:

* vague tool names
* too many tools
* tool descriptions that do not tell the model when to use them
* unclear input schemas
* raw JSON blobs as final output
* missing server instructions
* outputs that omit useful evidence
* outputs too verbose for agent use
* inconsistent error shapes

Preferred fix:

* fewer tools
* clearer descriptions
* structured concise outputs
* stable schemas
* short server instructions

### 5. Docs honesty

Look for:

* unsupported client claims
* claiming Claude Code/Cursor support before testing
* fake screenshots
* fake transcripts
* private data
* stale commands
* install steps that have not been run
* roadmap written like existing functionality

Preferred fix:

* say less
* mark roadmap clearly
* include exact commands
* distinguish implemented vs planned

### 6. Viam accuracy

Look for:

* wrong Viam terminology
* conflating machine, part, component, service, module, fragment, org, or location
* assuming API fields without evidence
* hiding live-client limitations
* inaccurate auth setup
* unsupported feature claims

Preferred fix:

* check official docs
* cite docs in comments only if useful
* rename concepts accurately
* defer uncertain live behavior

## Review output format

Return findings in this format:

```text
## Verdict

Pass / pass with fixes / fail

## Highest-priority findings

1. [severity] [file:line] Finding
   Why it matters:
   Minimal fix:

2. ...

## Sprawl findings

- ...

## Security findings

- ...

## Correctness findings

- ...

## Docs findings

- ...

## Suggested cuts

- Code/files/features to delete or defer.

## Commands reviewers expect to pass

- npm test
- npm run typecheck
- npm run lint
- npm run build
```

## Severity

Use:

* `blocker`: must fix before merge
* `high`: should fix before merge
* `medium`: fix soon or explicitly defer
* `low`: polish
* `nit`: optional

Do not bury blockers under nits.

## Reviewer constraints

Reviewers should not rewrite the project.

Reviewers should not propose new features.

Reviewers should not recommend abstractions unless they remove current complexity.

Reviewers should optimize for a small, boring, shippable V0.
