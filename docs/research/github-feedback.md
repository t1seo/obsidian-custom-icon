# GitHub feedback and deployment diagnosis

Research date: 2026-08-19

## What users reported

The project has eight closed issues. Three contain public discussion from users:

- [#1: Support batch import and transparent background](https://github.com/t1seo/obsidian-icon-studio/issues/1) received two maintainer replies. Native SVG storage, transparent rendering, filenames, and batch import shipped in 1.1.0.
- [#4: Suggestions to improve the inline icon feature](https://github.com/t1seo/obsidian-icon-studio/issues/4) received five replies across the user and maintainer. The reporter later confirmed that the 1.2.0 changes worked.
- [#11: Adding comments/annotations to inline custom icons](https://github.com/t1seo/obsidian-icon-studio/issues/11) received five replies. After the annotation implementation merged, the reporter found that no new release was available through BRAT and that the plugin could not be installed from Obsidian's Community directory. A later follow-up noted a newer Obsidian version while still waiting for the release.

Issues #5 through #9 were maintainer-created implementation trackers and contain no public comments.

## Root cause

The annotation code was merged, but the repository still exposed 1.2.0 as its latest GitHub release. A Community directory entry did exist, but its May 7, 2026 review failed because of a direct `element.style.width` assignment; the review also recommended artifact attestations for `main.js` and `styles.css`. BRAT therefore had no newer tagged release to install, and the directory's **Add to Obsidian** action remained unavailable.

## Resolution in 1.3.0

- Align `package.json`, `manifest.json`, and `versions.json` at 1.3.0.
- Build and attach `main.js`, `manifest.json`, and `styles.css` to a tag named exactly `1.3.0`.
- Validate required assets and metadata in CI.
- Publish an automated GitHub release when the version tag is pushed.
- Prepare the repository for the current account-based Community directory submission flow.
- Test the annotation feature and the complete existing workflow in Obsidian 1.13.7.

The `1.3.0` tag and GitHub release were published on 2026-08-19, so BRAT can install the annotation build. Version 1.3.1 carries the final Icon Studio brand and the renamed `t1seo/obsidian-icon-studio` repository.

On 2026-08-19, the repository owner's GitHub account was connected to the existing `custom-icon` directory entry and the 1.3.1 release scan was queued. The public listing now shows **Icon Studio** and version 1.3.1. The preview scan found only the intentional display-name mismatch with the previous **Custom Icon** release, so a manual review request was submitted explaining the rebrand, stable plugin ID, repository rename, fixed source finding, and attested release assets. That request is open for administrator review; **Add to Obsidian** remains disabled until approval.
