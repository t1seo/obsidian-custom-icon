import {
	ButtonComponent,
	Component,
	MarkdownRenderer,
	Modal,
	Notice,
	TextAreaComponent,
} from "obsidian";

interface InlineAnnotationModalOptions {
	iconName: string;
	markdown: string;
	sourcePath: string;
	canRemove: boolean;
	onSave: (markdown: string) => Promise<void>;
	onRemove: () => Promise<void>;
}

export class InlineAnnotationModal extends Modal {
	private previewComponent: Component | null = null;
	private previewTimer: number | null = null;
	private renderVersion = 0;

	constructor(
		private options: InlineAnnotationModalOptions,
		app: InlineAnnotationModal["app"],
	) {
		super(app);
	}

	onOpen() {
		this.setTitle(`Annotation for ${this.options.iconName}`);
		this.modalEl.addClass("custom-icon-annotation-modal");
		this.contentEl.empty();

		this.contentEl.createEl("p", {
			cls: "custom-icon-annotation-help",
			text: "Write Markdown. Formatting, [[wiki links]], and ![[embeds]] are supported.",
		});

		const editor = new TextAreaComponent(this.contentEl);
		editor.inputEl.addClass("custom-icon-annotation-editor");
		editor.inputEl.rows = 9;
		editor.setPlaceholder("Add a comment or annotation…");
		editor.setValue(this.options.markdown);

		this.contentEl.createEl("div", {
			cls: "custom-icon-annotation-preview-title",
			text: "Preview",
		});
		const previewEl = this.contentEl.createDiv({ cls: "custom-icon-annotation-preview" });
		const actionsEl = this.contentEl.createDiv({ cls: "custom-icon-annotation-actions" });
		const primaryActionsEl = actionsEl.createDiv({ cls: "custom-icon-annotation-primary-actions" });

		new ButtonComponent(primaryActionsEl).setButtonText("Cancel").onClick(() => this.close());
		const saveButton = new ButtonComponent(primaryActionsEl)
			.setButtonText("Save annotation")
			.setCta();
		let removeButton: ButtonComponent | null = null;
		let busy = false;

		const setBusy = (value: boolean) => {
			busy = value;
			editor.setDisabled(value);
			saveButton.setDisabled(value || editor.getValue().trim().length === 0);
			removeButton?.setDisabled(value);
		};

		const save = async () => {
			if (busy) return;
			const markdown = editor.getValue().trim();
			if (!markdown) return;
			setBusy(true);
			try {
				await this.options.onSave(markdown);
				this.close();
				new Notice("Inline icon annotation saved.");
			} catch (error) {
				console.error("Failed to save inline icon annotation", error);
				new Notice("Could not save the annotation.");
				setBusy(false);
			}
		};

		if (this.options.canRemove) {
			removeButton = new ButtonComponent(actionsEl)
				.setButtonText("Remove annotation")
				.setWarning()
				.onClick(async () => {
					if (busy) return;
					setBusy(true);
					try {
						await this.options.onRemove();
						this.close();
						new Notice("Inline icon annotation removed.");
					} catch (error) {
						console.error("Failed to remove inline icon annotation", error);
						new Notice("Could not remove the annotation.");
						setBusy(false);
					}
				});
		}

		saveButton.onClick(save);

		editor.onChange((markdown) => {
			saveButton.setDisabled(busy || markdown.trim().length === 0);
			this.schedulePreview(markdown, previewEl);
		});
		this.scope.register(["Mod"], "Enter", () => {
			void save();
			return false;
		});

		saveButton.setDisabled(editor.getValue().trim().length === 0);
		this.schedulePreview(editor.getValue(), previewEl, 0);
		editor.inputEl.focus();
	}

	onClose() {
		if (this.previewTimer !== null) window.clearTimeout(this.previewTimer);
		this.previewTimer = null;
		this.renderVersion += 1;
		this.previewComponent?.unload();
		this.previewComponent = null;
		this.contentEl.empty();
	}

	private schedulePreview(markdown: string, previewEl: HTMLElement, delay = 150) {
		if (this.previewTimer !== null) window.clearTimeout(this.previewTimer);
		this.previewTimer = window.setTimeout(() => {
			this.previewTimer = null;
			void this.renderPreview(markdown, previewEl);
		}, delay);
	}

	private async renderPreview(markdown: string, previewEl: HTMLElement) {
		const version = ++this.renderVersion;
		const nextPreview = document.createElement("div");
		const nextComponent = new Component();
		nextComponent.load();

		if (markdown.trim()) {
			await MarkdownRenderer.render(
				this.app,
				markdown,
				nextPreview,
				this.options.sourcePath,
				nextComponent,
			);
		} else {
			nextPreview.createEl("p", { text: "Nothing to preview yet." });
		}

		if (version !== this.renderVersion) {
			nextComponent.unload();
			return;
		}

		this.previewComponent?.unload();
		this.previewComponent = nextComponent;
		previewEl.replaceChildren(...Array.from(nextPreview.childNodes));
	}
}
