import { CSS_PREFIX } from "../constants";
import type IconicaPlugin from "../main";
import { type ProcessedImage, processImage } from "../services/ImageProcessor";
import type { IconPickerModal, TabRenderer } from "./IconPickerModal";

export class UploadTab implements TabRenderer {
	private container!: HTMLElement;
	private processedImage: ProcessedImage | null = null;
	private addToLibrary = false;

	constructor(
		private plugin: IconicaPlugin,
		private modal: IconPickerModal,
	) {}

	render(container: HTMLElement): void {
		this.container = container;
		this.processedImage = null;
		this.renderUploadZone();
	}

	// ─── Private ────────────────────────────────────

	private renderUploadZone() {
		const zone = this.container.createDiv({ cls: `${CSS_PREFIX}-upload-zone` });

		zone.createDiv({ text: "\uD83D\uDDBC\uFE0F", cls: `${CSS_PREFIX}-upload-zone-icon` });
		zone.createDiv({ text: "Upload an image", cls: `${CSS_PREFIX}-upload-zone-text` });
		zone.createDiv({
			text: "or \u2318+V to paste an image or link",
			cls: `${CSS_PREFIX}-upload-zone-hint`,
		});

		// Click to open file picker
		zone.addEventListener("click", () => this.openFilePicker());

		// Drag & drop
		zone.addEventListener("dragover", (e) => {
			e.preventDefault();
			zone.addClass("is-dragover");
		});
		zone.addEventListener("dragleave", () => {
			zone.removeClass("is-dragover");
		});
		zone.addEventListener("drop", (e) => {
			e.preventDefault();
			zone.removeClass("is-dragover");
			const file = e.dataTransfer?.files[0];
			if (file?.type.startsWith("image/")) {
				this.handleFile(file);
			}
		});

		// Paste handler
		const pasteHandler = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (const item of Array.from(items)) {
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) {
						e.preventDefault();
						this.handleFile(file);
						return;
					}
				}
			}
		};
		document.addEventListener("paste", pasteHandler);

		// Cleanup paste handler when modal closes
		const originalClose = this.modal.onClose.bind(this.modal);
		this.modal.onClose = () => {
			document.removeEventListener("paste", pasteHandler);
			originalClose();
		};
	}

	private openFilePicker() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (file) this.handleFile(file);
		});
		input.click();
	}

	private async handleFile(file: File) {
		this.container.empty();
		this.container.createEl("p", {
			text: "Processing...",
			cls: `${CSS_PREFIX}-placeholder`,
		});

		try {
			this.processedImage = await processImage(file);
			this.container.empty();
			this.renderPreview();
		} catch {
			this.container.empty();
			this.container.createEl("p", {
				text: "Failed to process image",
				cls: `${CSS_PREFIX}-placeholder`,
			});
		}
	}

	private renderPreview() {
		if (!this.processedImage) return;

		const section = this.container.createDiv({ cls: `${CSS_PREFIX}-preview-section` });
		section.createDiv({ text: "Preview", cls: `${CSS_PREFIX}-preview-label` });

		const row = section.createDiv({ cls: `${CSS_PREFIX}-preview-row` });

		// Light preview
		const lightCard = row.createDiv({
			cls: `${CSS_PREFIX}-preview-card is-light`,
		});
		const lightImg = lightCard.createEl("img");
		lightImg.src = this.processedImage.lightDataUrl;
		lightImg.alt = "Light mode";

		// Dark preview
		const darkCard = row.createDiv({
			cls: `${CSS_PREFIX}-preview-card is-dark`,
		});
		const darkImg = darkCard.createEl("img");
		darkImg.src = this.processedImage.darkDataUrl;
		darkImg.alt = "Dark mode";

		// Add to library checkbox
		const checkboxLabel = this.container.createDiv({ cls: `${CSS_PREFIX}-library-checkbox` });
		const checkbox = checkboxLabel.createEl("input", { type: "checkbox" });
		checkbox.checked = this.addToLibrary;
		checkbox.addEventListener("change", () => {
			this.addToLibrary = checkbox.checked;
		});
		checkboxLabel.createSpan({ text: "Add to workspace icon library" });

		// Save button
		const footer = this.container.createDiv({
			cls: `${CSS_PREFIX}-picker-footer`,
			attr: { style: "border-top: none; padding-top: 8px;" },
		});
		footer
			.createEl("button", {
				text: "Cancel",
				cls: `${CSS_PREFIX}-cancel-btn`,
			})
			.addEventListener("click", () => this.modal.close());

		const saveBtn = footer.createEl("button", {
			text: "Save",
			cls: `${CSS_PREFIX}-save-btn`,
		});
		saveBtn.addEventListener("click", () => this.save());
	}

	private async save() {
		if (!this.processedImage) return;

		const id = `custom-${Date.now()}`;
		const adapter = this.plugin.app.vault.adapter;
		const pluginDir = this.plugin.manifest.dir!;
		const iconsDir = `${pluginDir}/icons`;

		// Ensure icons directory exists
		if (!(await adapter.exists(iconsDir))) {
			await adapter.mkdir(iconsDir);
		}

		// Write light and dark images
		await adapter.writeBinary(`${iconsDir}/${id}-light.png`, this.processedImage.lightData);
		await adapter.writeBinary(`${iconsDir}/${id}-dark.png`, this.processedImage.darkData);

		// Set the icon on the target file/folder
		this.modal.selectIcon({ type: "custom", value: id });

		// Optionally add to library
		if (this.addToLibrary) {
			await this.addToIconLibrary(id);
		}
	}

	private async addToIconLibrary(id: string) {
		const adapter = this.plugin.app.vault.adapter;
		const pluginDir = this.plugin.manifest.dir!;
		const libraryPath = `${pluginDir}/icon-library.json`;

		let library: {
			icons: {
				id: string;
				name: string;
				lightPath: string;
				darkPath: string;
				createdAt: number;
				tags: string[];
			}[];
		} = { icons: [] };
		try {
			const raw = await adapter.read(libraryPath);
			library = JSON.parse(raw);
		} catch {
			// File doesn't exist yet
		}

		library.icons.push({
			id,
			name: id,
			lightPath: `icons/${id}-light.png`,
			darkPath: `icons/${id}-dark.png`,
			createdAt: Date.now(),
			tags: [],
		});

		await adapter.write(libraryPath, JSON.stringify(library, null, "\t"));
	}
}
