import { CSS_PREFIX, EXPLORER_ICON_SIZE } from "../constants";
import type IconicaPlugin from "../main";
import type { IconData } from "../types";

/**
 * Injects custom icons into the file explorer.
 * Watches for DOM changes and theme switches to keep icons in sync.
 */
export class ExplorerIcons {
	private observer: MutationObserver | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(private plugin: IconicaPlugin) {}

	/** Start observing and apply all icons */
	enable() {
		this.applyAllIcons();
		this.startObserver();

		// Re-apply when layout changes (e.g. file explorer opens)
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.applyAllIcons();
			}),
		);

		// Handle file renames
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", (file, oldPath) => {
				if (this.plugin.iconMap[oldPath]) {
					this.plugin.iconMap[file.path] = this.plugin.iconMap[oldPath];
					delete this.plugin.iconMap[oldPath];
					this.plugin.saveSettings();
					this.applyAllIcons();
				}
			}),
		);

		// Handle file deletes
		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => {
				if (this.plugin.iconMap[file.path]) {
					delete this.plugin.iconMap[file.path];
					this.plugin.saveSettings();
				}
			}),
		);
	}

	/** Stop observing and remove all injected icons */
	disable() {
		this.stopObserver();
		if (this.debounceTimer) clearTimeout(this.debounceTimer);
		this.removeAllIcons();
	}

	/** Re-apply all icons (call after icon changes) */
	refresh() {
		this.removeAllIcons();
		this.applyAllIcons();
	}

	/** Apply icon to a single file/folder path */
	applyIcon(path: string, icon: IconData) {
		const el = this.findExplorerItem(path);
		if (!el) return;

		const isFolder = el.classList.contains("nav-folder-title");

		// Remove existing custom icon if present (allows icon changes)
		const existing = el.querySelector(`.${CSS_PREFIX}-explorer-icon`);
		if (existing) existing.remove();

		const iconEl = this.createIconElement(icon);
		if (!iconEl) return;

		if (isFolder) {
			// For folders: .tree-item-icon IS the collapse chevron — never hide it.
			// Insert our icon after the collapse indicator.
			const collapseEl =
				el.querySelector(":scope > .nav-folder-collapse-indicator") ??
				el.querySelector(":scope > .tree-item-icon");
			if (collapseEl) {
				collapseEl.after(iconEl);
			} else {
				el.insertBefore(iconEl, el.firstChild);
			}
		} else {
			// For files: insert before everything and hide default icon
			el.insertBefore(iconEl, el.firstChild);
			const defaultIcon = el.querySelector(":scope > .tree-item-icon");
			if (defaultIcon instanceof HTMLElement) {
				defaultIcon.style.display = "none";
			}
		}
	}

	// ─── Private ────────────────────────────────────

	private applyAllIcons() {
		for (const [path, icon] of Object.entries(this.plugin.iconMap)) {
			this.applyIcon(path, icon);
		}
	}

	private removeAllIcons() {
		const icons = document.querySelectorAll(`.${CSS_PREFIX}-explorer-icon`);
		icons.forEach((el) => {
			const parent = el.parentElement;
			if (parent) {
				// Restore hidden default icon (for both files and folders)
				const treeIcon = parent.querySelector(":scope > .tree-item-icon");
				if (treeIcon instanceof HTMLElement) {
					treeIcon.style.display = "";
				}
			}
			el.remove();
		});
	}

	private startObserver() {
		const explorerEl = this.getExplorerContainer();
		if (!explorerEl) return;

		this.observer = new MutationObserver((mutations) => {
			let needsUpdate = false;
			for (const mutation of mutations) {
				for (let i = 0; i < mutation.addedNodes.length; i++) {
					const node = mutation.addedNodes[i];
					// Skip our own icon insertions to avoid infinite loop
					if (node instanceof Element && node.closest(`.${CSS_PREFIX}-explorer-icon`)) {
						continue;
					}
					if (node.parentElement?.closest(`.${CSS_PREFIX}-explorer-icon`)) {
						continue;
					}
					needsUpdate = true;
					break;
				}
				if (needsUpdate) break;
			}
			if (needsUpdate) {
				// Debounce rapid DOM changes (e.g. expanding folders)
				if (this.debounceTimer) clearTimeout(this.debounceTimer);
				this.debounceTimer = setTimeout(() => {
					requestAnimationFrame(() => this.applyAllIcons());
				}, 50);
			}
		});

		this.observer.observe(explorerEl, { childList: true, subtree: true });
	}

	private stopObserver() {
		this.observer?.disconnect();
		this.observer = null;
	}

	private getExplorerContainer(): HTMLElement | null {
		return document.querySelector(".nav-files-container");
	}

	private findExplorerItem(path: string): HTMLElement | null {
		return document.querySelector(
			`.nav-file-title[data-path="${CSS.escape(path)}"], .nav-folder-title[data-path="${CSS.escape(path)}"]`,
		);
	}

	private createIconElement(icon: IconData): HTMLElement | null {
		const wrapper = document.createElement("span");
		wrapper.className = `${CSS_PREFIX}-explorer-icon is-img`;

		const img = document.createElement("img");
		img.width = EXPLORER_ICON_SIZE;
		img.height = EXPLORER_ICON_SIZE;
		img.src = this.getCustomIconPath(icon.value);
		img.alt = "";
		wrapper.appendChild(img);
		wrapper.dataset.iconicaActive = "true";

		return wrapper;
	}

	private getCustomIconPath(iconId: string): string {
		const adapter = this.plugin.app.vault.adapter;
		const basePath = `${this.plugin.manifest.dir}/icons/${iconId}.png`;
		return adapter.getResourcePath(basePath);
	}
}
