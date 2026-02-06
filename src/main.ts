import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import { ContextMenu } from "./features/ContextMenu";
import { ExplorerIcons } from "./features/ExplorerIcons";
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
		if (this.settings.showInExplorer) {
			this.app.workspace.onLayoutReady(() => {
				this.explorerIcons.enable();
			});
		}

		// Tab icons
		this.tabIcons = new TabIcons(this);
		if (this.settings.showInTab) {
			this.app.workspace.onLayoutReady(() => {
				this.tabIcons.enable();
			});
		}

		// Title icons
		this.titleIcons = new TitleIcons(this);
		if (this.settings.showInTitle) {
			this.app.workspace.onLayoutReady(() => {
				this.titleIcons.enable();
			});
		}

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
	async setIcon(path: string, icon: IconData) {
		this.iconMap[path] = icon;
		await this.saveSettings();
		this.explorerIcons?.applyIcon(path, icon);
		this.tabIcons?.refresh();
		this.titleIcons?.refresh();
	}

	/** Remove icon mapping for a file/folder path */
	async removeIcon(path: string) {
		delete this.iconMap[path];
		await this.saveSettings();
		this.explorerIcons?.refresh();
		this.tabIcons?.refresh();
		this.titleIcons?.refresh();
	}

	/** Add an emoji or icon ID to recent list */
	addToRecent(type: "emoji" | "icon", value: string) {
		const list = type === "emoji" ? this.settings.recentEmojis : this.settings.recentIcons;
		const idx = list.indexOf(value);
		if (idx !== -1) list.splice(idx, 1);
		list.unshift(value);
		if (list.length > 30) list.pop();
	}
}
