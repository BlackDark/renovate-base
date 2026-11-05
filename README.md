# renovate-base

The renovate base config for all of my repositories.

Agent / contributor pitfalls (unknown matchers, mise depNames, Traefik
overrides): see [`AGENTS.md`](AGENTS.md).

## Usage

It can be used as documented at [renovate](https://docs.renovatebot.com/config-presets/#github) or in the `renovate.json5` file in this repository.

```json5
{
  extends: ["github>blackdark/renovate-base//default.json5"],
}
```

The path after `//` is required: an unnamed preset only resolves to
`default.json` / `renovate.json`, not `default.json5`.

### What `default.json5` sets

- Weekly schedule, non-major updates grouped and automerged; majors get their own PR.
- 0.x minors get their own PR and are not automerged (a minor may break).
- npm releases wait 3 days (`security:minimumReleaseAgeNpm`).
- Security fixes (Dependabot alerts and OSV) come at any time, after one day, never automerged,
  labelled `security`. A release without a publication timestamp (many Docker tags on GHCR, Quay
  or ECR) is not delayed.
- Lock file maintenance is automerged.
- `rebaseWhen: "conflicted"`: PRs are rebased only on conflicts, not on every push to main. This
  saves CI runs. Two updates can then merge without being tested together, and a repo that
  requires branches to be up to date before merging cannot automerge a PR that fell behind. Such
  a repo overrides it (see below).

#### Repos that require up-to-date branches

Ruleset or branch protection with "Require branches to be up to date before merging"
(`strict_required_status_checks_policy`): set `rebaseWhen` back in the repo config.

```json5
{
  extends: ["github>blackdark/renovate-base//default.json5"],
  rebaseWhen: "behind-base-branch", // or "auto"
}
```

### Go projects

Also extend `go.json5`. Renovate does not bump `go.mod`'s `go` directive by
default, and mise / Docker `golang` pins are different managers — without this
preset they drift apart (CI on `go-version-file: go.mod`, image on a newer
`golang:` tag).

```json5
{
  extends: [
    "github>blackdark/renovate-base//default.json5",
    "github>blackdark/renovate-base//go.json5",
  ],
}
```

See the comments in [`go.json5`](go.json5) for the failure mode and matcher
details (`matchDepNames` vs `matchPackageNames`).

### Rust projects

Also extend `rust.json5`: it bumps a pinned `channel = "x.y.z"` in
`rust-toolchain.toml`, refreshes `Cargo.lock` weekly and keeps Cargo 0.x minor
bumps out of automerge.

```json5
{
  extends: [
    "github>blackdark/renovate-base//default.json5",
    "github>blackdark/renovate-base//rust.json5",
  ],
}
```

**Traefik Yaegi plugins:** `go.json5` is still useful for keeping mise/go.mod
aligned on ordinary modules. A compiled sidecar image (`golang:` in a
Dockerfile) does **not** need to match Traefik's Go. If you want the *plugin*
`go.mod` directive capped to the Traefik line you e2e against, add a repo-local
`allowedVersions` on `go`/`toolchain` — don't conflate that with the builder
image.
