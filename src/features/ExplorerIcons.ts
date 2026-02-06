import { CSS_PREFIX, EXPLORER_ICON_SIZE } from "../constants";
import type IconicaPlugin from "../main";
import { createSvgElement, getIcon } from "../services/IconifyService";
import type { IconData } from "../types";
import { onThemeChange } from "../utils/theme";

/**
 * Injects custom icons into the file explorer.
 * Watches for DOM changes and theme switches to keep icons in sync.
 */
export class ExplorerIcons {
	private observer: MutationObserver | null = null;
	private themeObserver: MutationObserver | null = null;
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	constructor(private plugin: IconicaPlugin) {}

	/** Start observing and apply all icons */
	enable() {
		this.applyAllIcons();
		this.startObserver();

		// Re-apply custom icons when theme changes (light/dark image swap)
		this.themeObserver = onThemeChange(() => {
			this.refresh();
		});

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
		this.themeObserver?.disconnect();
		this.themeObserver = null;
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

		this.removeIconFromEl(el);
		const iconEl = this.createIconElement(icon);
		if (iconEl) {
			el.insertBefore(iconEl, el.firstChild);
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
		icons.forEach((el) => el.remove());
	}

	private startObserver() {
		const explorerEl = this.getExplorerContainer();
		if (!explorerEl) return;

		this.observer = new MutationObserver((mutations) => {
			let needsUpdate = false;
			for (const mutation of mutations) {
				if (mutation.addedNodes.length > 0) {
					needsUpdate = true;
					break;
				}
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

	private removeIconFromEl(el: HTMLElement) {
		const existing = el.querySelector(`.${CSS_PREFIX}-explorer-icon`);
		existing?.remove();
	}

	private createIconElement(icon: IconData): HTMLElement | null {
		const wrapper = document.createElement("span");
		wrapper.className = `${CSS_PREFIX}-explorer-icon`;

		switch (icon.type) {
			case "emoji": {
				wrapper.classList.add("is-emoji");
				wrapper.textContent = icon.value;
				wrapper.dataset.iconicaActive = "true";
				break;
			}
			case "icon": {
				wrapper.classList.add("is-svg");
				wrapper.appendChild(this.createPlaceholderSvg(icon));
				wrapper.dataset.iconicaActive = "true";
				// Async: load actual SVG and replace placeholder
				this.loadIconifySvg(wrapper, icon);
				break;
			}
			case "custom": {
				wrapper.classList.add("is-img");
				const img = document.createElement("img");
				img.width = EXPLORER_ICON_SIZE;
				img.height = EXPLORER_ICON_SIZE;
				const isDark = document.body.classList.contains("theme-dark");
				img.src = this.getCustomIconPath(icon.value, isDark);
				img.alt = "";
				wrapper.appendChild(img);
				wrapper.dataset.iconicaActive = "true";
				break;
			}
			default:
				return null;
		}

		return wrapper;
	}

	/** Load actual Iconify SVG and replace the placeholder */
	private async loadIconifySvg(wrapper: HTMLElement, icon: IconData) {
		const iconData = await getIcon(icon.value);
		if (!iconData) return;

		const svg = createSvgElement(iconData, EXPLORER_ICON_SIZE, icon.color);
		wrapper.empty();
		wrapper.appendChild(svg);
	}

	/** Create a placeholder SVG while Iconify data loads */
	private createPlaceholderSvg(icon: IconData): SVGElement {
		const size = EXPLORER_ICON_SIZE;
		const color = icon.color ?? "currentColor";
		const ns = "http://www.w3.org/2000/svg";

		const svg = document.createElementNS(ns, "svg");
		svg.setAttribute("width", String(size));
		svg.setAttribute("height", String(size));
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", color);
		svg.setAttribute("stroke-width", "2");

		const circle = document.createElementNS(ns, "circle");
		circle.setAttribute("cx", "12");
		circle.setAttribute("cy", "12");
		circle.setAttribute("r", "3");
		svg.appendChild(circle);

		return svg;
	}

	private getCustomIconPath(iconId: string, isDark: boolean): string {
		const variant = isDark ? "dark" : "light";
		const adapter = this.plugin.app.vault.adapter;
		const basePath = `${this.plugin.manifest.dir}/icons/${iconId}-${variant}.png`;
		return adapter.getResourcePath(basePath);
	}
}
