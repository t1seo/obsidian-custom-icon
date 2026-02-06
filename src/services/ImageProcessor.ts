/**
 * Processes uploaded images for icon use.
 * Resizes to square and preserves transparency.
 * Background color is handled by CSS at display time,
 * matching Obsidian's theme variables per location.
 */

/** Result of image processing */
export interface ProcessedImage {
	data: ArrayBuffer;
	dataUrl: string;
}

/** Resize and crop image to a square icon */
function resizeToSquare(img: HTMLImageElement, size: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d")!;

	// Crop to square from center
	const srcSize = Math.min(img.naturalWidth, img.naturalHeight);
	const sx = (img.naturalWidth - srcSize) / 2;
	const sy = (img.naturalHeight - srcSize) / 2;

	ctx.drawImage(img, sx, sy, srcSize, srcSize, 0, 0, size, size);
	return canvas;
}

/** Convert canvas to ArrayBuffer (PNG) */
function canvasToArrayBuffer(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) return reject(new Error("Failed to create blob"));
			blob.arrayBuffer().then(resolve).catch(reject);
		}, "image/png");
	});
}

/** Load an image from a File or ArrayBuffer */
export function loadImage(source: File | ArrayBuffer): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;

		if (source instanceof File) {
			img.src = URL.createObjectURL(source);
		} else {
			const blob = new Blob([source], { type: "image/png" });
			img.src = URL.createObjectURL(blob);
		}
	});
}

/**
 * Process an uploaded image: resize to 128x128 square, preserve transparency.
 * No background is baked in — CSS handles background per display location.
 */
export async function processImage(file: File, size = 128): Promise<ProcessedImage> {
	const img = await loadImage(file);
	const canvas = resizeToSquare(img, size);

	const data = await canvasToArrayBuffer(canvas);
	const dataUrl = canvas.toDataURL("image/png");

	return { data, dataUrl };
}
