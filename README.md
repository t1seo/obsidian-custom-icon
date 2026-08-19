# Icon Studio

<p align="center">
  <img src="assets/icon-studio-mark.svg" width="112" alt="Icon Studio mark" />
</p>

<p align="center"><strong>Your images. Your icons. Your vault.</strong></p>

<p align="center">
  <a href="https://github.com/t1seo/obsidian-icon-studio/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/t1seo/obsidian-icon-studio/ci.yml?branch=main&style=flat-square&label=CI" alt="CI" /></a>
  <a href="https://github.com/t1seo/obsidian-icon-studio/releases/latest"><img src="https://img.shields.io/github/v/release/t1seo/obsidian-icon-studio?style=flat-square" alt="Latest release" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-7257E8?style=flat-square" alt="MIT license" /></a>
  <a href="README.ko.md"><img src="https://img.shields.io/badge/lang-한국어-F08A68?style=flat-square" alt="한국어" /></a>
</p>

Upload your own PNG, JPG, WebP, or SVG images and use them as Obsidian icons for folders, notes, tabs, note titles, and inline text. Everything stays inside your vault.

![A sample Obsidian vault with a Programming Languages folder and custom icons](assets/icon-studio-overview.png)

## A two-minute tour

1. Right-click a file or folder and choose **Change icon…**.
2. Pick an icon already in your library, or open **Upload**.
3. The same assignment appears in the file explorer, tab, and note title.
4. Enable inline icons and write a shortcode such as `:ci-typescript:` inside a note.

| What you can do | Where it appears |
| --- | --- |
| Assign an icon to a folder | File explorer |
| Assign an icon to a note | File explorer, tab, and note title |
| Insert `:ci-NAME:` | Live Preview and Reading view |
| Annotate one inline icon | Accent dot and Markdown hover card |

<p align="center">
  <img src="assets/icon-studio-context-menu.png" width="48%" alt="Change and remove custom icon actions in the file menu" />
  <img src="assets/icon-studio-library.png" width="48%" alt="Icon Studio icon library" />
</p>

The picker names the current task and target, so it is always clear where the next icon will go. Search by name, choose **Random** for a quick pick, or use the keyboard: `Left`/`Right` changes the source tab, and arrow keys plus `Enter` select a focused icon. Icon Studio keeps only one picker open at a time.

## Example: a programming language library

The included [sample vault](examples/programming-languages-vault) uses one icon for the collection and a familiar mark for every language:

```text
Programming Languages/       </> folder icon
├── TypeScript.md             TS icon
├── Python.md                 Python icon
├── Rust.md                   R icon
├── Go.md                     Go icon
└── Swift.md                  Swift icon
```

Each language note also uses its icon inline:

```md
# TypeScript

:ci-typescript: Type-safe JavaScript for large applications.
```

This makes a large vault easier to scan without changing file names or frontmatter.

## Upload and manage icons

Open the picker from a file menu or command, then choose **Upload**. Drop files into the upload area, choose **Browse files**, or paste an image from the clipboard. The drop zone is also available by keyboard with `Tab`, then `Enter` or `Space`.

![Upload PNG, JPG, WebP, or SVG files](assets/icon-studio-upload.png)

Select multiple files to review, rename, or remove individual items before one batch import. SVG files remain vector files instead of being rasterized.

![Review and rename two SVG files before importing](assets/icon-studio-batch-import.png)

In the **Icons** tab, double-click a label to rename an icon. Use the remove button to delete it; assignments using that library item are cleared as well.

## Inline icons and annotations

Enable inline icons in the plugin settings, then type `:ci-` to open autocomplete or use the command palette. The default format is:

```text
:ci-ICON-ID:
```

Right-click a rendered inline icon and choose **Add icon annotation** or **Edit icon annotation**. The focused editor supports Markdown, `[[wiki links]]`, and `![[embeds]]`, with a live preview and `Cmd/Ctrl+Enter` to save. Annotated icons show a small accent dot.

![Markdown annotation editor with a wiki-link preview](assets/icon-studio-annotation.png)

Annotations are per occurrence. Icon Studio adds an instance suffix such as `:ci-typescript~note-a1b2c3d4:` so two uses of the same icon can carry different notes.

## Commands

Open the command palette with `Cmd/Ctrl+P` and search for **Icon Studio**:

- **Insert inline icon**
- **Change icon for current file**
- **Remove icon from current file**

![All three Icon Studio commands in Obsidian](assets/icon-studio-commands.png)

## Settings

![Icon Studio settings](assets/icon-studio-settings.png)

| Setting | Purpose | Default |
| --- | --- | --- |
| Enable inline icons | Render `:ci-NAME:` shortcodes | Off |
| Inline icon size | Set inline icons from 12 to 64 px; saves as you move the slider | 20 px |
| Inline icon prefix | Replace `ci` with your own prefix; saves when the field changes | `ci` |

## Desktop and mobile

The explorer icons, inline icons, annotations, commands, and picker adapt to Obsidian's desktop and mobile layouts. The mobile view below was captured from the sample vault with Obsidian's official desktop mobile emulation enabled.

![Icon Studio icon picker and programming-language icons in Obsidian's mobile layout](assets/icon-studio-mobile.png)

## Installation

### Obsidian Community Plugins

Icon Studio is not listed in the Community directory yet. Until the repository owner completes the account-based submission and Obsidian review, install it with BRAT or manually. After approval:

1. Open **Settings → Community plugins → Browse**.
2. Search for **Icon Studio**.
3. Select **Install**, then **Enable**.

### BRAT

1. Install and enable [BRAT](https://obsidian.md/plugins?id=obsidian42-brat).
2. Run **BRAT: Add a beta plugin for testing**.
3. Enter `https://github.com/t1seo/obsidian-icon-studio`.
4. Enable **Icon Studio** in **Settings → Community plugins**.

### Manual installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/t1seo/obsidian-icon-studio/releases/latest).
2. Put them in `<vault>/.obsidian/plugins/custom-icon/`.
3. Reload Obsidian and enable **Icon Studio**.

The folder and plugin ID intentionally remain `custom-icon`. Existing settings, icon libraries, BRAT installations, hotkeys, and `:ci-...:` note content continue to work when upgrading from Custom Icon or Vault Icon Studio.

## Sample vault

The repository includes [examples/programming-languages-vault](examples/programming-languages-vault), the exact structure used for the screenshots. Copy the three release files into its `.obsidian/plugins/custom-icon/` directory, then open that folder as an Obsidian vault. See [the sample guide](docs/SAMPLE-VAULT.md) for details.

## Privacy and storage

Icon Studio makes no network requests and has no runtime dependencies. Imported icons, assignments, settings, and annotations are stored locally under your vault's `.obsidian/plugins/custom-icon/` directory.

## Development and release

```sh
npm ci
npm run verify
```

See [QA evidence](docs/QA.md), [UX/UI research and design decisions](docs/research/ux-ui-design.md), [release instructions](docs/RELEASING.md), [GitHub feedback and deployment diagnosis](docs/research/github-feedback.md), and [Community directory research](docs/research/obsidian-community-release.md).

## Support

Please [open an issue](https://github.com/t1seo/obsidian-icon-studio/issues) for bugs or feature requests.

[![Buy me a coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=&slug=taewonseo&button_colour=e3e7ef&font_colour=262626&font_family=Inter&outline_colour=262626&coffee_colour=a0522d)](https://www.buymeacoffee.com/taewonseo)

## License

[MIT](LICENSE)
