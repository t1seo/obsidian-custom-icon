import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import { ContextMenu } from "./features/ContextMenu";
import { ExplorerIcons } from "./features/ExplorerIcons";
import { IconicaSettingTab } from "./settings";
import type { IconData, IconMapping, IconicaData, IconicaSettings } from "./types";

export default class IconicaPlugin extends Plugin {
	settings!: IconicaSettings;
	iconMap!: IconMapping;
	explorerIcons!: ExplorerIcons;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new IconicaSettingTab(this.app, this));

		this.explorerIcons = new ExplorerIcons(this);
		if (this.settings.showInExplorer) {
			this.app.workspace.onLayoutReady(() => {
				this.explorerIcons.enable();
			});
		}

		new ContextMenu(this).enable();
	}

	onunload() {
		this.explorerIcons?.disable();
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
	}

	/** Remove icon mapping for a file/folder path */
	async removeIcon(path: string) {
		delete this.iconMap[path];
		await this.saveSettings();
		this.explorerIcons?.refresh();
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
