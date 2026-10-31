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

**Traefik Yaegi plugins:** `go.json5` is still useful for keeping mise/go.mod
aligned on ordinary modules. A compiled sidecar image (`golang:` in a
Dockerfile) does **not** need to match Traefik's Go. If you want the *plugin*
`go.mod` directive capped to the Traefik line you e2e against, add a repo-local
`allowedVersions` on `go`/`toolchain` — don't conflate that with the builder
image.
