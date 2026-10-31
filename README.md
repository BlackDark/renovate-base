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
