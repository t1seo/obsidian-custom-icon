import { describe, expect, it } from "vitest";
import {
	CSS_PREFIX,
	DEFAULT_SETTINGS,
	EXPLORER_ICON_SIZE,
	ICONS_DIR,
	LIBRARY_FILE,
	TAB_ICON_SIZE,
	TITLE_ICON_SIZE,
} from "../src/constants";

describe("constants", () => {
	it("EXPLORER_ICON_SIZE is 17", () => {
		expect(EXPLORER_ICON_SIZE).toBe(17);
	});

	it("TAB_ICON_SIZE is 16", () => {
		expect(TAB_ICON_SIZE).toBe(16);
	});

	it("TITLE_ICON_SIZE is 48", () => {
		expect(TITLE_ICON_SIZE).toBe(48);
	});

	it("DEFAULT_SETTINGS has enableInlineIcons false", () => {
		expect(DEFAULT_SETTINGS).toEqual({ enableInlineIcons: false });
	});

	it("CSS_PREFIX is iconica", () => {
		expect(CSS_PREFIX).toBe("iconica");
	});

	it("ICONS_DIR is icons", () => {
		expect(ICONS_DIR).toBe("icons");
	});

	it("LIBRARY_FILE is icon-library.json", () => {
		expect(LIBRARY_FILE).toBe("icon-library.json");
	});
});
