To install the precommit check :

deno task prepare

## Dev seed (optional)

To skip manual wallet setup during development, copy the seed template and fill
in your values:

```
cp .env.seed.example .env.seed
```

Edit `.env.seed` with your password and mnemonic. The channel ID, providers, and
network are pre-filled with Moonlight Beta defaults.

Then build as usual:

```
deno task build
```

On first load the extension will auto-configure the wallet, channel, and
providers. You just need to unlock with the password from `.env.seed`.

### Two-wallet local-dev setup

`local-dev`'s `setup-accounts-extension.sh` funds two separate dev wallets via
Friendbot so you can run two browser extensions side by side (e.g. one in
Chrome, one in Brave) and test sends between them against a local Moonlight
stack. It expects two seed files to already exist here:

```
cp .env.seed.example .env.seed.user1
cp .env.seed.example .env.seed.user2
```

Edit each with its own `SEED_MNEMONIC` (a fresh 12-word BIP39 mnemonic) and
`SEED_PASSWORD` — the two wallets must use different mnemonics. Point both at
your local stack:

```
SEED_NETWORK=custom
```

`custom` is hardcoded (see `src/background/contexts/chain/network.ts`) to
`http://localhost:8000` for RPC/Horizon/Friendbot and the standalone network
passphrase, matching `local-dev`'s Stellar quickstart.

Set `SEED_CHANNEL_CONTRACT_ID` to the privacy channel deployed by `setup-c.sh`
(`COUNCIL_<i>_CHANNEL` in `local-dev/.local-dev-state`), and `SEED_PROVIDERS` to
a privacy provider from that same council. Provider URLs **must end in the PP's
Stellar public key** (`extractPpPubkeyFromUrl` in
`src/background/services/pp-url.ts` reads it from the last path segment), e.g.:

```
SEED_PROVIDERS=Mercado Libre Argentina Provider=http://localhost:3010/GCYFPWQQQI37JOQO5UF4TBPOYUMJY7BTTQ7W7PK5J52CKP735HXX2CCH
```

(`PP_<i>_PK` in `.local-dev-state`, appended by `setup-pp.sh`.)

Build each extension from its own seed file with `SEED_FILE`, into separate
output directories so both can be loaded at once:

```
SEED_FILE=.env.seed.user1 BUILD_DIR=dist/user1 deno task build
SEED_FILE=.env.seed.user2 BUILD_DIR=dist/user2 deno task build
```

Load `dist/user1` and `dist/user2` as unpacked extensions in two different
browsers (or profiles). Then run, from `local-dev`:

```
./setup-accounts-extension.sh
```

which derives each wallet's account from its mnemonic and funds it via
Friendbot. Re-run this after every `down.sh && up.sh` cycle, since the local
ledger is wiped each time.
