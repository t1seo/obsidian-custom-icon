# Obsidian Community release research

Research date: 2026-08-19

## Decision

Icon Studio keeps the existing `custom-icon` plugin ID, publishes version `1.3.1` with the required release assets, and uses the account-based Obsidian Community directory submission flow.

## Submission outcome

- The existing `custom-icon` directory entry was connected to the repository owner's GitHub account on 2026-08-19.
- Checking for new releases queued version 1.3.1 at commit `e10239a016a2d9ff8c8c1bad7cce1b03efada03c` and updated the entry's display name to **Icon Studio**.
- The 1.3.1 preview scan reported only the expected mismatch between the former **Custom Icon** name and the new **Icon Studio** manifest name.
- A manual review request was submitted explaining the intentional rebrand, stable plugin ID, repository rename, fixed prior source-code finding, and attested release assets.
- The request is currently open for administrator review. The [public listing](https://community.obsidian.md/plugins/custom-icon) shows Icon Studio 1.3.1, while **Add to Obsidian** remains disabled until approval.

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
