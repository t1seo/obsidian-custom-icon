import { CSS_PREFIX, PRESET_COLORS } from "../constants";

export type ColorChangeCallback = (color: string | undefined) => void;

/**
 * A simple color picker with preset swatches.
 * Renders as a row of color dots, replacing the random button area in the Icons tab.
 */
export class ColorPicker {
	private activeColor: string | undefined;
	private container!: HTMLElement;
	private onChange: ColorChangeCallback;

	constructor(onChange: ColorChangeCallback, initialColor?: string) {
		this.onChange = onChange;
		this.activeColor = initialColor;
	}

	/** Render the color picker into a parent element */
	render(parent: HTMLElement): HTMLElement {
		this.container = parent.createDiv({ cls: `${CSS_PREFIX}-color-picker` });

		for (const color of PRESET_COLORS) {
			const swatch = this.container.createEl("button", {
				cls: `${CSS_PREFIX}-color-swatch`,
				attr: { "aria-label": color, title: color },
			});
			swatch.style.backgroundColor = color;

			if (this.activeColor === color) {
				swatch.addClass("is-active");
			}

			swatch.addEventListener("click", () => this.selectColor(color));
		}

		return this.container;
	}

	getColor(): string | undefined {
		return this.activeColor;
	}

	private selectColor(color: string) {
		// Toggle: clicking active color deselects it
		if (this.activeColor === color) {
			this.activeColor = undefined;
		} else {
			this.activeColor = color;
		}

		// Update UI
		const swatches = this.container.querySelectorAll(`.${CSS_PREFIX}-color-swatch`);
		swatches.forEach((el) => {
			const btn = el as HTMLElement;
			btn.toggleClass("is-active", btn.style.backgroundColor === this.hexToRgb(this.activeColor));
		});

		this.onChange(this.activeColor);
	}

	/** Convert hex to rgb string for comparison (browser normalizes to rgb) */
	private hexToRgb(hex: string | undefined): string {
		if (!hex) return "";
		const r = Number.parseInt(hex.slice(1, 3), 16);
		const g = Number.parseInt(hex.slice(3, 5), 16);
		const b = Number.parseInt(hex.slice(5, 7), 16);
		return `rgb(${r}, ${g}, ${b})`;
	}
}
