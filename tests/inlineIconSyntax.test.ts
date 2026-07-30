import { describe, expect, it } from "vitest";
import {
	buildInlineIconRegex,
	replaceInlineIconInSection,
	setInlineIconAnnotation,
} from "../src/utils/inlineIconSyntax";

describe("inline icon annotation syntax", () => {
	it("matches legacy and annotated shortcodes without changing the icon reference", () => {
		const text = "Before :ci-compass: and :ci-map-pin~note-a1b2:.";
		const matches = [...text.matchAll(buildInlineIconRegex("ci"))];

		expect(matches.map((match) => [match[0], match[1], match[2]])).toEqual([
			[":ci-compass:", "compass", undefined],
			[":ci-map-pin~note-a1b2:", "map-pin", "note-a1b2"],
		]);
	});

	it("escapes regular-expression characters in a custom prefix", () => {
		const matches = [...":my.icon-compass~note-1:".matchAll(buildInlineIconRegex("my.icon"))];

		expect(matches).toHaveLength(1);
		expect(matches[0][1]).toBe("compass");
		expect(matches[0][2]).toBe("note-1");
	});

	it("adds, replaces, and removes an annotation ID", () => {
		expect(setInlineIconAnnotation(":ci-compass:", "note-1")).toBe(
			":ci-compass~note-1:",
		);
		expect(setInlineIconAnnotation(":ci-compass~old:", "note-2")).toBe(
			":ci-compass~note-2:",
		);
		expect(setInlineIconAnnotation(":ci-compass~note-2:", null)).toBe(":ci-compass:");
	});

	it("replaces only the selected occurrence inside a rendered section", () => {
		const source = [
			"# Before",
			"",
			"First :ci-compass: and second :ci-compass:.",
			"Next line.",
			"",
			"# After :ci-compass:",
		].join("\n");

		expect(
			replaceInlineIconInSection(
				source,
				2,
				3,
				":ci-compass:",
				":ci-compass~note-2:",
				1,
			),
		).toBe(
			[
				"# Before",
				"",
				"First :ci-compass: and second :ci-compass~note-2:.",
				"Next line.",
				"",
				"# After :ci-compass:",
			].join("\n"),
		);
	});

	it("returns null when the section or occurrence is stale", () => {
		expect(replaceInlineIconInSection("one\ntwo", 5, 6, "one", "next", 0)).toBeNull();
		expect(replaceInlineIconInSection("one\ntwo", 0, 1, "missing", "next", 0)).toBeNull();
	});
});
