# Icon Studio UX/UI research and design decisions

Research and implementation date: 2026-08-19

## Scope and method

The review covered the icon picker, source tabs, search, library cards, upload and batch flows, context menu copy, annotation editor, settings, and mobile behavior. The baseline was captured from the isolated Programming Languages QA vault before implementation. The redesigned surfaces were captured again from the same vault after implementation and hands-on QA.

Mobbin was considered as a pattern library, as requested. The available in-app browser could not open an authenticated Mobbin browsing session, so no private Mobbin screen or screenshot was copied. Public Mobbin indexing was used only to frame the research around shipped screen, flow, and UI-element patterns. Decisions were cross-checked against open, directly inspectable guidance:

- [Obsidian HTML elements](https://docs.obsidian.md/Plugins/User%20interface/HTML%20elements) and [Obsidian styling guidance](https://docs.obsidian.md/Reference/CSS%20variables/About%20styling) for native elements, CSS variables, themes, and sentence-case UI copy.
- [Obsidian plugin self-critique checklist](https://docs.obsidian.md/oo/plugin) for settings structure and UI language.
- [WAI-ARIA tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) for `tablist`, `tab`, `tabpanel`, selected state, roving tab focus, and arrow/Home/End keys.
- [MDN dialog role guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/dialog_role) for task naming, description, initial focus, and focus containment.
- [UX Patterns file input](https://uxpatterns.dev/patterns/forms/file-input) and [eBay file uploading accessibility](https://playbook.ebay.com/design-system/patterns/file-uploading?tab=accessibility) for a visible drop zone, browse fallback, supported-format guidance, thumbnails, filename-specific remove labels, and keyboard operation.

## Baseline findings

### Strengths

- Real icon previews and short labels made the library easy to scan.
- Existing colors already relied mostly on Obsidian variables and worked in light and dark themes.
- Single and batch image processing were already local to the vault and functionally reliable.
- The annotation editor already provided Markdown preview and explicit save/cancel actions.

### UX and accessibility risks

- The picker had no task title or target description, so a user could not confirm where a selection would be applied.
- Repeated command or menu activation could stack multiple picker modals.
- The source switch looked like two unrelated buttons rather than an accessible tab set.
- The icon-only dice action was unexplained and its handler did not select anything.
- The upload area used an emoji as a product control and could not be activated by keyboard.
- Accepted formats, browse fallback, multi-file review, and remove actions did not form a clear sequence.
- Icon deletion controls were only discoverable on hover and used the same generic accessible name for every icon.
- Batch removal rebuilt rows from the original files and discarded names already edited by the user.
- Settings required separate Apply buttons instead of saving where the value changed.
- The annotation delete action sat beside the primary save action, increasing accidental-action risk.

## Implemented decisions

| Surface | Decision | Observable result |
| --- | --- | --- |
| Picker | Add **Choose an icon** and the target file or insertion context | Users can confirm the task before selecting |
| Modal lifecycle | Close the previous Icon Studio picker before opening another | Repeated triggers leave one modal |
| Tabs | Use ARIA tab roles, selected state, and Left/Right/Home/End navigation | Mouse and keyboard behavior match a familiar tab pattern |
| Search and random | Add a search icon, specific placeholder, and labeled **Random** action | Both actions are understandable; random now selects from visible results |
| Library | Increase card targets, improve labels, expose item-specific delete names, add an empty state | Faster scanning and clearer keyboard/screen-reader output |
| Upload | Replace the emoji with Obsidian's upload icon; add a visible browse action, formats, paste hint, focus ring, Enter/Space support, and inline errors | Drag, click, paste, keyboard, and invalid-file paths are explicit |
| Batch import | Show thumbnails, file type, editable name, named remove action, count, and a clear import CTA | Users can review exactly what will be added; edited names remain intact |
| Annotation | Add task/context labels and shortcut guidance; separate delete from save/cancel | The destructive action is visually and structurally isolated |
| Settings | Replace number-plus-Apply with an auto-saving slider; save prefix changes without an Apply button | One control per row with immediate persistence |
| Responsive UI | Increase touch targets, expose delete controls on touch, stack actions at narrow widths | Desktop and Obsidian mobile emulation remain usable |

## Validation evidence

- Desktop: Obsidian 1.13.7, isolated QA vault, actual context menus and modals.
- Mobile: Obsidian desktop mobile emulation with `app.isMobile === true`.
- Accessibility surface: labels and roles inspected through the macOS accessibility tree; keyboard tab navigation, upload activation, picker selection, annotation save, and settings persistence exercised.
- Functional surface: search returned only TypeScript for `Type`; random changed the current file mapping and was restored; two SVG files imported and persisted; the library returned to its seven-item baseline afterward.
- Visual evidence: all images under `assets/icon-studio-*.png` were recaptured from the QA vault after the implementation.

The authenticated Mobbin product library remains a research limitation of this run. No claim in this document depends on a Mobbin-only screen that could not be inspected directly.
