import {
	Decoration,
	type DecorationSet,
	type EditorView,
	type PluginValue,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import type { MarkdownPostProcessorContext } from "obsidian";
import type CustomIconPlugin from "../main";

/** Escape special regex characters in a string */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build inline icon regex from the user's prefix setting */
function buildIconRegex(prefix: string): RegExp {
	return new RegExp(`:${escapeRegex(prefix)}-([\\w-]+):`, "g");
}

/** Resolve a captured value to an actual icon ID by checking ID first, then name */
function resolveIconId(value: string, plugin: CustomIconPlugin): string | null {
	const lib = plugin.iconLibrary;
	if (lib.getById(value)) return value;
	const byName = lib.getAll().find((i) => i.name === value);
	return byName ? byName.id : null;
}

/** Attach a hover preview tooltip to an inline icon span. Returns a cleanup function. */
function attachHoverPreview(span: HTMLElement, iconUrl: string, iconName: string): () => void {
	let tooltip: HTMLElement | null = null;

	const removeTooltip = () => {
		if (tooltip) {
			tooltip.remove();
			tooltip = null;
		}
		document.removeEventListener("keydown", removeTooltip);
	};

	span.addEventListener("mouseenter", () => {
		tooltip = document.createElement("div");
		tooltip.className = "custom-icon-inline-preview";

		const img = document.createElement("img");
		img.src = iconUrl;
		img.alt = iconName;
		tooltip.appendChild(img);

		const label = document.createElement("div");
		label.className = "custom-icon-inline-preview-label";
		label.textContent = iconName;
		tooltip.appendChild(label);

		document.body.appendChild(tooltip);

		const rect = span.getBoundingClientRect();
		tooltip.style.left = `${rect.left + rect.width / 2}px`;
		tooltip.style.top = `${rect.top - 8}px`;

		// Remove tooltip on any keypress (user may edit text while hovering)
		document.addEventListener("keydown", removeTooltip);
	});

	span.addEventListener("mouseleave", removeTooltip);

	return removeTooltip;
}

/** CM6 Widget that renders an inline custom icon image */
class InlineCustomIconWidget extends WidgetType {
	private removeTooltip?: () => void;

	constructor(
		private iconId: string,
		private plugin: CustomIconPlugin,
	) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "custom-icon-inline-icon is-img";

		const iconUrl = this.plugin.iconLibrary.getIconUrl(this.iconId);
		const iconMeta = this.plugin.iconLibrary.getById(this.iconId);

		const img = document.createElement("img");
		img.src = iconUrl;
		img.alt = "";
		span.appendChild(img);

		this.removeTooltip = attachHoverPreview(span, iconUrl, iconMeta?.name ?? this.iconId);
		return span;
	}

	eq(other: InlineCustomIconWidget): boolean {
		return this.iconId === other.iconId;
	}

	destroy(_dom: HTMLElement) {
		this.removeTooltip?.();
	}
}

/** Build decorations for all visible :PREFIX-ICONID: matches */
function buildDecorations(view: EditorView, plugin: CustomIconPlugin): DecorationSet {
	if (!plugin.settings.enableInlineIcons) return Decoration.none;

	const widgets: Array<{ from: number; to: number; deco: Decoration }> = [];

	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);

		for (const match of text.matchAll(buildIconRegex(plugin.settings.inlineIconPrefix))) {
			const iconId = resolveIconId(match[1], plugin);
			if (!iconId) continue;
			const widget = new InlineCustomIconWidget(iconId, plugin);

			widgets.push({
				from: from + match.index,
				to: from + match.index + match[0].length,
				deco: Decoration.replace({ widget }),
			});
		}
	}

	if (widgets.length === 0) return Decoration.none;

	widgets.sort((a, b) => a.from - b.from);
	return Decoration.set(widgets.map((w) => w.deco.range(w.from, w.to)));
}

/** Create the CM6 ViewPlugin for inline icon decoration */
function createInlineIconPlugin(plugin: CustomIconPlugin) {
	return ViewPlugin.fromClass(
		class implements PluginValue {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, plugin);
			}

			update(update: ViewUpdate) {
				if (update.docChanged) {
					document.querySelectorAll(".custom-icon-inline-preview").forEach((el) => el.remove());
				}
				this.decorations = buildDecorations(update.view, plugin);
			}
		},
		{ decorations: (v) => v.decorations },
	);
}

/**
 * Registers inline icon support for both editor and reading mode.
 * Supports custom icons via :custom-icon-ICONID: shortcodes.
 */
export class InlineIcons {
	constructor(private plugin: CustomIconPlugin) {}

	enable() {
		// Editor mode: CM6 extension
		this.plugin.registerEditorExtension([createInlineIconPlugin(this.plugin)]);

		// Reading mode: Markdown post processor
		this.plugin.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
				this.processElement(el);
			},
		);
	}

	private processElement(el: HTMLElement) {
		if (!this.plugin.settings.enableInlineIcons) return;

		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

		const replacements: {
			node: Text;
			matches: { index: number; length: number; iconId: string }[];
		}[] = [];

		let textNode = walker.nextNode() as Text | null;
		while (textNode) {
			const text = textNode.textContent ?? "";
			const matches: { index: number; length: number; iconId: string }[] = [];

			for (const match of text.matchAll(buildIconRegex(this.plugin.settings.inlineIconPrefix))) {
				const resolved = resolveIconId(match[1], this.plugin);
				if (!resolved) continue;
				matches.push({ index: match.index, length: match[0].length, iconId: resolved });
			}

			if (matches.length > 0) {
				replacements.push({ node: textNode, matches });
			}
			textNode = walker.nextNode() as Text | null;
		}

		for (const { node, matches } of replacements) {
			const text = node.textContent ?? "";
			const parent = node.parentNode;
			if (!parent) continue;

			const fragment = document.createDocumentFragment();
			let lastIndex = 0;

			for (const m of matches) {
				if (m.index > lastIndex) {
					fragment.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
				}

				const iconUrl = this.plugin.iconLibrary.getIconUrl(m.iconId);
				const iconMeta = this.plugin.iconLibrary.getById(m.iconId);
				const span = document.createElement("span");
				span.className = "custom-icon-inline-icon is-img";
				const img = document.createElement("img");
				img.src = iconUrl;
				img.alt = "";
				span.appendChild(img);
				attachHoverPreview(span, iconUrl, iconMeta?.name ?? m.iconId);
				fragment.appendChild(span);

				lastIndex = m.index + m.length;
			}

			if (lastIndex < text.length) {
				fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
			}

			parent.replaceChild(fragment, node);
		}
	}
}
