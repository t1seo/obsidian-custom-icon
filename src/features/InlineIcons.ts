import {
	Decoration,
	type DecorationSet,
	type EditorView,
	type PluginValue,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import {
	Component,
	type MarkdownPostProcessorContext,
	MarkdownRenderChild,
	MarkdownRenderer,
	Menu,
	editorInfoField,
} from "obsidian";
import type CustomIconPlugin from "../main";
import { InlineAnnotationModal } from "../ui/InlineAnnotationModal";
import {
	buildInlineIconRegex,
	replaceInlineIconInSection,
	setInlineIconAnnotation,
} from "../utils/inlineIconSyntax";

/** Resolve a captured value to an actual icon ID by checking ID first, then name */
function resolveIconId(value: string, plugin: CustomIconPlugin): string | null {
	const lib = plugin.iconLibrary;
	if (lib.getById(value)) return value;
	const byName = lib.getAll().find((i) => i.name === value);
	return byName ? byName.id : null;
}

/** Attach a hover preview tooltip to an inline icon span. Returns a cleanup function. */
interface InlineIconTarget {
	shortcode: string;
	annotationId?: string;
	sourcePath: string;
	replaceShortcode: (nextShortcode: string) => Promise<void>;
}

function createAnnotationId(plugin: CustomIconPlugin): string {
	let id: string;
	do {
		id = `note-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
	} while (plugin.inlineAnnotations.get(id));
	return id;
}

function openAnnotationModal(plugin: CustomIconPlugin, iconName: string, target: InlineIconTarget) {
	const annotationId = target.annotationId ?? createAnnotationId(plugin);
	const annotation = plugin.inlineAnnotations.get(annotationId);

	new InlineAnnotationModal(
		{
			iconName,
			markdown: annotation?.markdown ?? "",
			sourcePath: target.sourcePath,
			canRemove: annotation !== undefined,
			onSave: async (markdown) => {
				await plugin.saveInlineAnnotation(annotationId, markdown);
				if (target.annotationId) return;
				try {
					await target.replaceShortcode(setInlineIconAnnotation(target.shortcode, annotationId));
				} catch (error) {
					try {
						await plugin.removeInlineAnnotation(annotationId);
					} catch (rollbackError) {
						console.error("Failed to roll back inline icon annotation", rollbackError);
					}
					throw error;
				}
			},
			onRemove: async () => {
				if (!target.annotationId || !annotation) return;
				await plugin.removeInlineAnnotation(target.annotationId);
				try {
					await target.replaceShortcode(setInlineIconAnnotation(target.shortcode, null));
				} catch (error) {
					try {
						await plugin.saveInlineAnnotation(annotation.id, annotation.markdown);
					} catch (rollbackError) {
						console.error("Failed to restore inline icon annotation", rollbackError);
					}
					throw error;
				}
			},
		},
		plugin.app,
	).open();
}

function attachAnnotationMenu(
	span: HTMLElement,
	plugin: CustomIconPlugin,
	iconName: string,
	target: InlineIconTarget,
) {
	span.addEventListener("click", (event) => {
		event.preventDefault();
		openAnnotationModal(plugin, iconName, target);
	});

	span.addEventListener("keydown", (event) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		event.preventDefault();
		openAnnotationModal(plugin, iconName, target);
	});

	span.addEventListener("contextmenu", (event) => {
		event.preventDefault();
		event.stopPropagation();
		const hasAnnotation = target.annotationId
			? plugin.inlineAnnotations.get(target.annotationId) !== undefined
			: false;
		new Menu()
			.addItem((item) =>
				item
					.setTitle(hasAnnotation ? "Edit icon annotation" : "Add icon annotation")
					.setIcon(hasAnnotation ? "message-square-text" : "message-square-plus")
					.onClick(() => openAnnotationModal(plugin, iconName, target)),
			)
			.showAtMouseEvent(event);
	});
}

function attachHoverPreview(
	span: HTMLElement,
	plugin: CustomIconPlugin,
	iconUrl: string,
	iconName: string,
	annotationId: string | undefined,
	getSourcePath: () => string,
): () => void {
	let tooltip: HTMLElement | null = null;
	let tooltipComponent: Component | null = null;
	let hideTimer: number | null = null;

	const removeTooltip = () => {
		if (hideTimer !== null) {
			window.clearTimeout(hideTimer);
			hideTimer = null;
		}
		tooltipComponent?.unload();
		tooltipComponent = null;
		if (tooltip) {
			tooltip.remove();
			tooltip = null;
		}
		document.removeEventListener("keydown", removeTooltip);
	};

	const scheduleRemove = () => {
		if (hideTimer !== null) window.clearTimeout(hideTimer);
		hideTimer = window.setTimeout(removeTooltip, 120);
	};

	const showTooltip = () => {
		if (tooltip) return;
		tooltip = document.createElement("div");
		tooltip.className = "custom-icon-inline-preview";
		const annotation = annotationId ? plugin.inlineAnnotations.get(annotationId) : undefined;

		const header = document.createElement("div");
		header.className = "custom-icon-inline-preview-header";

		const img = document.createElement("img");
		img.src = iconUrl;
		img.alt = iconName;
		header.appendChild(img);

		const label = document.createElement("div");
		label.className = "custom-icon-inline-preview-label";
		label.textContent = iconName;
		header.appendChild(label);
		tooltip.appendChild(header);

		if (annotation) {
			tooltip.classList.add("has-annotation");
			const content = document.createElement("div");
			content.className = "custom-icon-inline-preview-content markdown-rendered";
			tooltip.appendChild(content);
			const component = new Component();
			component.load();
			tooltipComponent = component;
			void MarkdownRenderer.render(
				plugin.app,
				annotation.markdown,
				content,
				getSourcePath(),
				component,
			).catch((error) => console.error("Failed to render inline icon annotation", error));
			tooltip.addEventListener("mouseenter", () => {
				if (hideTimer !== null) window.clearTimeout(hideTimer);
			});
			tooltip.addEventListener("mouseleave", scheduleRemove);
		}

		document.body.appendChild(tooltip);

		const rect = span.getBoundingClientRect();
		tooltip.style.left = `${rect.left + rect.width / 2}px`;
		tooltip.style.top = `${rect.top - 8}px`;

		document.addEventListener("keydown", removeTooltip);
	};

	span.addEventListener("mouseenter", showTooltip);
	span.addEventListener("mouseleave", scheduleRemove);
	span.addEventListener("focus", showTooltip);
	span.addEventListener("blur", scheduleRemove);

	return removeTooltip;
}

function createInlineIconElement(
	plugin: CustomIconPlugin,
	iconId: string,
	annotationId: string | undefined,
	target: InlineIconTarget,
): { span: HTMLElement; cleanup: () => void } {
	const span = document.createElement("button");
	span.type = "button";
	span.className = "custom-icon-inline-icon is-img";
	span.tabIndex = 0;

	const iconUrl = plugin.iconLibrary.getIconUrl(iconId);
	const iconMeta = plugin.iconLibrary.getById(iconId);
	const iconName = iconMeta?.name ?? iconId;
	const img = document.createElement("img");
	img.src = iconUrl;
	img.alt = "";
	span.appendChild(img);

	const annotation = annotationId ? plugin.inlineAnnotations.get(annotationId) : undefined;
	span.setAttribute("aria-label", annotation ? `${iconName}, annotated` : iconName);
	if (annotation) span.classList.add("has-annotation");
	attachAnnotationMenu(span, plugin, iconName, target);
	const cleanup = attachHoverPreview(
		span,
		plugin,
		iconUrl,
		iconName,
		annotationId,
		() => target.sourcePath,
	);
	return { span, cleanup };
}

/** CM6 Widget that renders an inline custom icon image */
class InlineCustomIconWidget extends WidgetType {
	private removeTooltip?: () => void;

	constructor(
		private iconId: string,
		private annotationId: string | undefined,
		private shortcode: string,
		private from: number,
		private to: number,
		private plugin: CustomIconPlugin,
	) {
		super();
	}

	toDOM(view: EditorView): HTMLElement {
		const sourcePath = view.state.field(editorInfoField).file?.path ?? "";
		const { span, cleanup } = createInlineIconElement(this.plugin, this.iconId, this.annotationId, {
			shortcode: this.shortcode,
			annotationId: this.annotationId,
			sourcePath,
			replaceShortcode: (nextShortcode) => {
				const current = view.state.doc.sliceString(this.from, this.to);
				if (current !== this.shortcode) {
					throw new Error("The inline icon changed before the annotation was saved.");
				}
				view.dispatch({
					changes: { from: this.from, to: this.to, insert: nextShortcode },
				});
				return Promise.resolve();
			},
		});
		this.removeTooltip = cleanup;
		return span;
	}

	eq(other: InlineCustomIconWidget): boolean {
		return (
			this.iconId === other.iconId &&
			this.annotationId === other.annotationId &&
			this.shortcode === other.shortcode &&
			this.from === other.from &&
			this.to === other.to
		);
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

		for (const match of text.matchAll(buildInlineIconRegex(plugin.settings.inlineIconPrefix))) {
			const iconId = resolveIconId(match[1], plugin);
			if (!iconId) continue;
			const matchFrom = from + match.index;
			const matchTo = matchFrom + match[0].length;
			const widget = new InlineCustomIconWidget(
				iconId,
				match[2],
				match[0],
				matchFrom,
				matchTo,
				plugin,
			);

			widgets.push({
				from: matchFrom,
				to: matchTo,
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
			(el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				this.processElement(el, ctx);
			},
		);
	}

	private processElement(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		if (!this.plugin.settings.enableInlineIcons) return;

		const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
		const occurrenceCounts = new Map<string, number>();

		const replacements: {
			node: Text;
			matches: {
				index: number;
				length: number;
				iconId: string;
				annotationId?: string;
				shortcode: string;
				occurrenceIndex: number;
			}[];
		}[] = [];

		let textNode = walker.nextNode() as Text | null;
		while (textNode) {
			const text = textNode.textContent ?? "";
			const matches: {
				index: number;
				length: number;
				iconId: string;
				annotationId?: string;
				shortcode: string;
				occurrenceIndex: number;
			}[] = [];

			for (const match of text.matchAll(
				buildInlineIconRegex(this.plugin.settings.inlineIconPrefix),
			)) {
				const resolved = resolveIconId(match[1], this.plugin);
				if (!resolved) continue;
				const occurrenceIndex = occurrenceCounts.get(match[0]) ?? 0;
				occurrenceCounts.set(match[0], occurrenceIndex + 1);
				matches.push({
					index: match.index,
					length: match[0].length,
					iconId: resolved,
					annotationId: match[2],
					shortcode: match[0],
					occurrenceIndex,
				});
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

				const { span, cleanup } = createInlineIconElement(this.plugin, m.iconId, m.annotationId, {
					shortcode: m.shortcode,
					annotationId: m.annotationId,
					sourcePath: ctx.sourcePath,
					replaceShortcode: async (nextShortcode) => {
						const section = ctx.getSectionInfo(el);
						if (!section) {
							throw new Error("The rendered note section is no longer available.");
						}
						const file = this.plugin.app.vault.getFileByPath(ctx.sourcePath);
						if (!file) throw new Error("The note file is no longer available.");
						await this.plugin.app.vault.process(file, (source) => {
							const nextSource = replaceInlineIconInSection(
								source,
								section.lineStart,
								section.lineEnd,
								m.shortcode,
								nextShortcode,
								m.occurrenceIndex,
							);
							if (nextSource === null) {
								throw new Error("The inline icon changed before the annotation was saved.");
							}
							return nextSource;
						});
					},
				});
				const child = new MarkdownRenderChild(span);
				child.register(cleanup);
				ctx.addChild(child);
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
