import type { View, WorkspaceLeaf } from "obsidian";
import { CSS_PREFIX, TAB_ICON_SIZE } from "../constants";
import type IconicaPlugin from "../main";
import type { IconData } from "../types";

/** Internal Obsidian API — not in public type declarations */
interface MarkdownFileView extends View {
	file?: { path: string };
}

/** Internal Obsidian API — not in public type declarations */
interface LeafWithTabHeader extends WorkspaceLeaf {
	tabHeaderInnerIconEl?: HTMLElement;
}

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
			const file = (leaf.view as MarkdownFileView).file;
			if (!file) continue;

			const icon = this.plugin.iconMap[file.path];
			if (!icon) continue;

			const tabHeaderEl = (leaf as LeafWithTabHeader).tabHeaderInnerIconEl;
			if (!tabHeaderEl) continue;

			this.applyTabIcon(tabHeaderEl, icon);
		}
	}

	private applyTabIcon(tabHeaderEl: HTMLElement, icon: IconData) {
		// Check if already applied
		if (tabHeaderEl.querySelector(`.${CSS_PREFIX}-tab-icon`)) return;

		const wrapper = document.createElement("span");
		wrapper.className = `${CSS_PREFIX}-tab-icon`;

		const img = document.createElement("img");
		img.width = TAB_ICON_SIZE;
		img.height = TAB_ICON_SIZE;
		img.src = this.plugin.iconLibrary.getIconUrl(icon.value);
		img.alt = "";
		wrapper.appendChild(img);

		// Hide the default icon and prepend ours
		const defaultIcon = tabHeaderEl.querySelector("svg");
		if (defaultIcon) defaultIcon.classList.add("iconica-hidden");

		tabHeaderEl.prepend(wrapper);
	}

	private removeAllTabIcons() {
		document.querySelectorAll(`.${CSS_PREFIX}-tab-icon`).forEach((el) => {
			// Restore the hidden default icon
			const parent = el.parentElement;
			const defaultIcon = parent?.querySelector("svg:not(:scope > .iconica-tab-icon svg)");
			if (defaultIcon) defaultIcon.classList.remove("iconica-hidden");
			el.remove();
		});
	}
}
