# renovate-base

The renovate base config for all of my repositories.

## Usage

It can be used as documented at [renovate](https://docs.renovatebot.com/config-presets/#github) or in the `renovate.json5` file in this repository.

```json5
{
  extends: ["github>blackdark/renovate-base"],
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
    "github>blackdark/renovate-base",
    "github>blackdark/renovate-base//go.json5",
  ],
}
```

See the comments in [`go.json5`](go.json5) for the failure mode and matcher
details (`matchDepNames` vs `matchPackageNames`).

**Traefik Yaegi plugins:** do not extend `go.json5` unbounded. Cap Go (gomod
`go` / `toolchain`, and `golang` images) with `allowedVersions` to the Traefik
release you e2e against — that release's `go.mod` is the ceiling (e.g. Traefik
v3.7.16 → `go 1.26` → `"<1.27.0"`). Raise the cap when the e2e Traefik image
moves.
