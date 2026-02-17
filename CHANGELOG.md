# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-02-17

### Added

- Inline icon autocomplete — type `:ci-` in the editor to get IDE-style suggestions with icon previews ([#4](https://github.com/t1seo/obsidian-custom-icon/issues/4))
- Configurable inline icon size (12–64px) with instant preview in settings
- Configurable shortcode prefix — change `:ci-NAME:` to any prefix (e.g. `:my-NAME:`)
- Hover preview for inline icons — mouse over any inline icon to see a large preview with its name
- Insert inline icon command palette action (`Cmd/Ctrl+P` → "Insert inline icon at cursor")
- Icon rename — double-click an icon's name in the picker to rename it instantly

### Fixed

- Tab header icons now display correctly (was hidden by Obsidian's default CSS)
- Tab icons no longer accumulate when switching between files
- Tab icons now work correctly in popout windows (multi-window support)
- Hover tooltip now disappears immediately when editing the shortcode text

### Changed

- Tab icon rendering rewritten to leaf-based approach for cross-window reliability
- Updated README with new screenshots and feature documentation (EN/KO)

## [1.1.0] - 2026-02-09

### Added

- Native SVG support — SVGs stored as vector files without canvas rasterization, preserving transparency and scalability ([#1](https://github.com/t1seo/obsidian-custom-icon/issues/1))
- Batch import — select or drag multiple files at once to import all to library
- Import progress indicator ("Importing 3/5...")
- Original filename preservation — icon names derived from filename instead of timestamps
- `addBatch()` method for efficient multi-icon library writes
- Unit test CI job with 100% coverage enforcement

### Changed

- All renderers (explorer, tab, title) now resolve icon paths through `IconLibraryService` instead of hardcoding `.png`
- Upload zone hint updated to "Multiple files supported"
- SVG uploads automatically force "Save to library" (extension must be tracked in metadata)

### Technical

- `CustomIcon.ext` field for dynamic file extension tracking (backward-compatible: defaults to `"png"`)
- `IconLibraryService.getIconExt()` centralizes extension resolution
- `isSvgFile()` detects SVGs by MIME type or file extension
- `processSvg()` reads raw ArrayBuffer + base64 dataUrl (no canvas)

## [1.0.0] - 2026-02-06

### Added

- Custom image icon upload (PNG, JPG, SVG) with drag & drop and clipboard paste
- Icon picker modal with Icons and Upload tabs
- File explorer custom icons for files and folders
- Tab header custom icons
- Note title icons (click to change)
- Inline icon shortcodes (`:custom-icon-NAME:`) in editor and reading mode
- Name-based icon resolution for inline shortcodes
- Context menu integration (Change custom icon / Remove custom icon)
- Command palette commands (change, remove, insert inline)
- Icon library management with search/filter
- Light and dark theme support
- Icon removal cascades when deleting from library

### Technical

- Zero runtime dependencies
- ES2018 target for broad Obsidian compatibility
- CodeMirror 6 ViewPlugin for editor decorations
- MutationObserver-based explorer icon injection
