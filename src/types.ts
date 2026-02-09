/** Data for a single icon assignment */
export interface IconData {
	type: "custom";
	/** Custom icon library ID */
	value: string;
}

/** Map of file/folder paths to their assigned icons */
export type IconMapping = Record<string, IconData>;

/** A custom icon stored in the workspace library */
export interface CustomIcon {
	id: string;
	name: string;
	/** Relative path to icon image inside plugin icons/ dir */
	path: string;
	createdAt: number;
	tags?: string[];
	/** File extension: "png" | "svg". Defaults to "png" for backward compat */
	ext?: string;
}

/** Persisted workspace icon library */
export interface IconLibrary {
	icons: CustomIcon[];
}

/** Plugin settings stored in data.json */
export interface IconicaSettings {
	/** Enable inline :icon: shortcodes in notes */
	enableInlineIcons: boolean;
}

/** Persisted plugin data (settings + icon mappings combined) */
export interface IconicaData {
	settings: IconicaSettings;
	iconMap: IconMapping;
}

/** Active tab in the Icon Picker Modal */
export type PickerTab = "custom" | "upload";

/** Callback when an icon is selected in the picker */
export type IconSelectCallback = (icon: IconData | null) => void;
