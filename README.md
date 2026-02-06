# Obsidian Custom Icon

<p align="center">
  <a href="https://github.com/t1seo/obsidian-plugin-iconica/releases"><img src="https://img.shields.io/github/downloads/t1seo/obsidian-plugin-iconica/total?style=flat-square&color=573E7A" alt="Downloads" /></a>
  <a href="https://github.com/t1seo/obsidian-plugin-iconica/releases/latest"><img src="https://img.shields.io/github/v/release/t1seo/obsidian-plugin-iconica?style=flat-square&color=573E7A" alt="Release" /></a>
  <a href="https://github.com/t1seo/obsidian-plugin-iconica/releases/latest"><img src="https://img.shields.io/github/release-date/t1seo/obsidian-plugin-iconica?style=flat-square&color=573E7A" alt="Release Date" /></a>
  <a href="./README.ko.md"><img src="https://img.shields.io/badge/lang-한국어-blue?style=flat-square" alt="한국어" /></a>
</p>

Add **custom image icons** to files and folders in [Obsidian](https://obsidian.md). Upload your own PNG, JPG, or SVG images and use them across the explorer, tab headers, note titles, and inline text.

<p align="center">
  <img src="assets/overview.jpg" width="600" alt="Overview" />
</p>

## Features

### Custom Icons in Explorer

Assign uploaded icons to any file or folder. Works seamlessly in both light and dark themes.

<p align="center">
  <img src="assets/explorer-light.jpg" width="280" alt="Explorer Light Theme" />
  <img src="assets/explorer-dark.jpg" width="280" alt="Explorer Dark Theme" />
</p>

### Icon Picker

Browse and manage your icon library. Upload new icons via drag & drop, file picker, or clipboard paste.

<p align="center">
  <img src="assets/icons-tab.jpg" width="320" alt="Icons Tab" />
  <img src="assets/upload-tab.jpg" width="320" alt="Upload Tab" />
</p>

### Context Menu

Right-click any file or folder to change or remove its custom icon.

<p align="center">
  <img src="assets/change-icon-menu.jpg" width="320" alt="Context Menu" />
</p>

### Inline Icons

Use `:custom-icon-NAME:` shortcodes to embed icons directly in your notes.

<p align="center">
  <img src="assets/note-page.jpg" width="480" alt="Inline Icons in Note" />
</p>

## Installation

### From Obsidian Community Plugins (coming soon)

1. Open **Settings** > **Community plugins** > **Browse**
2. Search for **"Custom Icon"**
3. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from [Releases](https://github.com/t1seo/obsidian-plugin-iconica/releases)
2. Extract `main.js`, `manifest.json`, and `styles.css` into:
   ```
   <vault>/.obsidian/plugins/obsidian-custom-icon/
   ```
3. Enable the plugin in **Settings** > **Community plugins**

## Usage

1. **Upload icons** — Open the icon picker and go to the **Upload** tab. Drag & drop or click to upload PNG, JPG, or SVG files.
2. **Assign icons** — Right-click a file or folder in the explorer and select **Change custom icon**, then pick from your library.
3. **Inline icons** — Enable inline icons in settings, then type `:custom-icon-NAME:` in your notes (where `NAME` is the icon name in your library).

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/t1seo/obsidian-plugin-iconica/issues).

## License

[MIT](LICENSE)
