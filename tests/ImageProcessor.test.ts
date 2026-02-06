import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { loadImage, processImage } from "../src/services/ImageProcessor";
import type { ProcessedImage } from "../src/services/ImageProcessor";

// Mock canvas and related APIs since jsdom doesn't support canvas rendering
const mockCtx = {
	drawImage: vi.fn(),
};

function createMockBlob() {
	const blob = new Blob(["fake-image-data"], { type: "image/png" });
	// Ensure arrayBuffer is available (jsdom may not have it)
	if (!blob.arrayBuffer) {
		(blob as any).arrayBuffer = () => Promise.resolve(new ArrayBuffer(8));
	}
	return blob;
}

const mockCanvas = {
	width: 0,
	height: 0,
	getContext: vi.fn(() => mockCtx),
	toBlob: vi.fn((cb: (blob: Blob | null) => void) => cb(createMockBlob())),
	toDataURL: vi.fn(() => "data:image/png;base64,fakedata"),
};

let imageInstances: any[] = [];

beforeEach(() => {
	imageInstances = [];
	mockCtx.drawImage.mockClear();
	mockCanvas.toBlob.mockImplementation((cb: (blob: Blob | null) => void) => cb(createMockBlob()));
	mockCanvas.toDataURL.mockReturnValue("data:image/png;base64,fakedata");

	vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
		if (tag === "canvas") return mockCanvas as any;
		// Call through for non-canvas elements
		return document.createElementNS("http://www.w3.org/1999/xhtml", tag) as any;
	});

	vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:fake-url");
});

afterEach(() => {
	vi.restoreAllMocks();
});

function stubImage(props: { naturalWidth: number; naturalHeight: number; shouldFail?: boolean }) {
	vi.stubGlobal("Image", class MockImage {
		onload: (() => void) | null = null;
		onerror: ((e: any) => void) | null = null;
		src = "";
		naturalWidth = props.naturalWidth;
		naturalHeight = props.naturalHeight;

		constructor() {
			imageInstances.push(this);
			setTimeout(() => {
				if (props.shouldFail) {
					this.onerror?.(new Error("load failed"));
				} else {
					this.onload?.();
				}
			}, 0);
		}
	});
}

describe("loadImage", () => {
	it("loads image from File", async () => {
		stubImage({ naturalWidth: 100, naturalHeight: 100 });
		const file = new File(["data"], "test.png", { type: "image/png" });

		const img = await loadImage(file);
		expect(img.src).toBe("blob:fake-url");
	});

	it("loads image from ArrayBuffer", async () => {
		stubImage({ naturalWidth: 64, naturalHeight: 64 });
		const buffer = new ArrayBuffer(8);

		const img = await loadImage(buffer);
		expect(img.src).toBe("blob:fake-url");
	});

	it("rejects on image load error", async () => {
		stubImage({ naturalWidth: 0, naturalHeight: 0, shouldFail: true });
		const file = new File(["bad"], "bad.png", { type: "image/png" });

		await expect(loadImage(file)).rejects.toThrow();
	});
});

describe("processImage", () => {
	it("returns processed image with data and dataUrl", async () => {
		stubImage({ naturalWidth: 200, naturalHeight: 200 });
		const file = new File(["data"], "icon.png", { type: "image/png" });

		const result: ProcessedImage = await processImage(file, 128);

		expect(result.dataUrl).toBe("data:image/png;base64,fakedata");
		expect(result.data).toBeInstanceOf(ArrayBuffer);
		expect(mockCanvas.width).toBe(128);
		expect(mockCanvas.height).toBe(128);
		expect(mockCtx.drawImage).toHaveBeenCalled();
	});

	it("uses default size of 128", async () => {
		stubImage({ naturalWidth: 64, naturalHeight: 64 });
		const file = new File(["data"], "icon.png", { type: "image/png" });

		await processImage(file);
		expect(mockCanvas.width).toBe(128);
	});

	it("crops non-square images from center", async () => {
		stubImage({ naturalWidth: 400, naturalHeight: 200 });
		const file = new File(["data"], "wide.png", { type: "image/png" });

		await processImage(file, 64);

		// srcSize = min(400, 200) = 200, sx = (400-200)/2 = 100, sy = 0
		const call = mockCtx.drawImage.mock.calls[0];
		expect(call[1]).toBe(100); // sx
		expect(call[2]).toBe(0);   // sy
		expect(call[3]).toBe(200); // srcSize
		expect(call[4]).toBe(200); // srcSize
		expect(call[5]).toBe(0);   // dx
		expect(call[6]).toBe(0);   // dy
		expect(call[7]).toBe(64);  // size
		expect(call[8]).toBe(64);  // size
	});

	it("rejects when toBlob returns null", async () => {
		stubImage({ naturalWidth: 100, naturalHeight: 100 });
		const file = new File(["data"], "icon.png", { type: "image/png" });

		mockCanvas.toBlob.mockImplementationOnce((cb: (blob: Blob | null) => void) => cb(null));

		await expect(processImage(file)).rejects.toThrow("Failed to create blob");
	});
});
