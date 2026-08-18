# Programming Languages sample vault

This repository includes the same sample vault used for the README screenshots and manual QA.

## Open the sample

1. Run `npm ci && npm run build` from the repository root.
2. Copy `main.js`, `manifest.json`, and `styles.css` into `examples/programming-languages-vault/.obsidian/plugins/custom-icon/`.
3. In Obsidian, choose **Open folder as vault** and select `examples/programming-languages-vault`.
4. If Obsidian prompts about Restricted Mode, trust the vault and enable **Vault Icon Studio**.

The committed sample contains only local Markdown, SVG icons, and plugin configuration. The generated `main.js` bundle is deliberately not committed.

## What to try

- Expand **Programming Languages** and compare the folder and language-note icons.
- Open each language note and confirm the same icon appears in the tab and note title.
- Open **Welcome to Vault Icon Studio** in Live Preview and Reading view to compare inline rendering.
- Right-click the annotated TypeScript icon. Confirm that its Markdown annotation contains a working wiki link.
- Open the command palette and search for **Vault Icon Studio**. All three commands should appear.
- Right-click a file, choose **Change custom icon**, and browse both the **Icons** and **Upload** tabs.

## Sample layout

```text
Programming Languages/
├── TypeScript.md
├── Python.md
├── Rust.md
├── Go.md
└── Swift.md
```

The sample uses the stable plugin directory and ID `custom-icon`. This is intentional compatibility behavior after the product-name change.
