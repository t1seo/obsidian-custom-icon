import { type App, PluginSettingTab, Setting } from "obsidian";
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

		new Setting(containerEl).setName("Inline icons").setHeading();

		new Setting(containerEl)
			.setName("Enable inline icons")
			.setDesc("Allow :custom-icon-name: shortcodes in note content.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.enableInlineIcons).onChange(async (value) => {
					this.plugin.settings.enableInlineIcons = value;
					await this.plugin.saveSettings();
					// Force editors to re-render decorations
					this.plugin.app.workspace.updateOptions();
				}),
			);
	}
}
