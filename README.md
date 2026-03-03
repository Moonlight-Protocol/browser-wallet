To install the precommit check :

deno task prepare

## Dev seed (optional)

To skip manual wallet setup during development, copy the seed template and fill in your values:

```
cp .env.seed.example .env.seed
```

Edit `.env.seed` with your password and mnemonic. The channel ID, providers, and network are pre-filled with Moonlight Beta defaults.

Then build as usual:

```
deno task build
```

On first load the extension will auto-configure the wallet, channel, and providers. You just need to unlock with the password from `.env.seed`.
