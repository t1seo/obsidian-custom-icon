import {
	Decoration,
	type DecorationSet,
	type EditorView,
	type PluginValue,
	ViewPlugin,
	WidgetType,
} from "@codemirror/view";
import type { MarkdownPostProcessorContext } from "obsidian";
import type IconicaPlugin from "../main";
import { getAllEmojis } from "../services/EmojiService";

/** Regex to match :shortcode: patterns */
const SHORTCODE_REGEX = /:([\w+-]+):/g;

/** Map of shortcode -> emoji character (built from emojibase) */
const shortcodeMap = new Map<string, string>();

// Build shortcode map from emoji labels
for (const e of getAllEmojis()) {
	const code = e.label.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "");
	if (code) shortcodeMap.set(code, e.emoji);
}

/** Resolve a shortcode to its display value */
function resolveShortcode(code: string): string | null {
	if (shortcodeMap.has(code)) return shortcodeMap.get(code)!;

	const aliases: Record<string, string> = {
		smile: "grinning_face",
		heart: "red_heart",
		thumbsup: "thumbs_up",
		star: "star",
		fire: "fire",
		check: "check_mark",
		warning: "warning",
	};
	const aliased = aliases[code];
	if (aliased && shortcodeMap.has(aliased)) return shortcodeMap.get(aliased)!;

	return null;
}

/** CM6 Widget that renders an inline icon */
class InlineIconWidget extends WidgetType {
	constructor(private display: string) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "iconica-inline-icon";
		span.textContent = this.display;
		return span;
	}

	eq(other: InlineIconWidget): boolean {
		return this.display === other.display;
	}
}

/** Create the CM6 ViewPlugin for inline icon decoration */
function createInlineIconPlugin() {
	return ViewPlugin.fromClass(
		class implements PluginValue {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.buildDecorations(view);
			}

			update(update: { docChanged: boolean; viewportChanged: boolean; view: EditorView }) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.buildDecorations(update.view);
				}
			}

			private buildDecorations(view: EditorView): DecorationSet {
				const widgets: Array<{ from: number; to: number; deco: Decoration }> = [];

				for (const { from, to } of view.visibleRanges) {
					const text = view.state.doc.sliceString(from, to);

					for (const match of text.matchAll(SHORTCODE_REGEX)) {
						const display = resolveShortcode(match[1]);
						if (!display) continue;

						widgets.push({
							from: from + match.index!,
							to: from + match.index! + match[0].length,
							deco: Decoration.replace({ widget: new InlineIconWidget(display) }),
						});
					}
				}

				if (widgets.length === 0) return Decoration.none;

				widgets.sort((a, b) => a.from - b.from);
				return Decoration.set(widgets.map((w) => w.deco.range(w.from, w.to)));
			}
		},
		{ decorations: (v) => v.decorations },
	);
}

/**
 * Registers inline icon support for both editor and reading mode.
 */
export class InlineIcons {
	constructor(private plugin: IconicaPlugin) {}

	enable() {
		// Editor mode: CM6 extension
		this.plugin.registerEditorExtension([createInlineIconPlugin()]);

		// Reading mode: Markdown post processor
		this.plugin.registerMarkdownPostProcessor(
			(el: HTMLElement, _ctx: MarkdownPostProcessorContext) => {
				this.processElement(el);
			},
		);
	}

	private processElement(el: HTMLElement) {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

		const replacements: {
			node: Text;
			matches: { index: number; length: number; display: string }[];
		}[] = [];

		let textNode = walker.nextNode() as Text | null;
		while (textNode) {
			const text = textNode.textContent ?? "";
			const matches: { index: number; length: number; display: string }[] = [];

			for (const match of text.matchAll(SHORTCODE_REGEX)) {
				const display = resolveShortcode(match[1]);
				if (display) {
					matches.push({ index: match.index!, length: match[0].length, display });
				}
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
				span.className = "iconica-inline-icon";
				span.textContent = m.display;
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
