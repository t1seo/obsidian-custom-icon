# Obsidian Community release research

Research date: 2026-08-19

## Decision

Vault Icon Studio will keep the existing `custom-icon` plugin ID, publish version `1.3.0` with the required release assets, and use the account-based Obsidian Community directory submission flow.

## Findings

- The repository root must contain `README.md`, `LICENSE`, and `manifest.json`.
- The release tag must exactly match the semantic version in `manifest.json`.
- Each release must attach `main.js`, `manifest.json`, and optionally `styles.css`.
- The default branch manifest is used to find the latest version, while actual installs come from the matching GitHub release.
- The plugin ID must be unique, lowercase, hyphenated, exclude `obsidian`, and not end in `plugin`.
- The display name must be short, unique, Basic Latin, and exclude `Obsidian` and `Plugin`.
- The description must be no longer than 250 characters and end with punctuation.
- Initial submission now happens at `community.obsidian.md` after the owner connects an Obsidian account to GitHub.
- Automated review checks the manifest, release assets, source code, and whether the published build matches the source.

## Sources

- [Submit your plugin](https://docs.obsidian.md/plugins/releasing/submit-plugin)
- [Manifest reference](https://docs.obsidian.md/Reference/Manifest)
- [Submission requirements for plugins](https://docs.obsidian.md/community-directory/submission-requirements-for-plugins)
- [Developer policies](https://docs.obsidian.md/community-directory/developer-policies)
- [Set up and claim](https://docs.obsidian.md/community-directory/set-up-and-claim)
- [Manage a directory entry](https://docs.obsidian.md/community-directory/manage-entry)
- [Release with GitHub Actions](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions)
