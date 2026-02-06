/**
 * Processes uploaded images for icon use.
 * Generates light and dark mode variants.
 */

/** Result of image processing */
export interface ProcessedImage {
	lightData: ArrayBuffer;
	darkData: ArrayBuffer;
	lightDataUrl: string;
	darkDataUrl: string;
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

/** Create a dark-mode variant by inverting + hue-rotating */
function createDarkVariant(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = sourceCanvas.width;
	canvas.height = sourceCanvas.height;
	const ctx = canvas.getContext("2d")!;

	// Apply CSS-like filter: invert(1) hue-rotate(180deg)
	ctx.filter = "invert(1) hue-rotate(180deg)";
	ctx.drawImage(sourceCanvas, 0, 0);

	return canvas;
}

/** Detect if an image is predominantly dark */
function isDarkImage(canvas: HTMLCanvasElement): boolean {
	const ctx = canvas.getContext("2d")!;
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;

	let totalBrightness = 0;
	let pixelCount = 0;

	for (let i = 0; i < data.length; i += 4) {
		const a = data[i + 3];
		if (a < 128) continue; // Skip transparent pixels

		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		// Weighted brightness (ITU-R BT.601)
		totalBrightness += (r * 299 + g * 587 + b * 114) / 1000;
		pixelCount++;
	}

	if (pixelCount === 0) return false;
	return totalBrightness / pixelCount < 128;
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

/** Convert canvas to data URL */
function canvasToDataUrl(canvas: HTMLCanvasElement): string {
	return canvas.toDataURL("image/png");
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
 * Process an uploaded image: resize to 128x128 and generate light/dark variants.
 *
 * Strategy:
 * - If the source image is dark → use as dark variant, invert for light
 * - If the source image is light → use as light variant, invert for dark
 */
export async function processImage(file: File, size = 128): Promise<ProcessedImage> {
	const img = await loadImage(file);
	const squareCanvas = resizeToSquare(img, size);

	let lightCanvas: HTMLCanvasElement;
	let darkCanvas: HTMLCanvasElement;

	if (isDarkImage(squareCanvas)) {
		// Source is dark → use for dark mode, invert for light
		darkCanvas = squareCanvas;
		lightCanvas = createDarkVariant(squareCanvas);
	} else {
		// Source is light → use for light mode, invert for dark
		lightCanvas = squareCanvas;
		darkCanvas = createDarkVariant(squareCanvas);
	}

	const [lightData, darkData] = await Promise.all([
		canvasToArrayBuffer(lightCanvas),
		canvasToArrayBuffer(darkCanvas),
	]);

	return {
		lightData,
		darkData,
		lightDataUrl: canvasToDataUrl(lightCanvas),
		darkDataUrl: canvasToDataUrl(darkCanvas),
	};
}
