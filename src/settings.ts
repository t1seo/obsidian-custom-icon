import { type App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import type IconStudioPlugin from "./main";

export class IconStudioSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: IconStudioPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Inline icons").setHeading();

		new Setting(containerEl)
			.setName("Enable inline icons")
			.setDesc(`Allow :${this.plugin.settings.inlineIconPrefix}-name: shortcodes in note content.`)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableInlineIcons).onChange(async (value) => {
					this.plugin.settings.enableInlineIcons = value;
					await this.plugin.saveSettings();
					this.plugin.app.workspace.updateOptions();
				}),
			);

		new Setting(containerEl)
			.setName("Inline icon size")
			.setDesc("Choose a size from 12 to 64 px. Changes are saved automatically.")
			.addSlider((slider) =>
				slider
					.setLimits(12, 64, 1)
					.setValue(this.plugin.settings.inlineIconSize)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.inlineIconSize = value;
						this.plugin.updateInlineSizeCSSVar();
						await this.plugin.saveSettings();
						this.plugin.app.workspace.updateOptions();
					}),
			);

		new Setting(containerEl)
			.setName("Inline icon prefix")
			.setDesc("Syntax: :ci-icon-name:. Use letters, numbers, or hyphens.")
			.addText((text) => {
				text.setPlaceholder(DEFAULT_SETTINGS.inlineIconPrefix);
				text.setValue(this.plugin.settings.inlineIconPrefix);
				text.inputEl.setAttribute("aria-label", "Inline icon prefix");
				text.inputEl.addEventListener("change", () => {
					const trimmed = text
						.getValue()
						.trim()
						.replace(/[^a-zA-Z0-9-]/g, "");
					const value = trimmed || DEFAULT_SETTINGS.inlineIconPrefix;
					text.setValue(value);
					if (value === this.plugin.settings.inlineIconPrefix) return;
					this.plugin.settings.inlineIconPrefix = value;
					void (async () => {
						await this.plugin.saveSettings();
						this.plugin.app.workspace.updateOptions();
					})();
				});
			});
	}
}
