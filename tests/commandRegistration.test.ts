import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("command registration", () => {
	it("registers every public command exactly once", () => {
		const sources = ["src/main.ts", "src/features/ContextMenu.ts"].map((path) =>
			readFileSync(path, "utf8"),
		);
		const commandIds = sources.flatMap((source) =>
			[...source.matchAll(/\bid:\s*"([a-z-]+)"/g)].map((match) => match[1]),
		);

		expect(commandIds.sort()).toEqual(["change-icon", "insert-inline-icon", "remove-icon"]);
	});
});
