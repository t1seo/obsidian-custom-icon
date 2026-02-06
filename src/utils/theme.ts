/**
 * Theme detection and switching utilities.
 */

/** Check if Obsidian is currently in dark mode */
export function isDarkMode(): boolean {
	return document.body.classList.contains("theme-dark");
}

/** Listen for Obsidian theme changes */
export function onThemeChange(callback: (isDark: boolean) => void): MutationObserver {
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type === "attributes" && mutation.attributeName === "class") {
				callback(isDarkMode());
				break;
			}
		}
	});

	observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
	return observer;
}
