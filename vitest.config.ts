import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		globals: true,
		include: ["tests/**/*.test.ts"],
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: [
				"src/main.ts",
				"src/settings.ts",
				"src/types.ts",
				"src/ui/**",
				"src/features/ExplorerIcons.ts",
				"src/features/TabIcons.ts",
				"src/features/TitleIcons.ts",
				"src/features/ContextMenu.ts",
				"src/features/InlineIcons.ts",
			],
			thresholds: {
				statements: 100,
				branches: 100,
				functions: 100,
				lines: 100,
			},
		},
	},
});
