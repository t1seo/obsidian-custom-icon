import { type App, Modal } from "obsidian";
import { CSS_PREFIX } from "../constants";
import type IconicaPlugin from "../main";
import type { IconData, IconSelectCallback, PickerTab } from "../types";
import { CustomTab } from "./CustomTab";
import { UploadTab } from "./UploadTab";

/** Tab definition for the picker */
interface TabDef {
	key: PickerTab;
	label: string;
}

const TABS: TabDef[] = [
	{ key: "custom", label: "Icons" },
	{ key: "upload", label: "Upload" },
];

/**
 * Main icon picker modal with 2 tabs: Custom | Upload
 */
export class IconPickerModal extends Modal {
	private activeTab: PickerTab = "custom";
	private tabContentEl!: HTMLElement;
	private searchEl!: HTMLInputElement;
	private searchBarEl!: HTMLElement;
	private onSelect: IconSelectCallback;
	private currentPath: string;

	/** Tab renderers registered by each tab module */
	private tabRenderers = new Map<PickerTab, TabRenderer>();

	constructor(
		app: App,
		private plugin: IconicaPlugin,
		path: string,
		onSelect: IconSelectCallback,
	) {
		super(app);
		this.currentPath = path;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass(`${CSS_PREFIX}-picker`);
		// Add class to parent .modal element to strip its padding
		this.modalEl.addClass(`${CSS_PREFIX}-modal`);

		// Register tabs
		this.registerTab("custom", new CustomTab(this.plugin, this));
		this.registerTab("upload", new UploadTab(this.plugin, this));

		this.buildHeader(contentEl);
		this.buildSearchBar(contentEl);
		this.buildTabContent(contentEl);

		this.switchTab(this.activeTab);

		// Keyboard navigation
		this.scope.register([], "ArrowDown", (e) => this.navigateGrid(e, "down"));
		this.scope.register([], "ArrowUp", (e) => this.navigateGrid(e, "up"));
		this.scope.register([], "ArrowLeft", (e) => this.navigateGrid(e, "left"));
		this.scope.register([], "ArrowRight", (e) => this.navigateGrid(e, "right"));
		this.scope.register([], "Enter", (e) => this.activateFocused(e));
	}

	onClose() {
		for (const renderer of this.tabRenderers.values()) {
			renderer.destroy?.();
		}
		this.tabRenderers.clear();
		this.contentEl.empty();
	}

	registerTab(tab: PickerTab, renderer: TabRenderer) {
		this.tabRenderers.set(tab, renderer);
	}

	getSearchQuery(): string {
		return this.searchEl?.value ?? "";
	}

	getTargetPath(): string {
		return this.currentPath;
	}

	selectIcon(icon: IconData) {
		this.onSelect(icon);
		this.close();
	}

	removeIcon() {
		this.onSelect(null);
		this.close();
	}

	// ─── Private builders ───────────────────────────────

	private buildHeader(parent: HTMLElement) {
		const header = parent.createDiv({ cls: `${CSS_PREFIX}-picker-header` });

		const tabs = header.createDiv({ cls: `${CSS_PREFIX}-picker-tabs` });
		for (const { key, label } of TABS) {
			const btn = tabs.createEl("button", {
				text: label,
				cls: `${CSS_PREFIX}-tab-btn`,
			});
			if (key === this.activeTab) btn.addClass("is-active");
			btn.addEventListener("click", () => this.switchTab(key));
		}
	}

	private buildSearchBar(parent: HTMLElement) {
		const bar = parent.createDiv({ cls: `${CSS_PREFIX}-picker-search` });
		this.searchBarEl = bar;

		this.searchEl = bar.createEl("input", {
			type: "text",
			placeholder: "Filter...",
			cls: `${CSS_PREFIX}-search-input`,
		});
		this.searchEl.addEventListener("input", () => {
			const renderer = this.tabRenderers.get(this.activeTab);
			renderer?.onSearch?.(this.searchEl.value);
		});

		const randomBtn = bar.createEl("button", {
			cls: `${CSS_PREFIX}-random-btn`,
			attr: { "aria-label": "Random", title: "Random" },
		});
		randomBtn.textContent = "\uD83C\uDFB2";
		randomBtn.addEventListener("click", () => {
			const renderer = this.tabRenderers.get(this.activeTab);
			renderer?.onRandom?.();
		});
	}

	private buildTabContent(parent: HTMLElement) {
		this.tabContentEl = parent.createDiv({ cls: `${CSS_PREFIX}-picker-content` });
	}

	private navigateGrid(e: KeyboardEvent, direction: "up" | "down" | "left" | "right") {
		if (document.activeElement === this.searchEl) return;

		const gridSelector = `.${CSS_PREFIX}-custom-item-btn`;
		const items = Array.from(this.tabContentEl.querySelectorAll<HTMLElement>(gridSelector));
		if (items.length === 0) return;

		e.preventDefault();

		const focused = document.activeElement as HTMLElement;
		const currentIndex = items.indexOf(focused);

		if (currentIndex === -1) {
			items[0].focus();
			return;
		}

		const grid = items[0].parentElement;
		if (!grid) return;
		const cols = Math.floor(grid.clientWidth / items[0].offsetWidth) || 1;

		let nextIndex = currentIndex;
		switch (direction) {
			case "left":
				nextIndex = Math.max(0, currentIndex - 1);
				break;
			case "right":
				nextIndex = Math.min(items.length - 1, currentIndex + 1);
				break;
			case "up":
				nextIndex = Math.max(0, currentIndex - cols);
				break;
			case "down":
				nextIndex = Math.min(items.length - 1, currentIndex + cols);
				break;
		}

		if (nextIndex !== currentIndex) {
			items[nextIndex].focus();
			items[nextIndex].scrollIntoView({ block: "nearest" });
		}
	}

	private activateFocused(e: KeyboardEvent) {
		if (document.activeElement === this.searchEl) return;

		const gridSelector = `.${CSS_PREFIX}-custom-item-btn`;
		const items = Array.from(this.tabContentEl.querySelectorAll<HTMLElement>(gridSelector));
		const focused = document.activeElement as HTMLElement;

		if (items.includes(focused)) {
			e.preventDefault();
			focused.click();
		}
	}

	private switchTab(tab: PickerTab) {
		this.activeTab = tab;

		// Update tab button active states
		const buttons = this.contentEl.querySelectorAll(`.${CSS_PREFIX}-tab-btn`);
		buttons.forEach((btn, i) => {
			btn.toggleClass("is-active", TABS[i].key === tab);
		});

		// Show/hide search bar (hide for Upload tab)
		this.searchBarEl.style.display = tab === "upload" ? "none" : "";

		// Destroy previous tab renderers (cleanup timers)
		for (const [key, r] of this.tabRenderers) {
			if (key !== tab) r.destroy?.();
		}

		// Clear and re-render tab content
		this.tabContentEl.empty();
		this.searchEl.value = "";

		const renderer = this.tabRenderers.get(tab);
		if (renderer) {
			renderer.render(this.tabContentEl);
		}
	}
}

/** Interface that each tab module implements */
export interface TabRenderer {
	render(container: HTMLElement): void;
	onSearch?(query: string): void;
	onRandom?(): void;
	destroy?(): void;
}
