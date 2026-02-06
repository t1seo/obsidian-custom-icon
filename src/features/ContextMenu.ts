import type { Editor, TAbstractFile } from "obsidian";
import type IconicaPlugin from "../main";
import type { IconData } from "../types";
import { IconPickerModal } from "../ui/IconPickerModal";

/**
 * Adds "Change icon" / "Remove icon" to file/folder context menus
 * and registers Command Palette commands.
 */
export class ContextMenu {
	constructor(private plugin: IconicaPlugin) {}

	enable() {
		// File explorer context menu
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-menu", (menu, file) => {
				menu.addItem((item) => {
					item
						.setTitle("Change icon")
						.setIcon("palette")
						.onClick(() => this.openPicker(file.path));
				});

				if (this.plugin.iconMap[file.path]) {
					menu.addItem((item) => {
						item
							.setTitle("Remove icon")
							.setIcon("trash-2")
							.onClick(() => this.plugin.removeIcon(file.path));
					});
				}
			}),
		);

		// Command palette: change icon for active file
		this.plugin.addCommand({
			id: "change-icon",
			name: "Change icon for current file",
			checkCallback: (checking) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					this.openPicker(file.path);
				}
				return true;
			},
		});

		// Command palette: remove icon for active file
		this.plugin.addCommand({
			id: "remove-icon",
			name: "Remove icon from current file",
			checkCallback: (checking) => {
				const file = this.plugin.app.workspace.getActiveFile();
				if (!file) return false;
				if (!this.plugin.iconMap[file.path]) return false;
				if (!checking) {
					this.plugin.removeIcon(file.path);
				}
				return true;
			},
		});

		// Command palette: insert inline icon at cursor
		this.plugin.addCommand({
			id: "insert-inline-icon",
			name: "Insert inline icon at cursor",
			editorCallback: (editor: Editor) => {
				const file = this.plugin.app.workspace.getActiveFile();
				const path = file?.path ?? "";
				const modal = new IconPickerModal(this.plugin.app, this.plugin, path, (icon) => {
					if (!icon) return;
					if (icon.type === "emoji") {
						editor.replaceSelection(icon.value);
					} else if (icon.type === "custom") {
						editor.replaceSelection(`:iconica-${icon.value}:`);
					}
				});
				modal.open();
			},
		});
	}

	private openPicker(path: string) {
		const modal = new IconPickerModal(this.plugin.app, this.plugin, path, (icon) => {
			if (icon) {
				this.plugin.setIcon(path, icon);
			} else {
				this.plugin.removeIcon(path);
			}
		});
		modal.open();
	}
}
