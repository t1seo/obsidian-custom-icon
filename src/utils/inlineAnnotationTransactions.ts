import { setInlineIconAnnotation } from "./inlineIconSyntax";

interface RemoveInlineIconAnnotationOptions {
	annotatedShortcode: string;
	replaceShortcode: (nextShortcode: string) => Promise<void>;
	removeAnnotation: () => Promise<void>;
	reportRollbackError?: (error: unknown) => void;
}

export async function removeInlineIconAnnotation({
	annotatedShortcode,
	replaceShortcode,
	removeAnnotation,
	reportRollbackError = (error) =>
		console.error("Failed to restore inline icon annotation shortcode", error),
}: RemoveInlineIconAnnotationOptions): Promise<void> {
	await replaceShortcode(setInlineIconAnnotation(annotatedShortcode, null));
	try {
		await removeAnnotation();
	} catch (error) {
		try {
			await replaceShortcode(annotatedShortcode);
		} catch (rollbackError) {
			reportRollbackError(rollbackError);
		}
		throw error;
	}
}
