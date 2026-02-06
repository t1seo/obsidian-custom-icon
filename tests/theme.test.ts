import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isDarkMode, onThemeChange } from "../src/utils/theme";

describe("theme utilities", () => {
	beforeEach(() => {
		document.body.className = "";
	});

	afterEach(() => {
		document.body.className = "";
	});

	describe("isDarkMode", () => {
		it("returns true when body has theme-dark class", () => {
			document.body.classList.add("theme-dark");
			expect(isDarkMode()).toBe(true);
		});

		it("returns false when body does not have theme-dark class", () => {
			document.body.classList.add("theme-light");
			expect(isDarkMode()).toBe(false);
		});

		it("returns false on empty class list", () => {
			expect(isDarkMode()).toBe(false);
		});
	});

	describe("onThemeChange", () => {
		it("returns a MutationObserver", () => {
			const callback = vi.fn();
			const observer = onThemeChange(callback);
			expect(observer).toBeInstanceOf(MutationObserver);
			observer.disconnect();
		});

		it("calls callback when body class changes to dark", async () => {
			const callback = vi.fn();
			const observer = onThemeChange(callback);

			document.body.classList.add("theme-dark");

			// MutationObserver is async — flush microtasks
			await new Promise((r) => setTimeout(r, 0));

			expect(callback).toHaveBeenCalledWith(true);
			observer.disconnect();
		});

		it("calls callback when body class changes to light", async () => {
			document.body.classList.add("theme-dark");
			const callback = vi.fn();
			const observer = onThemeChange(callback);

			document.body.classList.remove("theme-dark");
			document.body.classList.add("theme-light");

			await new Promise((r) => setTimeout(r, 0));

			expect(callback).toHaveBeenCalledWith(false);
			observer.disconnect();
		});

		it("does not fire for non-class attribute changes", async () => {
			const callback = vi.fn();
			const observer = onThemeChange(callback);

			document.body.setAttribute("data-foo", "bar");

			await new Promise((r) => setTimeout(r, 0));

			expect(callback).not.toHaveBeenCalled();
			observer.disconnect();
		});
	});
});
