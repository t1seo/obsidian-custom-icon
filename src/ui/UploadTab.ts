import { setIcon } from "obsidian";
import { CSS_PREFIX, ICONS_DIR } from "../constants";
import type IconStudioPlugin from "../main";
import {
	type ProcessedImage,
	type ProcessedSvg,
	isSvgFile,
	processImage,
	processSvg,
} from "../services/ImageProcessor";
import type { CustomIcon } from "../types";
import type { IconPickerModal, TabRenderer } from "./IconPickerModal";

/** Accepted file extensions for the file picker */
const ACCEPT_TYPES = ".png,.jpg,.jpeg,.svg,.webp";

/** Tracks processed result and its detected file type */
interface ProcessedFile {
	data: ArrayBuffer;
	dataUrl: string;
	ext: "png" | "svg";
}

/** Entry in the batch review list */
interface BatchEntry {
	file: File;
	name: string;
	ext: "png" | "svg";
}

/**
 * Upload tab: drag-and-drop or file picker to upload a custom icon image.
 * Supports single file preview, SVG pass-through, and batch import with review.
 */
export class UploadTab implements TabRenderer {
	private container!: HTMLElement;
	private processed: ProcessedFile | null = null;
	private fileInputEl: HTMLInputElement | null = null;
	private pasteHandler: ((e: ClipboardEvent) => void) | null = null;
	private objectUrls = new Set<string>();

	constructor(
		private plugin: IconStudioPlugin,
		private modal: IconPickerModal,
	) {}

	render(container: HTMLElement): void {
		this.container = container;
		this.processed = null;
		this.renderUploadZone();
	}

	destroy(): void {
		if (this.pasteHandler) {
			document.removeEventListener("paste", this.pasteHandler);
			this.pasteHandler = null;
		}
		this.fileInputEl = null;
		this.clearObjectUrls();
	}

	// ─── Private ────────────────────────────────────

	private renderUploadZone() {
		this.clearObjectUrls();
		this.fileInputEl = this.container.createEl("input", {
			cls: `${CSS_PREFIX}-file-input`,
			attr: {
				type: "file",
				accept: ACCEPT_TYPES,
				multiple: "true",
				tabindex: "-1",
				"aria-hidden": "true",
			},
		});
		this.fileInputEl.addEventListener("change", () => {
			if (this.fileInputEl?.files && this.fileInputEl.files.length > 0) {
				void this.handleFiles(this.fileInputEl.files);
			}
		});

		const zone = this.container.createDiv({
			cls: `${CSS_PREFIX}-upload-zone`,
			attr: {
				role: "button",
				tabindex: "0",
				"aria-label": "Choose icon images to upload",
				"aria-describedby": `${CSS_PREFIX}-upload-formats ${CSS_PREFIX}-upload-methods`,
			},
		});

		const iconDiv = zone.createDiv({ cls: `${CSS_PREFIX}-upload-zone-icon` });
		setIcon(iconDiv, "upload-cloud");

		zone.createDiv({
			text: "Drop icon images here",
			cls: `${CSS_PREFIX}-upload-zone-text`,
		});
		zone.createDiv({
			text: "PNG, JPG, WebP, or SVG · multiple files supported",
			cls: `${CSS_PREFIX}-upload-zone-hint`,
			attr: { id: `${CSS_PREFIX}-upload-formats` },
		});
		zone.createSpan({
			text: "Browse files",
			cls: `${CSS_PREFIX}-upload-browse`,
		});
		zone.createDiv({
			text: "You can also paste an image from the clipboard",
			cls: `${CSS_PREFIX}-upload-zone-hint is-secondary`,
			attr: { id: `${CSS_PREFIX}-upload-methods` },
		});

		zone.addEventListener("click", () => this.openFilePicker());
		zone.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" && event.key !== " ") return;
			event.preventDefault();
			this.openFilePicker();
		});

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
			const files = e.dataTransfer?.files;
			if (!files || files.length === 0) return;
			void this.handleFiles(files);
		});

		if (this.pasteHandler) document.removeEventListener("paste", this.pasteHandler);
		this.pasteHandler = (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;
			for (const item of Array.from(items)) {
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) {
						e.preventDefault();
						void this.handleFiles(this.fileListFromSingle(file));
						return;
					}
				}
			}
		};
		document.addEventListener("paste", this.pasteHandler);
	}

	private openFilePicker() {
		if (!this.fileInputEl) return;
		this.fileInputEl.value = "";
		this.fileInputEl.click();
	}

	/** Route to single or batch handling based on file count */
	private handleFiles(files: FileList) {
		const imageFiles: File[] = [];
		for (let i = 0; i < files.length; i++) {
			const f = files[i];
			if (f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".svg")) {
				imageFiles.push(f);
			}
		}

		if (imageFiles.length === 0) {
			this.renderError("Choose a PNG, JPG, WebP, or SVG image.");
			return;
		}

		if (imageFiles.length === 1) {
			void this.handleSingleFile(imageFiles[0]);
		} else {
			this.renderBatchReview(imageFiles);
		}
	}

	// ─── Single File Flow ───────────────────────────

	private async handleSingleFile(file: File) {
		this.container.empty();
		this.container.createEl("p", {
			text: "Processing image...",
			cls: `${CSS_PREFIX}-placeholder`,
			attr: { role: "status", "aria-live": "polite" },
		});

		try {
			const isSvg = isSvgFile(file);
			let result: ProcessedImage | ProcessedSvg;
			if (isSvg) {
				result = await processSvg(file);
			} else {
				result = await processImage(file);
			}
			this.processed = {
				data: result.data,
				dataUrl: result.dataUrl,
				ext: isSvg ? "svg" : "png",
			};
			this.container.empty();
			this.renderPreview(file.name.replace(/\.[^.]+$/, ""));
		} catch {
			this.container.empty();
			this.renderError("This image could not be processed. Try another file.", true);
		}
	}

	private renderPreview(defaultName: string) {
		if (!this.processed) return;

		const isSvg = this.processed.ext === "svg";

		// Preview section
		const section = this.container.createDiv({ cls: `${CSS_PREFIX}-preview-section` });
		const row = section.createDiv({ cls: `${CSS_PREFIX}-preview-row` });

		// Sidebar preview
		const sidebarCol = row.createDiv({ cls: `${CSS_PREFIX}-preview-col` });
		const sidebarCard = sidebarCol.createDiv({ cls: `${CSS_PREFIX}-preview-card is-sidebar` });
		const sidebarImg = sidebarCard.createEl("img");
		sidebarImg.src = this.processed.dataUrl;
		sidebarImg.alt = "Sidebar";
		sidebarCol.createDiv({ text: "Sidebar", cls: `${CSS_PREFIX}-preview-card-label` });

		// Editor preview
		const editorCol = row.createDiv({ cls: `${CSS_PREFIX}-preview-col` });
		const editorCard = editorCol.createDiv({ cls: `${CSS_PREFIX}-preview-card is-editor` });
		const editorImg = editorCard.createEl("img");
		editorImg.src = this.processed.dataUrl;
		editorImg.alt = "Editor";
		editorCol.createDiv({ text: "Editor", cls: `${CSS_PREFIX}-preview-card-label` });

		// Bottom bar
		const bottomBar = this.container.createDiv({ cls: `${CSS_PREFIX}-upload-bottom` });
		const leftGroup = bottomBar.createDiv({ cls: `${CSS_PREFIX}-upload-bottom-left` });

		const checkboxRow = leftGroup.createDiv({ cls: `${CSS_PREFIX}-upload-checkbox-row` });
		const checkbox = checkboxRow.createEl("input", {
			type: "checkbox",
			cls: `${CSS_PREFIX}-upload-checkbox`,
		});
		checkbox.id = "custom-icon-save-to-library";

		if (isSvg) {
			checkbox.checked = true;
			checkbox.disabled = true;
		}

		checkboxRow.createEl("label", {
			text: "Save to library",
			cls: `${CSS_PREFIX}-upload-checkbox-label`,
			attr: { for: "custom-icon-save-to-library" },
		});

		const nameGroup = leftGroup.createDiv({ cls: `${CSS_PREFIX}-upload-name-group` });
		if (!isSvg) {
			nameGroup.classList.add("custom-icon-hidden");
		}
		const nameInput = nameGroup.createEl("input", {
			type: "text",
			placeholder: "Icon name",
			cls: `${CSS_PREFIX}-upload-name-input`,
			value: defaultName,
		});
		nameInput.value = defaultName;

		if (!isSvg) {
			checkbox.addEventListener("change", () => {
				nameGroup.classList.toggle("custom-icon-hidden", !checkbox.checked);
			});
		}

		const actions = bottomBar.createDiv({ cls: `${CSS_PREFIX}-upload-actions` });

		actions
			.createEl("button", {
				text: "Back",
				cls: `${CSS_PREFIX}-cancel-btn`,
			})
			.addEventListener("click", () => {
				this.container.empty();
				this.processed = null;
				this.renderUploadZone();
			});

		actions
			.createEl("button", {
				text: "Apply",
				cls: `${CSS_PREFIX}-save-btn mod-cta`,
			})
			.addEventListener("click", () => {
				const saveToLibrary = checkbox.checked;
				const name = nameInput.value.trim() || defaultName;
				void this.applyIcon(name, saveToLibrary);
			});
	}

	private async applyIcon(name: string, saveToLibrary: boolean) {
		if (!this.processed) return;

		const ext = this.processed.ext;
		const id = `custom-${Date.now()}`;
		const adapter = this.plugin.app.vault.adapter;
		const pluginDir = this.plugin.manifest.dir!;
		const iconsDir = `${pluginDir}/${ICONS_DIR}`;

		if (!(await adapter.exists(iconsDir))) {
			await adapter.mkdir(iconsDir);
		}

		await adapter.writeBinary(`${iconsDir}/${id}.${ext}`, this.processed.data);

		if (saveToLibrary) {
			await this.plugin.iconLibrary.add({
				id,
				name,
				path: `${ICONS_DIR}/${id}.${ext}`,
				createdAt: Date.now(),
				tags: [],
				ext,
			});
		}

		this.modal.selectIcon({ type: "custom", value: id });
	}

	// ─── Batch Flow ─────────────────────────────────

	/** Show review screen: list all files with editable names before importing */
	private renderBatchReview(files: File[]) {
		this.container.empty();

		const entries: BatchEntry[] = files.map((f) => ({
			file: f,
			name: f.name.replace(/\.[^.]+$/, ""),
			ext: isSvgFile(f) ? ("svg" as const) : ("png" as const),
		}));
		this.renderBatchEntries(entries);
	}

	private renderBatchEntries(entries: BatchEntry[]) {
		this.clearObjectUrls();
		this.container.empty();

		const header = this.container.createDiv({ cls: `${CSS_PREFIX}-batch-header` });
		header.createEl("strong", { text: `${entries.length} icons ready to import` });
		header.createEl("span", {
			text: "Review their library names before importing.",
		});

		// Scrollable file list
		const list = this.container.createDiv({ cls: `${CSS_PREFIX}-batch-list` });
		const nameInputs: HTMLInputElement[] = [];

		entries.forEach((entry, i) => {
			const row = list.createDiv({ cls: `${CSS_PREFIX}-batch-row` });

			// Index number
			row.createDiv({
				text: `${i + 1}`,
				cls: `${CSS_PREFIX}-batch-row-index`,
			});

			// Thumbnail preview
			const thumb = row.createEl("img", {
				cls: `${CSS_PREFIX}-batch-row-thumb`,
			});
			const objectUrl = URL.createObjectURL(entry.file);
			this.objectUrls.add(objectUrl);
			thumb.src = objectUrl;
			thumb.alt = `${entry.name} preview`;

			// Extension badge
			row.createDiv({
				text: entry.ext.toUpperCase(),
				cls: `${CSS_PREFIX}-batch-row-ext`,
			});

			// Editable name input
			const nameInput = row.createEl("input", {
				type: "text",
				value: entry.name,
				cls: `${CSS_PREFIX}-batch-row-name`,
			});
			nameInput.value = entry.name;
			nameInput.addEventListener("input", () => {
				entry.name = nameInput.value;
			});
			nameInputs.push(nameInput);

			// Remove button
			const removeButton = row.createEl("button", {
				cls: `${CSS_PREFIX}-batch-row-remove`,
				attr: {
					type: "button",
					"aria-label": `Remove ${entry.name} from import`,
					title: `Remove ${entry.name}`,
				},
			});
			setIcon(removeButton, "x");
			removeButton.addEventListener("click", () => {
				const remaining = entries.filter((candidate) => candidate !== entry);
				if (remaining.length === 0) {
					this.container.empty();
					this.renderUploadZone();
					return;
				}
				this.renderBatchEntries(remaining);
			});
		});

		// Bottom bar
		const bottomBar = this.container.createDiv({ cls: `${CSS_PREFIX}-upload-bottom` });

		bottomBar
			.createEl("button", {
				text: "Back",
				cls: `${CSS_PREFIX}-cancel-btn`,
			})
			.addEventListener("click", () => {
				this.clearObjectUrls();
				this.container.empty();
				this.renderUploadZone();
			});

		bottomBar
			.createEl("button", {
				text: `Import ${entries.length} icons`,
				cls: `${CSS_PREFIX}-save-btn mod-cta`,
			})
			.addEventListener("click", () => {
				// Read final names from inputs before importing
				nameInputs.forEach((input, i) => {
					if (entries[i]) {
						entries[i].name = input.value.trim() || entries[i].file.name.replace(/\.[^.]+$/, "");
					}
				});
				void this.executeBatchImport(entries);
			});
	}

	/** Process and save all batch entries */
	private async executeBatchImport(entries: BatchEntry[]) {
		this.clearObjectUrls();
		this.container.empty();

		const statusEl = this.container.createEl("p", {
			text: `Importing 0/${entries.length}...`,
			cls: `${CSS_PREFIX}-placeholder`,
			attr: { role: "status", "aria-live": "polite" },
		});

		const adapter = this.plugin.app.vault.adapter;
		const pluginDir = this.plugin.manifest.dir!;
		const iconsDir = `${pluginDir}/${ICONS_DIR}`;

		if (!(await adapter.exists(iconsDir))) {
			await adapter.mkdir(iconsDir);
		}

		const now = Date.now();
		const icons: CustomIcon[] = [];
		let imported = 0;

		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];

			try {
				let data: ArrayBuffer;
				if (entry.ext === "svg") {
					const result = await processSvg(entry.file);
					data = result.data;
				} else {
					const result = await processImage(entry.file);
					data = result.data;
				}

				const id = `custom-${now}-${i}`;

				await adapter.writeBinary(`${iconsDir}/${id}.${entry.ext}`, data);

				icons.push({
					id,
					name: entry.name,
					path: `${ICONS_DIR}/${id}.${entry.ext}`,
					createdAt: now,
					tags: [],
					ext: entry.ext,
				});

				imported++;
			} catch {
				// Skip failed files
			}

			statusEl.textContent = `Importing ${i + 1}/${entries.length}...`;
		}

		if (icons.length > 0) {
			await this.plugin.iconLibrary.addBatch(icons);
		}

		this.container.empty();
		this.renderBatchResult(imported, entries.length);
	}

	private renderBatchResult(imported: number, total: number) {
		const result = this.container.createDiv({ cls: `${CSS_PREFIX}-batch-result` });
		const resultIcon = result.createDiv({ cls: `${CSS_PREFIX}-batch-result-icon` });
		setIcon(resultIcon, imported === total ? "circle-check" : "triangle-alert");

		result.createDiv({
			text: `Imported ${imported} of ${total} icons to library.`,
			cls: `${CSS_PREFIX}-upload-zone-text`,
		});

		result
			.createEl("button", {
				text: "Done",
				cls: `${CSS_PREFIX}-save-btn mod-cta`,
			})
			.addEventListener("click", () => {
				this.modal.close();
			});
	}

	// ─── Helpers ─────────────────────────────────────

	private fileListFromSingle(file: File): FileList {
		const dt = new DataTransfer();
		dt.items.add(file);
		return dt.files;
	}

	private renderError(message: string, showBackButton = false) {
		this.container.querySelector(`.${CSS_PREFIX}-upload-error`)?.remove();
		const error = this.container.createDiv({
			cls: `${CSS_PREFIX}-upload-error`,
			attr: { role: "alert" },
		});
		const icon = error.createSpan();
		setIcon(icon, "triangle-alert");
		error.createSpan({ text: message });
		if (showBackButton) {
			error
				.createEl("button", { text: "Choose another file", cls: `${CSS_PREFIX}-cancel-btn` })
				.addEventListener("click", () => {
					this.container.empty();
					this.renderUploadZone();
				});
		}
	}

	private clearObjectUrls() {
		for (const url of this.objectUrls) URL.revokeObjectURL(url);
		this.objectUrls.clear();
	}
}
