import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = process.env.PICKER_SOURCE_ROOT ?? process.cwd();
const readSource = (path: string) => readFileSync(join(sourceRoot, path), "utf8");

describe("icon picker UX regressions", () => {
	it("keeps a single picker modal active", () => {
		const source = readSource("src/ui/IconPickerModal.ts");

		expect(source).toContain("private static activeModal: IconPickerModal | null = null;");
		expect(source).toMatch(
			/const previousModal = IconPickerModal\.activeModal;[\s\S]*IconPickerModal\.activeModal = this;[\s\S]*previousModal\.close\(\)/,
		);
	});

	it("selects a visible icon from the random action", () => {
		const source = readSource("src/ui/CustomTab.ts");

		expect(source).toMatch(
			/onRandom\(\): void \{[\s\S]*this\.visibleIcons[\s\S]*this\.modal\.selectIcon\(\{ type: "custom", value: icon\.id \}\)/,
		);
	});

	it("preserves edited batch entries when a neighboring row is removed", () => {
		const source = readSource("src/ui/UploadTab.ts");

		expect(source).toContain(
			"const remaining = entries.filter((candidate) => candidate !== entry);",
		);
		expect(source).toContain("this.renderBatchEntries(remaining);");
		expect(source).not.toContain("this.renderBatchReview(entries.map((e) => e.file));");
	});

	it("exposes tabs and upload controls to keyboard and assistive technology", () => {
		const pickerSource = readSource("src/ui/IconPickerModal.ts");
		const uploadSource = readSource("src/ui/UploadTab.ts");

		expect(pickerSource).toContain('role: "tablist"');
		expect(pickerSource).toContain('role: "tabpanel"');
		expect(pickerSource).toContain(
			'["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)',
		);
		expect(uploadSource).toContain('role: "button"');
		expect(uploadSource).toContain('event.key !== "Enter" && event.key !== " "');
		expect(uploadSource).toContain('"aria-label": `Remove ${entry.name} from import`');
	});
});
