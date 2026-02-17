import {
	type Editor,
	type EditorPosition,
	EditorSuggest,
	type EditorSuggestContext,
	type EditorSuggestTriggerInfo,
	type TFile,
} from "obsidian";
import { CSS_PREFIX } from "../constants";
import type CustomIconPlugin from "../main";

/** Escape special regex characters in a string */
function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface IconSuggestion {
	id: string;
	name: string;
}

/**
 * IDE-style autocomplete for inline icon shortcodes.
 * Triggers when user types `:PREFIX-` and shows matching icons.
 */
export class InlineIconSuggest extends EditorSuggest<IconSuggestion> {
	private plugin: CustomIconPlugin;

	constructor(plugin: CustomIconPlugin) {
		super(plugin.app);
		this.plugin = plugin;
		this.limit = 20;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor,
		_file: TFile | null,
	): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.enableInlineIcons) return null;

		const line = editor.getLine(cursor.line);
		const beforeCursor = line.slice(0, cursor.ch);

		const prefix = escapeRegex(this.plugin.settings.inlineIconPrefix);
		const match = beforeCursor.match(new RegExp(`:${prefix}-([\\w-]*)$`));
		if (!match) return null;

		return {
			start: { line: cursor.line, ch: cursor.ch - match[0].length },
			end: cursor,
			query: match[1],
		};
	}

	getSuggestions(context: EditorSuggestContext): IconSuggestion[] {
		const query = context.query.toLowerCase();
		return this.plugin.iconLibrary
			.getAll()
			.filter((icon) => {
				if (!query) return true;
				return (
					icon.name.toLowerCase().includes(query) ||
					icon.id.toLowerCase().includes(query)
				);
			})
			.map((icon) => ({ id: icon.id, name: icon.name }));
	}

	renderSuggestion(suggestion: IconSuggestion, el: HTMLElement) {
		const container = el.createDiv({ cls: `${CSS_PREFIX}-suggest-item` });

		container.createEl("img", {
			attr: {
				src: this.plugin.iconLibrary.getIconUrl(suggestion.id),
				width: "20",
				height: "20",
			},
			cls: `${CSS_PREFIX}-suggest-icon`,
		});

		container.createSpan({
			text: suggestion.name,
			cls: `${CSS_PREFIX}-suggest-name`,
		});
	}

	selectSuggestion(suggestion: IconSuggestion, _evt: MouseEvent | KeyboardEvent) {
		if (!this.context) return;

		const { editor, start, end } = this.context;
		const prefix = this.plugin.settings.inlineIconPrefix;
		const replacement = `:${prefix}-${suggestion.name}:`;
		editor.replaceRange(replacement, start, end);
	}
}
