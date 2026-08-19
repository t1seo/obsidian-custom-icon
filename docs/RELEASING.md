# Releasing Icon Studio

## Quality gate

Run:

```sh
npm ci
npm run verify
```

`verify` checks formatting, Obsidian lint rules, unit coverage, TypeScript, the production bundle, manifest rules, version consistency, and required release assets.

## Publish the prepared 1.3.1 release

Version 1.3.1 is already aligned across `package.json`, `manifest.json`, `versions.json`, and `CHANGELOG.md`. Publish that exact prepared version without incrementing it again:

```sh
git tag 1.3.1
git push origin 1.3.1
```

The tag must be the exact semantic version from `manifest.json`, without a `v` prefix. Pushing it starts the release workflow, rebuilds and verifies the plugin, attests the artifacts, and publishes a GitHub release containing:

- `main.js`
- `manifest.json`
- `styles.css`

## Prepare a future version

For a later patch or minor release, update `CHANGELOG.md`, then use npm's version command so `package.json`, `manifest.json`, and `versions.json` stay aligned:

```sh
npm version patch # or: npm version minor
git push origin main --follow-tags
```

The repository `.npmrc` keeps npm's tag prefix empty, so the next patch command creates `1.3.2` rather than `v1.3.2` and satisfies the release workflow's exact tag check.

## Verify the release

Confirm that the release tag matches `manifest.json` and that all three assets can be downloaded. Install the repository with BRAT and exercise the changed behavior in both Live Preview and Reading view before announcing the release.

## Community directory

Initial submission happens through [community.obsidian.md](https://community.obsidian.md), not through a pull request to `obsidianmd/obsidian-releases`.

1. Sign in with an Obsidian account.
2. Connect the GitHub account that owns `t1seo/obsidian-icon-studio` so the directory can verify repository access.
3. Open **Plugins**, select **New plugin**, and enter `https://github.com/t1seo/obsidian-icon-studio`.
4. Select the Community directory **Owner**: either the signed-in submitter or an eligible organization they belong to.
5. Review and accept the Developer policies, then confirm continued support or removal/transfer if support can no longer be provided.
6. Submit the entry, run the preview scan or request review, and resolve any blocking scanner errors with a new incremented release.

The first listing requires an Obsidian account connected to the repository owner's GitHub account. The directory entry itself can be owned by that submitter or an eligible Community organization. Later versions are discovered automatically from GitHub releases.
