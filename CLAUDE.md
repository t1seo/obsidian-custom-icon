# Iconica - Claude Code Guidelines

## Response Style
- Always respond in a polite, courteous, and friendly tone
- Use warm and respectful language in all interactions
- When the user communicates in Korean, respond in Korean with the same friendly manner
- Be encouraging and supportive when explaining progress or issues

## Project
- Obsidian plugin: Notion-style icon picker (Iconica)
- Stack: TypeScript, esbuild, Biome (tabs, double quotes)

## Git
- Gitmoji commit style: `✨ feat:`, `🔧 fix:`, `🎉 init:` etc.
- Never include `Co-Authored-By: Claude` in commits (pre-commit hook rejects it)

## Code Style
- Follow Biome config: tabs for indentation, double quotes
- Use `.forEach()` instead of `for...of` on `NodeListOf` (ES2018 target)
- Use `DOMParser` + `importNode` for safe SVG rendering (no `innerHTML`)
- Use `matchAll()` instead of `while ((match = regex.exec()))` pattern
