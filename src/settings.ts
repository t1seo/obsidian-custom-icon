import { type App, PluginSettingTab, Setting } from "obsidian";
import { DEFAULT_SETTINGS } from "./constants";
import type CustomIconPlugin from "./main";

export class CustomIconSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: CustomIconPlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Inline icons").setHeading();

		new Setting(containerEl)
			.setName("Enable inline icons")
			.setDesc(
				`Allow :${this.plugin.settings.inlineIconPrefix}-name: shortcodes in note content.`,
			)
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableInlineIcons).onChange(async (value) => {
					this.plugin.settings.enableInlineIcons = value;
					await this.plugin.saveSettings();
					this.plugin.app.workspace.updateOptions();
				}),
			);

		let sizeInput: HTMLInputElement;
		new Setting(containerEl)
			.setName("Inline icon size")
			.setDesc("Size of inline icons in notes (px), from 12 to 64.")
			.addText((text) => {
				sizeInput = text.inputEl;
				text.inputEl.type = "number";
				text.inputEl.min = "12";
				text.inputEl.max = "64";
				text.inputEl.addClass("custom-icon-size-input");
				text.setValue(String(this.plugin.settings.inlineIconSize));
			})
			.addButton((btn) =>
				btn.setButtonText("Apply").onClick(async () => {
					const num = Math.min(64, Math.max(12, Number(sizeInput.value) || 20));
					sizeInput.value = String(num);
					this.plugin.settings.inlineIconSize = num;
					this.plugin.updateInlineSizeCSSVar();
					await this.plugin.saveSettings();
					this.plugin.app.workspace.updateOptions();
				}),
			);

		let prefixInput: HTMLInputElement;
		new Setting(containerEl)
			.setName("Inline icon prefix")
			.setDesc(
				"Prefix for inline icon syntax. E.g. \"ci\" → :ci-iconname:, \"my\" → :my-iconname:",
			)
			.addText((text) => {
				prefixInput = text.inputEl;
				text.setPlaceholder(DEFAULT_SETTINGS.inlineIconPrefix);
				text.setValue(this.plugin.settings.inlineIconPrefix);
			})
			.addButton((btn) =>
				btn.setButtonText("Apply").onClick(async () => {
					const trimmed = prefixInput.value.trim().replace(/[^a-zA-Z0-9-]/g, "");
					const value = trimmed || DEFAULT_SETTINGS.inlineIconPrefix;
					prefixInput.value = value;
					this.plugin.settings.inlineIconPrefix = value;
					await this.plugin.saveSettings();
					this.plugin.app.workspace.updateOptions();
				}),
			);
	}
}
