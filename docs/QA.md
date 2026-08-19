# Icon Studio 1.3.1 QA

QA date: 2026-08-19

## Environment

- macOS desktop
- Obsidian 1.13.7
- Isolated vault: a temporary copy of `examples/programming-languages-vault`
- Plugin build: Icon Studio 1.3.1
- Mobile surface: Obsidian's documented desktop mobile emulation, enabled with `this.app.emulateMobile(true)`

## Automated gate

Run `npm run verify`. The gate covers formatting, Obsidian ESLint rules, unit tests with 100% target coverage, TypeScript, the production bundle, manifest consistency, and release assets.

The command-registration regression test also checks that `change-icon`, `remove-icon`, and `insert-inline-icon` are each registered exactly once. This was added after manual QA exposed a duplicate registration that caused Obsidian to omit the insert command.

## Hands-on scenarios

| Scenario | Result | Observed surface |
| --- | --- | --- |
| Plugin installation and metadata | Pass | Community plugins settings showed Icon Studio 1.3.1 by t1seo |
| File and folder assignment | Pass | Right-click change/remove actions persisted and refreshed the explorer |
| Explorer, tab, and note-title icons | Pass | Programming Languages and all five language notes rendered their assigned SVGs |
| Library picker | Pass | Seven clean sample icons rendered; contextual title, search, labeled random selection, keyboard tabs, and selection worked |
| Modal exclusivity | Pass | Three repeated command launches left exactly one picker open |
| Single upload | Pass | Keyboard-accessible upload zone processed an SVG into sidebar and editor previews |
| Batch SVG import | Pass | Two SVGs were reviewed, renamed, imported, persisted, and then removed from the final sample; an edited name survived removal of its neighboring row |
| Inline icons in Live Preview | Pass | Five language shortcodes rendered at the configured 24 px size |
| Inline icons in Reading view | Pass | `Cmd+E` rendered the same five icons outside the editor |
| Insert command | Pass | Command opened the picker, TypeScript was selected by keyboard, and `:ci-typescript:` was inserted at the cursor |
| Change and remove commands | Pass | All three branded commands appeared in the command palette |
| Annotation add/edit/remove UI | Pass | Context menu, Markdown editor, live preview, wiki link, save shortcut, accent marker, and persisted JSON worked |
| Settings | Pass | Size slider and prefix field saved without an Apply button; values survived reload and were restored to the sample's 24 px / `ci` state |
| Restart persistence | Pass | Disabling the plugin exposed raw shortcodes; re-enabling restored folder, note, inline, and annotated icons, while `data.json` and `icon-library.json` hashes stayed unchanged |
| Autocomplete | Pass | With the ABC input source selected, typing `:ci-` in the editor opened all seven icon suggestions; pressing Return inserted the selected shortcode |
| Mobile | Pass | In Obsidian's [documented desktop mobile emulation](https://docs.obsidian.md/Plugins/Getting%20started/Mobile%20development), five inline icons and the annotation marker rendered; the remove command, insert command, and seven-item picker were exercised in the mobile layout |

## Screenshot evidence

The repository screenshots were captured from the isolated QA vault after the final sample data was restored:

- `assets/icon-studio-overview.png`
- `assets/icon-studio-library.png`
- `assets/icon-studio-upload.png`
- `assets/icon-studio-batch-import.png`
- `assets/icon-studio-context-menu.png`
- `assets/icon-studio-commands.png`
- `assets/icon-studio-annotation.png`
- `assets/icon-studio-settings.png`
- `assets/icon-studio-mobile.png`

No screenshot was fabricated or taken from the user's main vault.

The design audit, reference sources, accessibility choices, and before/after decisions are recorded in [`docs/research/ux-ui-design.md`](research/ux-ui-design.md).
