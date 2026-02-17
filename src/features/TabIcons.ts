import type { View, WorkspaceLeaf } from "obsidian";
import { CSS_PREFIX, TAB_ICON_SIZE } from "../constants";
import type CustomIconPlugin from "../main";
import type { IconData } from "../types";

/** Internal Obsidian API — not in public type declarations */
interface MarkdownFileView extends View {
	file?: { path: string };
}

/** Internal Obsidian API — not in public type declarations */
interface LeafWithTabHeader extends WorkspaceLeaf {
	tabHeaderEl?: HTMLElement;
}

/**
 * Replaces tab header icons with user-set icons.
 */
export class TabIcons {
	constructor(private plugin: CustomIconPlugin) {}

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
		this.applyAllTabIcons();
	}

	// ─── Private ────────────────────────────────────

	private applyAllTabIcons() {
		const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const file = (leaf.view as MarkdownFileView).file;
			if (!file) continue;

			const tabHeaderEl = (leaf as LeafWithTabHeader).tabHeaderEl;
			if (!tabHeaderEl) continue;

			const iconEl = tabHeaderEl.querySelector<HTMLElement>(
				".workspace-tab-header-inner-icon",
			);
			if (!iconEl) continue;

			// Clean this specific tab first (works across all windows)
			this.cleanTabIcon(iconEl);

			const icon = this.plugin.iconMap[file.path];
			if (!icon) continue;

			this.applyTabIcon(iconEl, icon);
		}
	}

	private cleanTabIcon(iconEl: HTMLElement) {
		iconEl.querySelectorAll(`.${CSS_PREFIX}-tab-icon`).forEach((el) => el.remove());
		iconEl.querySelectorAll("svg.custom-icon-hidden").forEach((svg) => {
			svg.classList.remove("custom-icon-hidden");
		});
	}

	private applyTabIcon(iconEl: HTMLElement, icon: IconData) {
		const wrapper = iconEl.ownerDocument.createElement("span");
		wrapper.className = `${CSS_PREFIX}-tab-icon`;

		const img = iconEl.ownerDocument.createElement("img");
		img.width = TAB_ICON_SIZE;
		img.height = TAB_ICON_SIZE;
		img.src = this.plugin.iconLibrary.getIconUrl(icon.value);
		img.alt = "";
		wrapper.appendChild(img);

		// Hide all default SVG icons and prepend ours
		iconEl.querySelectorAll("svg").forEach((svg) => {
			svg.classList.add("custom-icon-hidden");
		});

		iconEl.prepend(wrapper);
	}

	private removeAllTabIcons() {
		const leaves = this.plugin.app.workspace.getLeavesOfType("markdown");
		for (const leaf of leaves) {
			const tabHeaderEl = (leaf as LeafWithTabHeader).tabHeaderEl;
			if (!tabHeaderEl) continue;

			const iconEl = tabHeaderEl.querySelector<HTMLElement>(
				".workspace-tab-header-inner-icon",
			);
			if (iconEl) this.cleanTabIcon(iconEl);
		}
	}
}
