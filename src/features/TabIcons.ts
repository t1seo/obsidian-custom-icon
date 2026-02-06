import { CSS_PREFIX, TAB_ICON_SIZE } from "../constants";
import type IconicaPlugin from "../main";
import { createSvgElement, getIcon } from "../services/IconifyService";
import type { IconData } from "../types";

/**
 * Replaces tab header icons with user-set icons.
 */
export class TabIcons {
	constructor(private plugin: IconicaPlugin) {}

	enable() {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.applyAllTabIcons();
			}),
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				this.applyAllTabIcons();
			}),
		);

		this.applyAllTabIcons();
	}

	disable() {
		this.removeAllTabIcons();
	}

	refresh() {
		this.removeAllTabIcons();
		this.applyAllTabIcons();
	}

	// ─── Private ────────────────────────────────────

	private applyAllTabIcons() {
		const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const file = (leaf.view as any)?.file;
			if (!file) continue;

			const icon = this.plugin.iconMap[file.path];
			if (!icon) continue;

			const tabHeaderEl = (leaf as any).tabHeaderInnerIconEl as HTMLElement | undefined;
			if (!tabHeaderEl) continue;

			this.applyTabIcon(tabHeaderEl, icon);
		}
	}

	private applyTabIcon(tabHeaderEl: HTMLElement, icon: IconData) {
		// Check if already applied
		if (tabHeaderEl.querySelector(`.${CSS_PREFIX}-tab-icon`)) return;

		const wrapper = document.createElement("span");
		wrapper.className = `${CSS_PREFIX}-tab-icon`;

		switch (icon.type) {
			case "emoji": {
				wrapper.textContent = icon.value;
				wrapper.style.fontSize = `${TAB_ICON_SIZE}px`;
				break;
			}
			case "icon": {
				this.loadTabSvg(wrapper, icon);
				break;
			}
			case "custom": {
				const img = document.createElement("img");
				img.width = TAB_ICON_SIZE;
				img.height = TAB_ICON_SIZE;
				const adapter = this.plugin.app.vault.adapter;
				img.src = adapter.getResourcePath(
					`${this.plugin.manifest.dir}/icons/${icon.value}.png`,
				);
				img.alt = "";
				wrapper.appendChild(img);
				break;
			}
		}

		// Hide the default icon and prepend ours
		const defaultIcon = tabHeaderEl.querySelector("svg");
		if (defaultIcon) defaultIcon.style.display = "none";

		tabHeaderEl.prepend(wrapper);
	}

	private async loadTabSvg(wrapper: HTMLElement, icon: IconData) {
		const iconData = await getIcon(icon.value);
		if (!iconData) return;

		const svg = createSvgElement(iconData, TAB_ICON_SIZE, icon.color);
		wrapper.appendChild(svg);
	}

	private removeAllTabIcons() {
		document.querySelectorAll(`.${CSS_PREFIX}-tab-icon`).forEach((el) => {
			// Restore the hidden default icon
			const parent = el.parentElement;
			const defaultIcon = parent?.querySelector("svg:not(:scope > .iconica-tab-icon svg)");
			if (defaultIcon) (defaultIcon as HTMLElement).style.display = "";
			el.remove();
		});
	}
}
