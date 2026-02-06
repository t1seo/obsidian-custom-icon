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

/** Regex to match :shortcode: patterns (emoji + custom icon) */
const SHORTCODE_REGEX = /:([\w+-]+):/g;

/** Regex to match :iconica-ICONID: patterns specifically */
const CUSTOM_ICON_REGEX = /^iconica-(.+)$/;

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

/** Resolved inline icon info */
interface ResolvedIcon {
	type: "emoji" | "custom";
	value: string; // emoji char or custom icon ID
}

/** Resolve a shortcode to either emoji or custom icon */
function resolveInlineIcon(code: string, plugin: IconicaPlugin): ResolvedIcon | null {
	// Check for custom icon pattern :iconica-ICONID:
	const customMatch = code.match(CUSTOM_ICON_REGEX);
	if (customMatch) {
		const iconId = customMatch[1];
		return { type: "custom", value: iconId };
	}

	// Check emoji shortcodes
	const emoji = resolveShortcode(code);
	if (emoji) return { type: "emoji", value: emoji };

	return null;
}

/** CM6 Widget that renders an inline emoji */
class InlineEmojiWidget extends WidgetType {
	constructor(private display: string) {
		super();
	}

	toDOM(): HTMLElement {
		const span = document.createElement("span");
		span.className = "iconica-inline-icon";
		span.textContent = this.display;
		return span;
	}

	eq(other: InlineEmojiWidget): boolean {
		return this.display === other.display;
	}
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
		const adapter = this.plugin.app.vault.adapter;
		img.src = adapter.getResourcePath(
			`${this.plugin.manifest.dir}/icons/${this.iconId}.png`,
		);
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

/** Create the CM6 ViewPlugin for inline icon decoration */
function createInlineIconPlugin(plugin: IconicaPlugin) {
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
						const resolved = resolveInlineIcon(match[1], plugin);
						if (!resolved) continue;

						const widget =
							resolved.type === "emoji"
								? new InlineEmojiWidget(resolved.value)
								: new InlineCustomIconWidget(resolved.value, plugin);

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
		},
		{ decorations: (v) => v.decorations },
	);
}

/**
 * Registers inline icon support for both editor and reading mode.
 * Supports emoji shortcodes (:smile:) and custom icons (:iconica-ICONID:).
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
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

		const replacements: {
			node: Text;
			matches: { index: number; length: number; resolved: ResolvedIcon }[];
		}[] = [];

		let textNode = walker.nextNode() as Text | null;
		while (textNode) {
			const text = textNode.textContent ?? "";
			const matches: { index: number; length: number; resolved: ResolvedIcon }[] = [];

			for (const match of text.matchAll(SHORTCODE_REGEX)) {
				const resolved = resolveInlineIcon(match[1], this.plugin);
				if (resolved) {
					matches.push({ index: match.index!, length: match[0].length, resolved });
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

				if (m.resolved.type === "emoji") {
					const span = document.createElement("span");
					span.className = "iconica-inline-icon";
					span.textContent = m.resolved.value;
					fragment.appendChild(span);
				} else {
					const span = document.createElement("span");
					span.className = "iconica-inline-icon is-img";
					const img = document.createElement("img");
					const adapter = this.plugin.app.vault.adapter;
					img.src = adapter.getResourcePath(
						`${this.plugin.manifest.dir}/icons/${m.resolved.value}.png`,
					);
					img.alt = "";
					img.width = 18;
					img.height = 18;
					span.appendChild(img);
					fragment.appendChild(span);
				}

				lastIndex = m.index + m.length;
			}

			if (lastIndex < text.length) {
				fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
			}

			parent.replaceChild(fragment, node);
		}
	}
}
