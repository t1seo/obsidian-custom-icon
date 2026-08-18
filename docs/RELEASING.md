# Releasing Vault Icon Studio

## Quality gate

Run:

```sh
npm ci
npm run verify
```

`verify` checks formatting, Obsidian lint rules, unit coverage, TypeScript, the production bundle, manifest rules, version consistency, and required release assets.

## Create a version

Use npm's version command so `package.json`, `manifest.json`, and `versions.json` stay aligned:

```sh
npm version minor
git push origin main --follow-tags
```

The tag must be the exact semantic version from `manifest.json`, without a `v` prefix. Pushing it starts the release workflow, rebuilds and verifies the plugin, attests the artifacts, and publishes a GitHub release containing:

- `main.js`
- `manifest.json`
- `styles.css`

## Verify the release

Confirm that the release tag matches `manifest.json` and that all three assets can be downloaded. Install the repository with BRAT and exercise the changed behavior in both Live Preview and Reading view before announcing the release.

## Community directory

Initial submission happens through [community.obsidian.md](https://community.obsidian.md), not through a pull request to `obsidianmd/obsidian-releases`.

1. Sign in with an Obsidian account.
2. Connect the GitHub account that owns `t1seo/vault-icon-studio`.
3. Open **Plugins**, select **New plugin**, and submit `https://github.com/t1seo/vault-icon-studio`.
4. Run the preview scan or request review.
5. Resolve any blocking scanner errors with a new incremented release.

The first listing requires the owner's Obsidian account. Later versions are discovered automatically from GitHub releases.
