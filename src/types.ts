/** The source type of an icon */
export type IconType = "emoji" | "icon" | "custom";

/** Data for a single icon assignment */
export interface IconData {
	type: IconType;
	/** emoji: unicode char, icon: iconify ID (e.g. "mdi:home"), custom: library icon ID */
	value: string;
	/** HEX color override for iconify icons (e.g. "#ff5733") */
	color?: string;
}

/** Map of file/folder paths to their assigned icons */
export type IconMapping = Record<string, IconData>;

/** A custom icon stored in the workspace library */
export interface CustomIcon {
	id: string;
	name: string;
	/** Relative path to light-mode image inside plugin icons/ dir */
	lightPath: string;
	/** Relative path to dark-mode image inside plugin icons/ dir */
	darkPath: string;
	createdAt: number;
	tags?: string[];
}

/** Persisted workspace icon library */
export interface IconLibrary {
	icons: CustomIcon[];
}

/** Plugin settings stored in data.json */
export interface IconicaSettings {
	/** Show icon in file explorer */
	showInExplorer: boolean;
	/** Show icon in tab header */
	showInTab: boolean;
	/** Show icon above note title */
	showInTitle: boolean;
	/** Enable inline :icon: shortcodes in notes */
	enableInlineIcons: boolean;
	/** Default icon size in px */
	iconSize: number;
	/** Max icon cache size in MB */
	maxCacheSize: number;
	/** Recently used emojis (capped at RECENT_MAX) */
	recentEmojis: string[];
	/** Recently used iconify icon IDs (capped at RECENT_MAX) */
	recentIcons: string[];
	/** Preferred Iconify icon sets to show by default */
	preferredIconSets: string[];
}

/** Persisted plugin data (settings + icon mappings combined) */
export interface IconicaData {
	settings: IconicaSettings;
	iconMap: IconMapping;
}

/** Active tab in the Icon Picker Modal */
export type PickerTab = "emoji" | "icons" | "upload";

/** Emoji category used for grouping and the bottom category bar */
export interface EmojiCategory {
	id: string;
	label: string;
	icon: string;
}

/** Callback when an icon is selected in the picker */
export type IconSelectCallback = (icon: IconData | null) => void;
