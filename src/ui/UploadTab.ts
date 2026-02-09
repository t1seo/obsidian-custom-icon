import { CSS_PREFIX, ICONS_DIR } from "../constants";
import type IconicaPlugin from "../main";
import { type ProcessedImage, processImage } from "../services/ImageProcessor";
import type { IconPickerModal, TabRenderer } from "./IconPickerModal";

/**
 * Upload tab: drag-and-drop or file picker to upload a custom icon image.
 * Processes the image for light/dark mode variants, saves to library.
 */
export class UploadTab implements TabRenderer {
	private container!: HTMLElement;
	private processedImage: ProcessedImage | null = null;
	private pasteHandler: ((e: ClipboardEvent) => void) | null = null;

	constructor(
		private plugin: IconicaPlugin,
		private modal: IconPickerModal,
	) {}

	render(container: HTMLElement): void {
		this.container = container;
		this.processedImage = null;
		this.renderUploadZone();
	}

	destroy(): void {
		if (this.pasteHandler) {
			document.removeEventListener("paste", this.pasteHandler);
			this.pasteHandler = null;
		}
	}

	// ─── Private ────────────────────────────────────

	private renderUploadZone() {
		const zone = this.container.createDiv({ cls: `${CSS_PREFIX}-upload-zone` });

		const iconDiv = zone.createDiv({ cls: `${CSS_PREFIX}-upload-zone-icon` });
		iconDiv.textContent = "\uD83D\uDCC1";

		zone.createDiv({
			text: "Click to upload or drag an image",
			cls: `${CSS_PREFIX}-upload-zone-text`,
		});
		zone.createDiv({
			text: "PNG, JPG, SVG \u00B7 Cmd+V to paste",
			cls: `${CSS_PREFIX}-upload-zone-hint`,
		});

		// Click
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
				void this.handleFile(file);
			}
		});

		// Paste handler
		this.pasteHandler = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;
			for (const item of Array.from(items)) {
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) {
						e.preventDefault();
						void this.handleFile(file);
						return;
					}
				}
			}
		};
		document.addEventListener("paste", this.pasteHandler);
	}

	private openFilePicker() {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (file) void this.handleFile(file);
		});
		input.click();
	}

	private async handleFile(file: File) {
		this.container.empty();
		this.container.createEl("p", {
			text: "Processing image...",
			cls: `${CSS_PREFIX}-placeholder`,
		});

		try {
			this.processedImage = await processImage(file);
			this.container.empty();
			this.renderPreview(file.name.replace(/\.[^.]+$/, ""));
		} catch {
			this.container.empty();
			this.container.createEl("p", {
				text: "Failed to process image",
				cls: `${CSS_PREFIX}-placeholder`,
			});
		}
	}

	private renderPreview(defaultName: string) {
		if (!this.processedImage) return;

		// Preview section
		const section = this.container.createDiv({ cls: `${CSS_PREFIX}-preview-section` });

		const row = section.createDiv({ cls: `${CSS_PREFIX}-preview-row` });

		// Sidebar preview
		const sidebarCol = row.createDiv({ cls: `${CSS_PREFIX}-preview-col` });
		const sidebarCard = sidebarCol.createDiv({ cls: `${CSS_PREFIX}-preview-card is-sidebar` });
		const sidebarImg = sidebarCard.createEl("img");
		sidebarImg.src = this.processedImage.dataUrl;
		sidebarImg.alt = "Sidebar";
		sidebarCol.createDiv({ text: "Sidebar", cls: `${CSS_PREFIX}-preview-card-label` });

		// Editor preview
		const editorCol = row.createDiv({ cls: `${CSS_PREFIX}-preview-col` });
		const editorCard = editorCol.createDiv({ cls: `${CSS_PREFIX}-preview-card is-editor` });
		const editorImg = editorCard.createEl("img");
		editorImg.src = this.processedImage.dataUrl;
		editorImg.alt = "Editor";
		editorCol.createDiv({ text: "Editor", cls: `${CSS_PREFIX}-preview-card-label` });

		// Bottom bar: checkbox left, buttons right
		const bottomBar = this.container.createDiv({ cls: `${CSS_PREFIX}-upload-bottom` });

		// Left: checkbox + name input
		const leftGroup = bottomBar.createDiv({ cls: `${CSS_PREFIX}-upload-bottom-left` });

		const checkboxRow = leftGroup.createDiv({ cls: `${CSS_PREFIX}-upload-checkbox-row` });
		const checkbox = checkboxRow.createEl("input", {
			type: "checkbox",
			cls: `${CSS_PREFIX}-upload-checkbox`,
		});
		checkbox.id = "iconica-save-to-library";
		checkboxRow.createEl("label", {
			text: "Save to library",
			cls: `${CSS_PREFIX}-upload-checkbox-label`,
			attr: { for: "iconica-save-to-library" },
		});

		const nameGroup = leftGroup.createDiv({ cls: `${CSS_PREFIX}-upload-name-group` });
		nameGroup.classList.add("iconica-hidden");
		const nameInput = nameGroup.createEl("input", {
			type: "text",
			placeholder: "Icon name",
			cls: `${CSS_PREFIX}-upload-name-input`,
			value: defaultName,
		});
		nameInput.value = defaultName;

		checkbox.addEventListener("change", () => {
			nameGroup.classList.toggle("iconica-hidden", !checkbox.checked);
		});

		// Right: buttons
		const actions = bottomBar.createDiv({ cls: `${CSS_PREFIX}-upload-actions` });

		actions
			.createEl("button", {
				text: "Back",
				cls: `${CSS_PREFIX}-cancel-btn`,
			})
			.addEventListener("click", () => {
				this.container.empty();
				this.processedImage = null;
				this.renderUploadZone();
			});

		actions
			.createEl("button", {
				text: "Apply",
				cls: `${CSS_PREFIX}-save-btn`,
			})
			.addEventListener("click", () => {
				const saveToLibrary = checkbox.checked;
				const name = nameInput.value.trim() || defaultName;
				void this.applyIcon(name, saveToLibrary);
			});
	}

	private async applyIcon(name: string, saveToLibrary: boolean) {
		if (!this.processedImage) return;

		const id = `custom-${Date.now()}`;
		const adapter = this.plugin.app.vault.adapter;
		const pluginDir = this.plugin.manifest.dir!;
		const iconsDir = `${pluginDir}/${ICONS_DIR}`;

		// Ensure icons directory exists
		if (!(await adapter.exists(iconsDir))) {
			await adapter.mkdir(iconsDir);
		}

		// Write single transparent image
		await adapter.writeBinary(`${iconsDir}/${id}.png`, this.processedImage.data);

		// Optionally add to library
		if (saveToLibrary) {
			await this.plugin.iconLibrary.add({
				id,
				name,
				path: `${ICONS_DIR}/${id}.png`,
				createdAt: Date.now(),
				tags: [],
			});
		}

		// Apply icon immediately
		this.modal.selectIcon({ type: "custom", value: id });
	}
}
