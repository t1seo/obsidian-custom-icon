import { CSS_PREFIX, TITLE_ICON_SIZE } from "../constants";
import type IconicaPlugin from "../main";
import { createSvgElement, getIcon } from "../services/IconifyService";
import type { IconData } from "../types";
import { IconPickerModal } from "../ui/IconPickerModal";
import { isDarkMode } from "../utils/theme";

/**
 * Displays a large icon above the note title (like Notion's page icon).
 * Clicking the icon opens the picker to change it.
 */
export class TitleIcons {
	constructor(private plugin: IconicaPlugin) {}

	enable() {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				this.applyTitleIcon();
			}),
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.applyTitleIcon();
			}),
		);

		this.applyTitleIcon();
	}

	disable() {
		this.removeAllTitleIcons();
	}

	refresh() {
		this.removeAllTitleIcons();
		this.applyTitleIcon();
	}

	// ─── Private ────────────────────────────────────

	private applyTitleIcon() {
		const file = this.plugin.app.workspace.getActiveFile();
		if (!file) return;

		const icon = this.plugin.iconMap[file.path];

		// Find the inline title element
		const titleEl = document.querySelector(".inline-title");
		if (!titleEl) return;

		// Remove existing title icon
		const existing = titleEl.parentElement?.querySelector(`.${CSS_PREFIX}-title-icon`);
		existing?.remove();

		if (!icon) return;

		const wrapper = document.createElement("div");
		wrapper.className = `${CSS_PREFIX}-title-icon`;
		wrapper.addEventListener("click", () => {
			new IconPickerModal(this.plugin.app, this.plugin, file.path, (newIcon) => {
				if (newIcon) {
					this.plugin.setIcon(file.path, newIcon);
				} else {
					this.plugin.removeIcon(file.path);
				}
				this.refresh();
			}).open();
		});

		this.renderTitleIcon(wrapper, icon);
		titleEl.parentElement?.insertBefore(wrapper, titleEl);
	}

	private renderTitleIcon(wrapper: HTMLElement, icon: IconData) {
		switch (icon.type) {
			case "emoji": {
				wrapper.textContent = icon.value;
				break;
			}
			case "icon": {
				this.loadTitleSvg(wrapper, icon);
				break;
			}
			case "custom": {
				const img = document.createElement("img");
				img.width = TITLE_ICON_SIZE;
				img.height = TITLE_ICON_SIZE;
				const variant = isDarkMode() ? "dark" : "light";
				const adapter = this.plugin.app.vault.adapter;
				img.src = adapter.getResourcePath(
					`${this.plugin.manifest.dir}/icons/${icon.value}-${variant}.png`,
				);
				img.alt = "";
				wrapper.appendChild(img);
				break;
			}
		}
	}

	private async loadTitleSvg(wrapper: HTMLElement, icon: IconData) {
		const iconData = await getIcon(icon.value);
		if (!iconData) return;

		const svg = createSvgElement(iconData, TITLE_ICON_SIZE, icon.color);
		wrapper.appendChild(svg);
	}

	private removeAllTitleIcons() {
		document.querySelectorAll(`.${CSS_PREFIX}-title-icon`).forEach((el) => el.remove());
	}
}
