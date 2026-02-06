import { CSS_PREFIX, PICKER_ICON_SIZE, SEARCH_DEBOUNCE_MS } from "../constants";
import type IconicaPlugin from "../main";
import {
	type IconifyIcon,
	createSvgElement,
	fetchIconData,
	getRandomIcon,
	searchIcons,
} from "../services/IconifyService";
import type { IconPickerModal, TabRenderer } from "./IconPickerModal";

export class IconTab implements TabRenderer {
	private container!: HTMLElement;
	private gridContainer!: HTMLElement;
	private searchTimeout: ReturnType<typeof setTimeout> | null = null;
	private currentColor: string | undefined;

	constructor(
		private plugin: IconicaPlugin,
		private modal: IconPickerModal,
	) {}

	/** Called by ColorPicker when color changes */
	setColor(color: string | undefined) {
		this.currentColor = color;
		// Re-render current grid with new color
		const svgs = this.gridContainer.querySelectorAll("svg");
		svgs.forEach((svg) => {
			svg.setAttribute("fill", color ?? "currentColor");
		});
	}

	render(container: HTMLElement): void {
		this.container = container;
		this.gridContainer = container.createDiv({ cls: `${CSS_PREFIX}-icon-grid-area` });

		// Show recent icons or prompt to search
		const recentIds = this.plugin.settings.recentIcons;
		if (recentIds.length > 0) {
			this.loadAndRenderIcons(recentIds, "Recent");
		} else {
			this.gridContainer.createEl("p", {
				text: "Search for icons...",
				cls: `${CSS_PREFIX}-placeholder`,
			});
		}
	}

	onSearch(query: string): void {
		if (this.searchTimeout) clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(async () => {
			this.gridContainer.empty();

			if (!query.trim()) {
				const recentIds = this.plugin.settings.recentIcons;
				if (recentIds.length > 0) {
					await this.loadAndRenderIcons(recentIds, "Recent");
				} else {
					this.gridContainer.createEl("p", {
						text: "Search for icons...",
						cls: `${CSS_PREFIX}-placeholder`,
					});
				}
				return;
			}

			this.gridContainer.createEl("p", {
				text: "Searching...",
				cls: `${CSS_PREFIX}-placeholder`,
			});

			try {
				const iconIds = await searchIcons(query);
				this.gridContainer.empty();

				if (iconIds.length === 0) {
					this.gridContainer.createEl("p", {
						text: "No icons found",
						cls: `${CSS_PREFIX}-placeholder`,
					});
					return;
				}

				await this.loadAndRenderIcons(iconIds, "Icons");
			} catch {
				this.gridContainer.empty();
				this.gridContainer.createEl("p", {
					text: "Failed to search icons",
					cls: `${CSS_PREFIX}-placeholder`,
				});
			}
		}, SEARCH_DEBOUNCE_MS);
	}

	async onRandom(): Promise<void> {
		const iconId = await getRandomIcon();
		if (iconId) {
			this.pickIcon(iconId);
		}
	}

	destroy(): void {
		if (this.searchTimeout) clearTimeout(this.searchTimeout);
	}

	// ─── Private ────────────────────────────────────

	private async loadAndRenderIcons(iconIds: string[], label: string) {
		this.gridContainer.createEl("div", {
			text: label,
			cls: `${CSS_PREFIX}-emoji-category-label`,
		});

		const grid = this.gridContainer.createDiv({ cls: `${CSS_PREFIX}-icon-grid` });

		// Fetch icon data
		const icons = await fetchIconData(iconIds);

		// Build a map for ordering
		const iconMap = new Map<string, IconifyIcon>();
		for (const icon of icons) {
			iconMap.set(icon.id, icon);
		}

		// Render in original order
		for (const id of iconIds) {
			const icon = iconMap.get(id);
			if (!icon) continue;

			const btn = grid.createEl("button", {
				cls: `${CSS_PREFIX}-icon-item`,
				attr: { "aria-label": icon.name, title: icon.id },
			});

			const svg = createSvgElement(icon, PICKER_ICON_SIZE, this.currentColor);
			btn.appendChild(svg);

			btn.addEventListener("click", () => this.pickIcon(icon.id));
		}
	}

	private pickIcon(iconId: string) {
		this.plugin.addToRecent("icon", iconId);
		this.modal.selectIcon({
			type: "icon",
			value: iconId,
			color: this.currentColor,
		});
	}
}
