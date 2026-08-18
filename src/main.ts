import { type Editor, Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import { ContextMenu } from "./features/ContextMenu";
import { ExplorerIcons } from "./features/ExplorerIcons";
import { InlineIconSuggest } from "./features/InlineIconSuggest";
import { InlineIcons } from "./features/InlineIcons";
import { TabIcons } from "./features/TabIcons";
import { TitleIcons } from "./features/TitleIcons";
import { IconLibraryService } from "./services/IconLibraryService";
import { InlineAnnotationStore } from "./services/InlineAnnotationStore";
import { VaultIconStudioSettingTab } from "./settings";
import type { IconData, IconMapping, VaultIconStudioData, VaultIconStudioSettings } from "./types";
import { IconPickerModal } from "./ui/IconPickerModal";

export default class VaultIconStudioPlugin extends Plugin {
	settings!: VaultIconStudioSettings;
	iconMap!: IconMapping;
	explorerIcons!: ExplorerIcons;
	tabIcons!: TabIcons;
	titleIcons!: TitleIcons;
	iconLibrary!: IconLibraryService;
	inlineAnnotations!: InlineAnnotationStore;

	async onload() {
		await this.loadSettings();
		this.updateInlineSizeCSSVar();
		this.addSettingTab(new VaultIconStudioSettingTab(this.app, this));

		// Initialize icon library
		this.iconLibrary = new IconLibraryService(this.app.vault.adapter, this.manifest.dir!);
		await this.iconLibrary.load();

		// Explorer icons
		this.explorerIcons = new ExplorerIcons(this);
		this.app.workspace.onLayoutReady(() => {
			this.explorerIcons.enable();
		});

		// Tab icons
		this.tabIcons = new TabIcons(this);
		this.app.workspace.onLayoutReady(() => {
			this.tabIcons.enable();
		});

		// Title icons
		this.titleIcons = new TitleIcons(this);
		this.app.workspace.onLayoutReady(() => {
			this.titleIcons.enable();
		});

		// Inline icons (always register; checks setting dynamically)
		new InlineIcons(this).enable();

		// Inline icon autocomplete (IDE-style suggestions)
		this.registerEditorSuggest(new InlineIconSuggest(this));

		// Context menu & commands
		new ContextMenu(this).enable();

		// Insert inline icon command
		this.addCommand({
			id: "insert-inline-icon",
			name: "Insert inline icon",
			editorCallback: (editor: Editor) => {
				new IconPickerModal(this.app, this, "", (icon) => {
					if (!icon) return;
					const lib = this.iconLibrary.getById(icon.value);
					if (!lib) return;
					const prefix = this.settings.inlineIconPrefix;
					const syntax = `:${prefix}-${lib.id}:`;
					editor.replaceSelection(syntax);
				}).open();
			},
		});
	}

	onunload() {
		this.explorerIcons?.disable();
		this.tabIcons?.disable();
		this.titleIcons?.disable();
	}

	async loadSettings() {
		const data = ((await this.loadData()) ?? {}) as Partial<VaultIconStudioData>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
		this.iconMap = data.iconMap ?? {};
		this.inlineAnnotations = new InlineAnnotationStore(data.inlineIconAnnotations ?? {});
	}

	async saveSettings() {
		const data: VaultIconStudioData = {
			settings: this.settings,
			iconMap: this.iconMap,
			inlineIconAnnotations: this.inlineAnnotations.toJSON(),
		};
		await this.saveData(data);
	}

	async saveInlineAnnotation(id: string, markdown: string) {
		const previous = this.inlineAnnotations.get(id);
		const annotation = this.inlineAnnotations.set(id, markdown, Date.now());
		try {
			await this.saveSettings();
			return annotation;
		} catch (error) {
			if (previous) {
				this.inlineAnnotations.set(
					previous.id,
					previous.markdown,
					previous.updatedAt,
					previous.createdAt,
				);
			} else {
				this.inlineAnnotations.remove(id);
			}
			throw error;
		}
	}

	async removeInlineAnnotation(id: string) {
		const previous = this.inlineAnnotations.get(id);
		if (!previous) return;
		this.inlineAnnotations.remove(id);
		try {
			await this.saveSettings();
		} catch (error) {
			this.inlineAnnotations.set(
				previous.id,
				previous.markdown,
				previous.updatedAt,
				previous.createdAt,
			);
			throw error;
		}
	}

	/** Sync inline icon size CSS variable with current setting */
	updateInlineSizeCSSVar() {
		document.body.style.setProperty(
			"--custom-icon-inline-size",
			`${this.settings.inlineIconSize}px`,
		);
	}

	/** Update icon mapping for a file/folder path */
	setIcon(path: string, icon: IconData) {
		this.iconMap[path] = icon;
		// Apply immediately, save in background
		this.explorerIcons?.applyIcon(path, icon);
		this.tabIcons?.refresh();
		this.titleIcons?.refresh();
		void this.saveSettings();
	}

	/** Remove icon mapping for a file/folder path */
	removeIcon(path: string) {
		delete this.iconMap[path];
		this.explorerIcons?.refresh();
		this.tabIcons?.refresh();
		this.titleIcons?.refresh();
		void this.saveSettings();
	}
}
