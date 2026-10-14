# AbiBreak

AbiBreak is a zero-dependency CLI that compares two EVM contract ABIs and flags
changes that can break applications, integrations, scripts, indexers, or other
contracts that depend on the previous interface.

It is designed for contract upgrades and CI checks: compare the ABI from the
current release with the ABI produced by the proposed change and fail the build
when an incompatible interface change appears.

## What it detects

AbiBreak currently checks:

- removed functions, events, and custom errors
- changed function return types
- changed function state mutability
- changed event `indexed` parameters
- changed event `anonymous` status
- newly added functions, events, and errors as safe/additive changes
- canonical tuple and tuple-array signatures
- Ethereum function/error selectors and full event topic hashes

Input type changes naturally appear as a removed old signature plus an added new
signature, making the compatibility break explicit.

## Requirements

- Node.js 20 or newer

## Run locally

```bash
git clone https://github.com/Vadimkakek/AbiBreak.git
cd AbiBreak
npm link
```

Then compare two ABI files:

```bash
abibreak examples/old-abi.json examples/new-abi.json
```

Example output:

```text
ABI compatibility: BREAKING CHANGES FOUND
Breaking: 1
Safe:     1

BREAKING
- function transfer(address,uint256) was removed 0xa9059cbb

SAFE / ADDED
- function approve(address,uint256) was added 0x095ea7b3
```

AbiBreak accepts both a raw ABI array and common artifact-shaped JSON containing
an `abi` array.

## JSON output

For scripts or CI:

```bash
abibreak old.json new.json --json
```

Each change includes its severity, action, ABI item type, canonical signature,
selector/topic, and a human-readable explanation.

## Markdown output

Generate a report suitable for a pull request description or comment:

```bash
abibreak old.json new.json --markdown
```

## Exit codes

- `0` — ABI is compatible
- `1` — invalid arguments, unreadable file, malformed JSON, or invalid ABI
- `2` — breaking ABI changes were found

Use `--no-fail` when you want to print a report without returning exit code 2.

A simple CI step can therefore be:

```yaml
- name: Check ABI compatibility
  run: abibreak abi/released.json abi/current.json
```

## Why selectors matter

Ethereum function and custom-error selectors are the first four bytes of the
Keccak-256 hash of their canonical signatures. Events use the full hash as the
topic. AbiBreak computes these using an internal Keccak-256 implementation and
has no runtime dependencies.

For example:

```text
transfer(address,uint256) -> 0xa9059cbb
```

## Development

Run all tests:

```bash
npm test
```

The test suite includes known Ethereum hash vectors and runs in CI on Node.js
20 and 22.

## Security and privacy

AbiBreak works entirely with local ABI JSON files. It does not need a wallet,
private key, seed phrase, RPC endpoint, API key, or network connection.

Do not put secrets into ABI files or the repository. Local `.env` files are
ignored by git.

See [SECURITY.md](./SECURITY.md).

## Roadmap

- configurable compatibility policies
- storage-layout comparison
- Solidity artifact directory mode
- GitHub Actions annotations
- upgrade report generation
- optional package publication

## License

MIT
