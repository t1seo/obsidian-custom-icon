# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
