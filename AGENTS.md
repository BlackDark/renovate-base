# Agent notes — renovate-base

Presets in this repo are shared across projects. Prefer extending them over
copying rules. Validate local configs with `renovate-config-validator --strict`
(see `.github/workflows/validate-renovate-config.yml`) before merging.

The `main` ruleset requires the workflow job named `check`. That workflow runs
on **every** pull request (not only `*.json5` changes) so docs-only PRs still
get a status. Do not reintroduce `pull_request.paths` filters that skip it.

## Extending

```json5
{
  extends: [
    "github>blackdark/renovate-base//default.json5",
    "github>blackdark/renovate-base//go.json5", // Go repos only
  ],
}
```

- Always use the `//default.json5` (or `//go.json5`) path. A bare
  `github>blackdark/renovate-base` only resolves `default.json` /
  `renovate.json`, not `default.json5`, and Renovate stops the repo.
- `default.json5` is language-agnostic. `go.json5` is opt-in.

## Go preset (`go.json5`) — pitfalls

### Unknown packageRules keys abort the whole repo

Renovate treats unknown `packageRules` fields as a config error and will not
process the repository. There is **no** `matchGroupNames`. To add automerge (or
anything else) on top of the `go toolchain` group, rematch the same deps the
preset uses (`matchManagers` + `matchDepNames` / `matchPackageNames`), or use
`matchJsonata` (e.g. `groupName = 'go toolchain'`). Do not invent matchers.

### `matchDepNames` vs `matchPackageNames` (Renovate 38+)

`matchPackageNames` no longer falls back to `depName`. mise's short pin
`go = "…"` has `depName=go` / `packageName=golang/go`. Matching only
`matchPackageNames: ["go"]` misses it and the update falls into a catch-all
group while `go.mod` stays behind.

### Explicit mise backends keep the prefix

`[tools] "core:go" = "…"` extracts as `depName=core:go`, not `go`. The preset
lists `go`, `core:go`, `asdf:golang`, `vfox:go`. Note **asdf** names the tool
`golang` (`asdf:golang`), not `asdf:go`.

### Catch-all groups must exclude the same names

If a later rule groups “all patches”, exclude every go-toolchain depName and
the golang image packageNames (`!go`, `!core:go`, `!asdf:golang`, `!vfox:go`,
`!golang`, `!docker.io/library/golang`), or the last matching `groupName` wins
and undoes the preset.

### Traefik Yaegi plugins

`go.json5` is fine for ordinary Go binaries. For a Yaegi plugin module:

- Cap the plugin `go` / `toolchain` directive with repo-local
  `allowedVersions` tied to the Traefik line you e2e against.
- `go.json5` also groups `golang` Docker images into `go toolchain`. If a
  sidecar Dockerfile (e.g. ext_authz) should move independently of the plugin
  `go.mod`, override those images back into your docker patch/minor groups in
  a later `packageRules` entry.

### What the preset does *not* enforce

Grouping updates does not keep `.mise.toml` and `go.mod` equal. Repos that pin
both should keep a small equality test (travo's `TestGoVersionPinsAgree`).
