import type { IconicaSettings } from "./types";

/** Icon size rendered in the file explorer (px) */
export const EXPLORER_ICON_SIZE = 17;

/** Icon size rendered in tab headers (px) */
export const TAB_ICON_SIZE = 16;

/** Icon size rendered above note title (px) */
export const TITLE_ICON_SIZE = 48;

/** Default plugin settings */
export const DEFAULT_SETTINGS: IconicaSettings = {
	enableInlineIcons: false,
};

/** CSS class prefix for the plugin */
export const CSS_PREFIX = "iconica";

/** Plugin icons directory name (relative to plugin dir) */
export const ICONS_DIR = "icons";

/** Icon library metadata filename */
export const LIBRARY_FILE = "icon-library.json";
