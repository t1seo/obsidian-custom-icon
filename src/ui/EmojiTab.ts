import { CSS_PREFIX, EMOJI_CATEGORIES, SEARCH_DEBOUNCE_MS } from "../constants";
import type IconicaPlugin from "../main";
import {
	type EmojiItem,
	getAllEmojis,
	getEmojisByCategory,
	getRandomEmoji,
	searchEmojis,
} from "../services/EmojiService";
import type { IconPickerModal, TabRenderer } from "./IconPickerModal";

export class EmojiTab implements TabRenderer {
	private container!: HTMLElement;
	private gridContainer!: HTMLElement;
	private categoryBar!: HTMLElement;
	private activeCategory = "recent";
	private searchTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private plugin: IconicaPlugin,
		private modal: IconPickerModal,
	) {}

	render(container: HTMLElement): void {
		this.container = container;

		this.gridContainer = container.createDiv({ cls: `${CSS_PREFIX}-emoji-grid-area` });
		this.renderCategoryBar(container);
		this.renderDefault();
	}

	onSearch(query: string): void {
		if (this.searchTimeout) clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(() => {
			this.gridContainer.empty();
			if (query.trim()) {
				const results = searchEmojis(query);
				this.renderEmojiGrid(this.gridContainer, results, "Results");
			} else {
				this.renderDefault();
			}
		}, SEARCH_DEBOUNCE_MS);
	}

	onRandom(): void {
		const emoji = getRandomEmoji();
		this.pickEmoji(emoji.emoji);
	}

	destroy(): void {
		if (this.searchTimeout) clearTimeout(this.searchTimeout);
	}

	// ─── Private ────────────────────────────────────

	private renderDefault() {
		this.gridContainer.empty();

		// Recent section
		const recentEmojis = this.plugin.settings.recentEmojis;
		if (recentEmojis.length > 0) {
			const recentItems: EmojiItem[] = recentEmojis.map((emoji) => ({
				emoji,
				label: "",
				tags: [],
				category: "recent",
				order: 0,
			}));
			this.renderEmojiGrid(this.gridContainer, recentItems, "Recent");
		}

		// Category sections
		const byCategory = getEmojisByCategory();
		const categoryOrder = EMOJI_CATEGORIES.filter((c) => c.id !== "recent" && c.id !== "custom");

		for (const cat of categoryOrder) {
			const emojis = byCategory.get(cat.id);
			if (emojis && emojis.length > 0) {
				this.renderEmojiGrid(this.gridContainer, emojis, cat.label);
			}
		}
	}

	private renderEmojiGrid(parent: HTMLElement, emojis: EmojiItem[], label: string) {
		parent.createEl("div", {
			text: label,
			cls: `${CSS_PREFIX}-emoji-category-label`,
		});

		const grid = parent.createDiv({ cls: `${CSS_PREFIX}-emoji-grid` });

		for (const item of emojis) {
			const btn = grid.createEl("button", {
				text: item.emoji,
				cls: `${CSS_PREFIX}-emoji-item`,
				attr: { "aria-label": item.label || item.emoji, title: item.label },
			});
			btn.addEventListener("click", () => this.pickEmoji(item.emoji));
		}
	}

	private renderCategoryBar(parent: HTMLElement) {
		this.categoryBar = parent.createDiv({ cls: `${CSS_PREFIX}-category-bar` });

		const displayCategories = EMOJI_CATEGORIES.filter((c) => c.id !== "custom");

		for (const cat of displayCategories) {
			const btn = this.categoryBar.createEl("button", {
				text: cat.icon,
				cls: `${CSS_PREFIX}-category-btn`,
				attr: { "aria-label": cat.label, title: cat.label },
			});
			btn.addEventListener("click", () => this.scrollToCategory(cat.id));
		}
	}

	private scrollToCategory(categoryId: string) {
		// Find the category label element and scroll to it
		const labels = this.gridContainer.querySelectorAll(`.${CSS_PREFIX}-emoji-category-label`);
		const targetLabel = EMOJI_CATEGORIES.find((c) => c.id === categoryId)?.label;

		labels.forEach((el) => {
			if (
				el.textContent === targetLabel ||
				(categoryId === "recent" && el.textContent === "Recent")
			) {
				el.scrollIntoView({ behavior: "smooth", block: "start" });
			}
		});
	}

	private pickEmoji(emoji: string) {
		this.plugin.addToRecent("emoji", emoji);
		this.modal.selectIcon({ type: "emoji", value: emoji });
	}
}
