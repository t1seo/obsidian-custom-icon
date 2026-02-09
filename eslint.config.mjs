import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";

export default tseslint.config(
	{
		languageOptions: {
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				allowDefaultProject: ["eslint.config.mjs", "manifest.json"],
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		rules: {
			"@typescript-eslint/require-await": "error",
		},
	},
	{
		ignores: [
			"node_modules/",
			"dist/",
			"main.js",
			"esbuild.config.mjs",
			"eslint.config.mjs",
			"versions.json",
		],
	},
);
