import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import { ContextMenu } from "./features/ContextMenu";
import { ExplorerIcons } from "./features/ExplorerIcons";
import { InlineIcons } from "./features/InlineIcons";
import { TabIcons } from "./features/TabIcons";
import { TitleIcons } from "./features/TitleIcons";
import { IconLibraryService } from "./services/IconLibraryService";
import { IconicaSettingTab } from "./settings";
import type { IconData, IconMapping, IconicaData, IconicaSettings } from "./types";

export default class IconicaPlugin extends Plugin {
	settings!: IconicaSettings;
	iconMap!: IconMapping;
	explorerIcons!: ExplorerIcons;
	tabIcons!: TabIcons;
	titleIcons!: TitleIcons;
	iconLibrary!: IconLibraryService;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new IconicaSettingTab(this.app, this));

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
	}

	onunload() {
		this.explorerIcons?.disable();
		this.tabIcons?.disable();
		this.titleIcons?.disable();
	}

	async loadSettings() {
		const data: Partial<IconicaData> = (await this.loadData()) ?? {};
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
		this.iconMap = data.iconMap ?? {};
	}

	async saveSettings() {
		const data: IconicaData = {
			settings: this.settings,
			iconMap: this.iconMap,
		};
		await this.saveData(data);
	}

	/** Update icon mapping for a file/folder path */
	setIcon(path: string, icon: IconData) {
		this.iconMap[path] = icon;
		// Apply immediately, save in background
		this.explorerIcons?.applyIcon(path, icon);
		this.tabIcons?.refresh();
		this.titleIcons?.refresh();
		this.saveSettings();
	}

	/** Remove icon mapping for a file/folder path */
	removeIcon(path: string) {
		delete this.iconMap[path];
		this.explorerIcons?.refresh();
		this.tabIcons?.refresh();
		this.titleIcons?.refresh();
		this.saveSettings();
	}
}
