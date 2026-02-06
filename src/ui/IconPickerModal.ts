import { type App, Modal } from "obsidian";
import { CSS_PREFIX } from "../constants";
import type IconicaPlugin from "../main";
import type { IconData, IconSelectCallback, PickerTab } from "../types";
import { EmojiTab } from "./EmojiTab";

/**
 * Main icon picker modal with 3 tabs: Emoji | Icons | Upload
 * Mirrors Notion's icon picker layout.
 */
export class IconPickerModal extends Modal {
	private activeTab: PickerTab = "emoji";
	private tabContentEl!: HTMLElement;
	private searchEl!: HTMLInputElement;
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

		// Register built-in tabs
		this.registerTab("emoji", new EmojiTab(this.plugin, this));

		this.buildHeader(contentEl);
		this.buildSearchBar(contentEl);
		this.buildTabContent(contentEl);
		this.buildFooter(contentEl);

		this.switchTab(this.activeTab);
	}

	onClose() {
		this.contentEl.empty();
	}

	/** Register a tab renderer (called by tab modules) */
	registerTab(tab: PickerTab, renderer: TabRenderer) {
		this.tabRenderers.set(tab, renderer);
	}

	/** Get the current search query */
	getSearchQuery(): string {
		return this.searchEl?.value ?? "";
	}

	/** Get the file/folder path this picker was opened for */
	getTargetPath(): string {
		return this.currentPath;
	}

	/** Notify the modal that an icon was picked */
	selectIcon(icon: IconData) {
		this.onSelect(icon);
		this.close();
	}

	/** Notify the modal to remove the current icon */
	removeIcon() {
		this.onSelect(null);
		this.close();
	}

	// ─── Private builders ───────────────────────────────

	private buildHeader(parent: HTMLElement) {
		const header = parent.createDiv({ cls: `${CSS_PREFIX}-picker-header` });

		const tabs = header.createDiv({ cls: `${CSS_PREFIX}-picker-tabs` });
		const tabNames: { key: PickerTab; label: string }[] = [
			{ key: "emoji", label: "Emoji" },
			{ key: "icons", label: "Icons" },
			{ key: "upload", label: "Upload" },
		];
		for (const { key, label } of tabNames) {
			const btn = tabs.createEl("button", {
				text: label,
				cls: `${CSS_PREFIX}-tab-btn`,
			});
			if (key === this.activeTab) btn.addClass("is-active");
			btn.addEventListener("click", () => this.switchTab(key));
		}

		const removeBtn = header.createEl("button", {
			text: "Remove",
			cls: `${CSS_PREFIX}-remove-btn`,
		});
		removeBtn.addEventListener("click", () => this.removeIcon());
	}

	private buildSearchBar(parent: HTMLElement) {
		const bar = parent.createDiv({ cls: `${CSS_PREFIX}-picker-search` });

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
			text: "🔀",
		});
		randomBtn.addEventListener("click", () => {
			const renderer = this.tabRenderers.get(this.activeTab);
			renderer?.onRandom?.();
		});
	}

	private buildTabContent(parent: HTMLElement) {
		this.tabContentEl = parent.createDiv({ cls: `${CSS_PREFIX}-picker-content` });
	}

	private buildFooter(parent: HTMLElement) {
		const footer = parent.createDiv({ cls: `${CSS_PREFIX}-picker-footer` });

		footer
			.createEl("button", {
				text: "Cancel",
				cls: `${CSS_PREFIX}-cancel-btn`,
			})
			.addEventListener("click", () => this.close());
	}

	private switchTab(tab: PickerTab) {
		this.activeTab = tab;

		// Update tab button active states
		const buttons = this.contentEl.querySelectorAll(`.${CSS_PREFIX}-tab-btn`);
		const tabKeys: PickerTab[] = ["emoji", "icons", "upload"];
		buttons.forEach((btn, i) => {
			btn.toggleClass("is-active", tabKeys[i] === tab);
		});

		// Clear and re-render tab content
		this.tabContentEl.empty();
		this.searchEl.value = "";

		const renderer = this.tabRenderers.get(tab);
		if (renderer) {
			renderer.render(this.tabContentEl);
		} else {
			this.tabContentEl.createEl("p", {
				text: `${tab} tab — coming soon`,
				cls: `${CSS_PREFIX}-placeholder`,
			});
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
