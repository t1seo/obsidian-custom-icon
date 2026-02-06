import type { EmojiCategory, IconicaSettings } from "./types";

/** Maximum number of recent emojis/icons to keep */
export const RECENT_MAX = 30;

/** Icon size rendered in the file explorer (px) */
export const EXPLORER_ICON_SIZE = 17;

/** Icon size rendered in the icon picker grid (px) */
export const PICKER_ICON_SIZE = 32;

/** Icon size rendered in tab headers (px) */
export const TAB_ICON_SIZE = 16;

/** Icon size rendered above note title (px) */
export const TITLE_ICON_SIZE = 48;

/** Debounce delay for search input (ms) */
export const SEARCH_DEBOUNCE_MS = 150;

/** Iconify API endpoints with fallbacks */
export const ICONIFY_API_HOSTS = [
	"https://api.iconify.design",
	"https://api.simplesvg.com",
	"https://api.unisvg.com",
] as const;

/** Default Iconify icon sets shown in the Icons tab */
export const DEFAULT_ICON_SETS = ["lucide", "mdi", "ph", "tabler"] as const;

/** Emoji categories matching Notion's bottom bar */
export const EMOJI_CATEGORIES: EmojiCategory[] = [
	{ id: "recent", label: "Recent", icon: "🕐" },
	{ id: "smileys-emotion", label: "Smileys & People", icon: "😀" },
	{ id: "people-body", label: "People & Body", icon: "👋" },
	{ id: "animals-nature", label: "Animals & Nature", icon: "🐱" },
	{ id: "food-drink", label: "Food & Drink", icon: "🍔" },
	{ id: "activities", label: "Activities", icon: "⚽" },
	{ id: "travel-places", label: "Travel & Places", icon: "✈️" },
	{ id: "objects", label: "Objects", icon: "💡" },
	{ id: "symbols", label: "Symbols", icon: "🔣" },
	{ id: "flags", label: "Flags", icon: "🏴" },
	{ id: "custom", label: "Custom", icon: "➕" },
];

/** Default plugin settings */
export const DEFAULT_SETTINGS: IconicaSettings = {
	showInExplorer: true,
	showInTab: true,
	showInTitle: true,
	enableInlineIcons: false,
	iconSize: EXPLORER_ICON_SIZE,
	maxCacheSize: 50,
	recentEmojis: [],
	recentIcons: [],
	preferredIconSets: [...DEFAULT_ICON_SETS],
};

/** CSS class prefix for the plugin */
export const CSS_PREFIX = "iconica";

/** Plugin icons directory name (relative to plugin dir) */
export const ICONS_DIR = "icons";

/** Icon library metadata filename */
export const LIBRARY_FILE = "icon-library.json";

/** Preset colors for the icon color picker */
export const PRESET_COLORS = [
	"#4a4a4a", // default gray
	"#e03e3e", // red
	"#d9730d", // orange
	"#dfab01", // yellow
	"#0f7b6c", // green
	"#0b6e99", // blue
	"#6940a5", // purple
	"#ad1a72", // pink
	"#64473a", // brown
] as const;
