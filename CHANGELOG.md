# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-06

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
