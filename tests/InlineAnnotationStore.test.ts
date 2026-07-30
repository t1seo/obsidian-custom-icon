import { describe, expect, it } from "vitest";
import { InlineAnnotationStore } from "../src/services/InlineAnnotationStore";

describe("InlineAnnotationStore", () => {
	it("creates and retrieves a Markdown annotation", () => {
		const store = new InlineAnnotationStore();

		const annotation = store.set("note-1", "**Important** [[Details]]", 100);

		expect(annotation).toEqual({
			id: "note-1",
			markdown: "**Important** [[Details]]",
			createdAt: 100,
			updatedAt: 100,
		});
		expect(store.get("note-1")).toEqual(annotation);
	});

	it("updates Markdown while preserving the creation time", () => {
		const store = new InlineAnnotationStore({
			"note-1": {
				id: "note-1",
				markdown: "Old",
				createdAt: 100,
				updatedAt: 100,
			},
		});

		expect(store.set("note-1", "New", 200)).toEqual({
			id: "note-1",
			markdown: "New",
			createdAt: 100,
			updatedAt: 200,
		});
	});

	it("restores explicit creation and update timestamps", () => {
		const store = new InlineAnnotationStore();

		expect(store.set("note-1", "Restored", 250, 100)).toEqual({
			id: "note-1",
			markdown: "Restored",
			createdAt: 100,
			updatedAt: 250,
		});
	});

	it("removes an annotation and reports whether it existed", () => {
		const store = new InlineAnnotationStore();
		store.set("note-1", "Text", 100);

		expect(store.remove("note-1")).toBe(true);
		expect(store.remove("note-1")).toBe(false);
		expect(store.get("note-1")).toBeUndefined();
	});

	it("returns snapshots that cannot mutate the store", () => {
		const store = new InlineAnnotationStore();
		store.set("note-1", "Original", 100);

		const snapshot = store.toJSON();
		snapshot["note-1"].markdown = "Changed outside";

		expect(store.get("note-1")?.markdown).toBe("Original");
	});
});
