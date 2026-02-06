import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import { IconicaSettingTab } from "./settings";
import type { IconMapping, IconicaData, IconicaSettings } from "./types";

export default class IconicaPlugin extends Plugin {
	settings!: IconicaSettings;
	iconMap!: IconMapping;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new IconicaSettingTab(this.app, this));
	}

	onunload() {}

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
	async setIcon(
		path: string,
		icon: { type: "emoji" | "icon" | "custom"; value: string; color?: string },
	) {
		this.iconMap[path] = icon;
		await this.saveSettings();
	}

	/** Remove icon mapping for a file/folder path */
	async removeIcon(path: string) {
		delete this.iconMap[path];
		await this.saveSettings();
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
