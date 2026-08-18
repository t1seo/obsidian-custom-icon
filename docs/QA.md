# Vault Icon Studio 1.3.0 QA

QA date: 2026-08-19

## Environment

- macOS desktop
- Obsidian 1.13.7
- Isolated vault: `examples/programming-languages-vault`
- Plugin build: Vault Icon Studio 1.3.0

## Automated gate

Run `npm run verify`. The gate covers formatting, Obsidian ESLint rules, unit tests with 100% target coverage, TypeScript, the production bundle, manifest consistency, and release assets.

The command-registration regression test also checks that `change-icon`, `remove-icon`, and `insert-inline-icon` are each registered exactly once. This was added after manual QA exposed a duplicate registration that caused Obsidian to omit the insert command.

## Hands-on scenarios

| Scenario | Result | Observed surface |
| --- | --- | --- |
| Plugin installation and metadata | Pass | Community plugins settings showed Vault Icon Studio 1.3.0 by t1seo |
| File and folder assignment | Pass | Right-click change/remove actions persisted and refreshed the explorer |
| Explorer, tab, and note-title icons | Pass | Programming Languages and all five language notes rendered their assigned SVGs |
| Library picker | Pass | Seven clean sample icons rendered; search and selection worked |
| Single upload | Pass | Upload tab accepted supported image types |
| Batch SVG import | Pass | Two SVGs were reviewed, renamed, imported, persisted, and then removed from the final sample |
| Inline icons in Live Preview | Pass | Five language shortcodes rendered at the configured 24 px size |
| Inline icons in Reading view | Pass | `Cmd+E` rendered the same five icons outside the editor |
| Insert command | Pass | Command opened the picker, TypeScript was selected by keyboard, and `:ci-typescript:` was inserted at the cursor |
| Change and remove commands | Pass | All three branded commands appeared in the command palette |
| Annotation add/edit/remove UI | Pass | Context menu, Markdown editor, live preview, wiki link, save shortcut, accent marker, and persisted JSON worked |
| Restart persistence | Pass | Disabling the plugin exposed raw shortcodes; re-enabling restored folder, note, inline, and annotated icons, while `data.json` and `icon-library.json` hashes stayed unchanged |
| Autocomplete | Automated | Syntax and suggestion behavior are unit-tested; direct text injection was not used as visual evidence because the active Korean IME transformed synthetic keystrokes |
| Mobile | Not run | No mobile Obsidian runtime was available in the local QA environment |

## Screenshot evidence

The repository screenshots were captured from the isolated QA vault after the final sample data was restored:

- `assets/vault-icon-studio-overview.png`
- `assets/vault-icon-studio-library.png`
- `assets/vault-icon-studio-upload.png`
- `assets/vault-icon-studio-batch-import.png`
- `assets/vault-icon-studio-context-menu.png`
- `assets/vault-icon-studio-commands.png`
- `assets/vault-icon-studio-annotation.png`
- `assets/vault-icon-studio-settings.png`

No screenshot was fabricated or taken from the user's main vault.
