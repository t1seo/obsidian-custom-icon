import { type Editor, Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import { ContextMenu } from "./features/ContextMenu";
import { ExplorerIcons } from "./features/ExplorerIcons";
import { InlineIcons } from "./features/InlineIcons";
import { TabIcons } from "./features/TabIcons";
import { TitleIcons } from "./features/TitleIcons";
import { IconLibraryService } from "./services/IconLibraryService";
import { CustomIconSettingTab } from "./settings";
import type { IconData, IconMapping, CustomIconData, CustomIconSettings } from "./types";
import { IconPickerModal } from "./ui/IconPickerModal";

export default class CustomIconPlugin extends Plugin {
	settings!: CustomIconSettings;
	iconMap!: IconMapping;
	explorerIcons!: ExplorerIcons;
	tabIcons!: TabIcons;
	titleIcons!: TitleIcons;
	iconLibrary!: IconLibraryService;

	async onload() {
		await this.loadSettings();
		this.updateInlineSizeCSSVar();
		this.addSettingTab(new CustomIconSettingTab(this.app, this));

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
		const data = ((await this.loadData()) ?? {}) as Partial<CustomIconData>;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
		this.iconMap = data.iconMap ?? {};
	}

	async saveSettings() {
		const data: CustomIconData = {
			settings: this.settings,
			iconMap: this.iconMap,
		};
		await this.saveData(data);
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
