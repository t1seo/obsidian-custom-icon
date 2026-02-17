import { CSS_PREFIX } from "../constants";
import type CustomIconPlugin from "../main";
import type { CustomIcon } from "../types";
import type { IconPickerModal, TabRenderer } from "./IconPickerModal";

/**
 * Custom tab: displays saved custom icons from the workspace library.
 * Supports search, selection, and removal.
 */
export class CustomTab implements TabRenderer {
	private container!: HTMLElement;
	private gridContainer!: HTMLElement;
	private searchTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(
		private plugin: CustomIconPlugin,
		private modal: IconPickerModal,
	) {}

	render(container: HTMLElement): void {
		this.container = container;
		this.gridContainer = container.createDiv({ cls: `${CSS_PREFIX}-custom-grid-area` });
		this.renderIcons(this.plugin.iconLibrary.getAll());
	}

	onSearch(query: string): void {
		if (this.searchTimeout) clearTimeout(this.searchTimeout);

		this.searchTimeout = setTimeout(() => {
			const results = this.plugin.iconLibrary.search(query);
			this.renderIcons(results);
		}, 150);
	}

	destroy(): void {
		if (this.searchTimeout) clearTimeout(this.searchTimeout);
	}

	// ─── Private ────────────────────────────────────

	private startRename(label: HTMLElement, icon: CustomIcon) {
		const input = document.createElement("input");
		input.type = "text";
		input.value = icon.name;
		input.className = `${CSS_PREFIX}-rename-input`;

		const commit = () => {
			const newName = input.value.trim();
			if (newName && newName !== icon.name) {
				void (async () => {
					await this.plugin.iconLibrary.rename(icon.id, newName);
					label.textContent = newName;
					label.setAttribute("title", "Double-click to rename");
				})();
			} else {
				label.textContent = icon.name;
				label.setAttribute("title", "Double-click to rename");
			}
		};

		input.addEventListener("blur", commit);
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				e.preventDefault();
				input.blur();
			} else if (e.key === "Escape") {
				input.value = icon.name;
				input.blur();
			}
		});

		label.textContent = "";
		label.removeAttribute("title");
		label.appendChild(input);
		input.focus();
		input.select();
	}

	private renderIcons(icons: CustomIcon[]) {
		this.gridContainer.empty();

		if (icons.length === 0) {
			this.gridContainer.createEl("p", {
				text: "No custom icons yet. Upload one in the upload tab.",
				cls: `${CSS_PREFIX}-placeholder`,
			});
			return;
		}

		this.gridContainer.createEl("div", {
			text: "Double-click icon name to rename",
			cls: `${CSS_PREFIX}-grid-hint`,
		});

		const grid = this.gridContainer.createDiv({ cls: `${CSS_PREFIX}-custom-grid` });

		for (const icon of icons) {
			const item = grid.createDiv({ cls: `${CSS_PREFIX}-custom-item` });

			const imgBtn = item.createEl("button", {
				cls: `${CSS_PREFIX}-custom-item-btn`,
				attr: { "aria-label": icon.name, title: icon.name },
			});

			const img = imgBtn.createEl("img");
			img.src = this.plugin.iconLibrary.getIconUrl(icon.id);
			img.alt = icon.name;
			img.width = 40;
			img.height = 40;

			imgBtn.addEventListener("click", () => {
				this.modal.selectIcon({ type: "custom", value: icon.id });
			});

			const label = item.createDiv({
				cls: `${CSS_PREFIX}-custom-item-label`,
				attr: { title: "Double-click to rename" },
			});
			label.textContent = icon.name;

			label.addEventListener("dblclick", (e) => {
				e.stopPropagation();
				this.startRename(label, icon);
			});

			// Remove button
			const removeBtn = item.createEl("button", {
				cls: `${CSS_PREFIX}-custom-item-remove`,
				attr: { "aria-label": "Remove" },
			});
			removeBtn.textContent = "\u00D7";
			removeBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				void (async () => {
					await this.plugin.iconLibrary.remove(icon.id);
					// Remove all iconMap references to this deleted icon
					for (const [path, data] of Object.entries(this.plugin.iconMap)) {
						if (data.value === icon.id) {
							this.plugin.removeIcon(path);
						}
					}
					this.renderIcons(this.plugin.iconLibrary.getAll());
				})();
			});
		}
	}
}
