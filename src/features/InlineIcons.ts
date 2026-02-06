import {
	Decoration,
	type DecorationSet,
	type EditorView,
	type PluginValue,
	type ViewUpdate,
	ViewPlugin,
	WidgetType,
} from "@codemirror/view";
import type { MarkdownPostProcessorContext } from "obsidian";
import type IconicaPlugin from "../main";

/** Regex to match :custom-icon-ICONID: or :custom-icon-NAME: patterns */
const CUSTOM_ICON_REGEX = /:custom-icon-([\w-]+):/g;

/** Resolve a captured value to an actual icon ID by checking ID first, then name */
function resolveIconId(value: string, plugin: IconicaPlugin): string | null {
	const lib = plugin.iconLibrary;
	if (lib.getById(value)) return value;
	const byName = lib.getAll().find((i) => i.name === value);
	return byName ? byName.id : null;
}

/** CM6 Widget that renders an inline custom icon image */
class InlineCustomIconWidget extends WidgetType {
	constructor(
		private iconId: string,
		private plugin: IconicaPlugin,
	) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "iconica-inline-icon is-img";

		const img = document.createElement("img");
		img.src = this.plugin.iconLibrary.getIconUrl(this.iconId);
		img.alt = "";
		img.width = 18;
		img.height = 18;
		span.appendChild(img);
		return span;
	}

	eq(other: InlineCustomIconWidget): boolean {
		return this.iconId === other.iconId;
	}
}

/** Build decorations for all visible :iconica-ICONID: matches */
function buildDecorations(view: EditorView, plugin: IconicaPlugin): DecorationSet {
	if (!plugin.settings.enableInlineIcons) return Decoration.none;

	const widgets: Array<{ from: number; to: number; deco: Decoration }> = [];

	for (const { from, to } of view.visibleRanges) {
		const text = view.state.doc.sliceString(from, to);

		for (const match of text.matchAll(CUSTOM_ICON_REGEX)) {
			const iconId = resolveIconId(match[1], plugin);
			if (!iconId) continue;
			const widget = new InlineCustomIconWidget(iconId, plugin);

			widgets.push({
				from: from + match.index!,
				to: from + match.index! + match[0].length,
				deco: Decoration.replace({ widget }),
			});
		}
	}

	if (widgets.length === 0) return Decoration.none;

	widgets.sort((a, b) => a.from - b.from);
	return Decoration.set(widgets.map((w) => w.deco.range(w.from, w.to)));
}

/** Create the CM6 ViewPlugin for inline icon decoration */
function createInlineIconPlugin(plugin: IconicaPlugin) {
	return ViewPlugin.fromClass(
		class implements PluginValue {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = buildDecorations(view, plugin);
			}

			update(update: ViewUpdate) {
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
	constructor(private plugin: IconicaPlugin) {}

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

			for (const match of text.matchAll(CUSTOM_ICON_REGEX)) {
				const resolved = resolveIconId(match[1], this.plugin);
				if (!resolved) continue;
				matches.push({ index: match.index!, length: match[0].length, iconId: resolved });
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

				const span = document.createElement("span");
				span.className = "iconica-inline-icon is-img";
				const img = document.createElement("img");
				img.src = this.plugin.iconLibrary.getIconUrl(m.iconId);
				img.alt = "";
				img.width = 18;
				img.height = 18;
				span.appendChild(img);
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
