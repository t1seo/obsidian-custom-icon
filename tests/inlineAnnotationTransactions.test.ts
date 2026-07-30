import { describe, expect, it, vi } from "vitest";
import { removeInlineIconAnnotation } from "../src/utils/inlineAnnotationTransactions";

describe("removeInlineIconAnnotation", () => {
	it("removes source and persisted data in order", async () => {
		const calls: string[] = [];

		await removeInlineIconAnnotation({
			annotatedShortcode: ":ci-compass~note-123456789abc:",
			replaceShortcode: vi.fn(async () => {
				calls.push("source");
			}),
			removeAnnotation: vi.fn(async () => {
				calls.push("storage");
			}),
		});

		expect(calls).toEqual(["source", "storage"]);
	});

	it("does not remove persisted data when replacing the source fails", async () => {
		const sourceError = new Error("source write failed");
		const replaceShortcode = vi.fn().mockRejectedValue(sourceError);
		const removeAnnotation = vi.fn();

		await expect(
			removeInlineIconAnnotation({
				annotatedShortcode: ":ci-compass~note-123456789abc:",
				replaceShortcode,
				removeAnnotation,
			}),
		).rejects.toBe(sourceError);

		expect(removeAnnotation).not.toHaveBeenCalled();
	});

	it("keeps persisted data when storage and source rollback both fail", async () => {
		const storageError = new Error("storage write failed");
		const rollbackError = new Error("source rollback failed");
		let annotationExists = true;
		const replaceShortcode = vi
			.fn()
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(rollbackError);
		const removeAnnotation = vi.fn(async () => {
			annotationExists = false;
			try {
				throw storageError;
			} catch (error) {
				annotationExists = true;
				throw error;
			}
		});
		const reportRollbackError = vi.fn();

		await expect(
			removeInlineIconAnnotation({
				annotatedShortcode: ":ci-compass~note-123456789abc:",
				replaceShortcode,
				removeAnnotation,
				reportRollbackError,
			}),
		).rejects.toBe(storageError);

		expect(annotationExists).toBe(true);
		expect(replaceShortcode).toHaveBeenNthCalledWith(1, ":ci-compass:");
		expect(replaceShortcode).toHaveBeenNthCalledWith(2, ":ci-compass~note-123456789abc:");
		expect(reportRollbackError).toHaveBeenCalledWith(rollbackError);
	});

	it("reports a failed source rollback by default", async () => {
		const storageError = new Error("storage write failed");
		const rollbackError = new Error("source rollback failed");
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		await expect(
			removeInlineIconAnnotation({
				annotatedShortcode: ":ci-compass~note-123456789abc:",
				replaceShortcode: vi
					.fn()
					.mockResolvedValueOnce(undefined)
					.mockRejectedValueOnce(rollbackError),
				removeAnnotation: vi.fn().mockRejectedValue(storageError),
			}),
		).rejects.toBe(storageError);

		expect(consoleError).toHaveBeenCalledWith(
			"Failed to restore inline icon annotation shortcode",
			rollbackError,
		);
		consoleError.mockRestore();
	});
});
