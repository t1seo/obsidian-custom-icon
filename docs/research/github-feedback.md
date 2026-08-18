# GitHub feedback and deployment diagnosis

Research date: 2026-08-19

## What users reported

The project has eight closed issues. Three contain public discussion from users:

- [#1: Support batch import and transparent background](https://github.com/t1seo/vault-icon-studio/issues/1) received two maintainer replies. Native SVG storage, transparent rendering, filenames, and batch import shipped in 1.1.0.
- [#4: Suggestions to improve the inline icon feature](https://github.com/t1seo/vault-icon-studio/issues/4) received five replies across the user and maintainer. The reporter later confirmed that the 1.2.0 changes worked.
- [#11: Adding comments/annotations to inline custom icons](https://github.com/t1seo/vault-icon-studio/issues/11) received five replies. After the annotation implementation merged, the reporter found that no new release was available through BRAT and that the plugin could not be installed from Obsidian's Community directory. A later follow-up noted a newer Obsidian version while still waiting for the release.

Issues #5 through #9 were maintainer-created implementation trackers and contain no public comments.

## Root cause

The annotation code was merged, but the repository still exposed 1.2.0 as its latest GitHub release. There was also no Community directory entry. BRAT therefore had no newer tagged release to install, and Obsidian could not offer a directory install.

## Resolution in 1.3.0

- Align `package.json`, `manifest.json`, and `versions.json` at 1.3.0.
- Build and attach `main.js`, `manifest.json`, and `styles.css` to a tag named exactly `1.3.0`.
- Validate required assets and metadata in CI.
- Publish an automated GitHub release when the version tag is pushed.
- Prepare the repository for the current account-based Community directory submission flow.
- Test the annotation feature and the complete existing workflow in Obsidian 1.13.7.

The one remaining external step is the initial Community directory submission. It requires the repository owner to sign in with an Obsidian account, connect GitHub, and accept the directory's owner-facing declarations.
