import { type App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_ICON_SETS } from "./constants";
import type IconicaPlugin from "./main";

export class IconicaSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: IconicaPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Iconica" });

		// --- Display section ---
		containerEl.createEl("h3", { text: "Display" });

		new Setting(containerEl)
			.setName("Show icons in file explorer")
			.setDesc("Replace file/folder icons in the navigation pane.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showInExplorer).onChange(async (value) => {
					this.plugin.settings.showInExplorer = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Show icons in tabs")
			.setDesc("Replace file icons in tab headers.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showInTab).onChange(async (value) => {
					this.plugin.settings.showInTab = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Show icon above note title")
			.setDesc("Display a large icon above the note title, like Notion.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showInTitle).onChange(async (value) => {
					this.plugin.settings.showInTitle = value;
					await this.plugin.saveSettings();
				}),
			);

		new Setting(containerEl)
			.setName("Enable inline icons")
			.setDesc("Allow :icon-name: shortcodes in note content.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableInlineIcons).onChange(async (value) => {
					this.plugin.settings.enableInlineIcons = value;
					await this.plugin.saveSettings();
				}),
			);

		// --- Icon sets section ---
		containerEl.createEl("h3", { text: "Icon sets" });

		new Setting(containerEl)
			.setName("Preferred icon sets")
			.setDesc(
				"Comma-separated Iconify set prefixes shown by default (e.g. lucide, mdi, ph, tabler).",
			)
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_ICON_SETS.join(", "))
					.setValue(this.plugin.settings.preferredIconSets.join(", "))
					.onChange(async (value) => {
						this.plugin.settings.preferredIconSets = value
							.split(",")
							.map((s) => s.trim())
							.filter(Boolean);
						await this.plugin.saveSettings();
					}),
			);

		// --- Storage section ---
		containerEl.createEl("h3", { text: "Storage" });

		new Setting(containerEl)
			.setName("Icon cache size limit")
			.setDesc("Maximum size for cached Iconify icons in MB.")
			.addSlider((slider) =>
				slider
					.setLimits(10, 200, 10)
					.setValue(this.plugin.settings.maxCacheSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.maxCacheSize = value;
						await this.plugin.saveSettings();
					}),
			);
	}
}
