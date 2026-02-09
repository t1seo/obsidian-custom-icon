import type { DataAdapter } from "obsidian";
import { ICONS_DIR, LIBRARY_FILE } from "../constants";
import type { CustomIcon, IconLibrary } from "../types";

/**
 * Manages the workspace custom icon library.
 * Icons are stored as image files, metadata in icon-library.json.
 */
export class IconLibraryService {
	private library: IconLibrary = { icons: [] };
	private pluginDir: string;
	private adapter: DataAdapter;

	constructor(adapter: DataAdapter, pluginDir: string) {
		this.adapter = adapter;
		this.pluginDir = pluginDir;
	}

	/** Load library from disk */
	async load(): Promise<void> {
		const path = `${this.pluginDir}/${LIBRARY_FILE}`;
		try {
			const raw = await this.adapter.read(path);
			this.library = JSON.parse(raw) as IconLibrary;
		} catch {
			this.library = { icons: [] };
		}
	}

	/** Save library to disk */
	async save(): Promise<void> {
		const path = `${this.pluginDir}/${LIBRARY_FILE}`;
		await this.adapter.write(path, JSON.stringify(this.library, null, "\t"));
	}

	/** Get all custom icons */
	getAll(): CustomIcon[] {
		return this.library.icons;
	}

	/** Search custom icons by name or tags */
	search(query: string): CustomIcon[] {
		if (!query.trim()) return this.library.icons;
		const q = query.toLowerCase();
		return this.library.icons.filter(
			(icon) =>
				icon.name.toLowerCase().includes(q) ||
				icon.tags?.some((tag) => tag.toLowerCase().includes(q)),
		);
	}

	/** Get a custom icon by ID */
	getById(id: string): CustomIcon | undefined {
		return this.library.icons.find((icon) => icon.id === id);
	}

	/** Add a new custom icon to the library */
	async add(icon: CustomIcon): Promise<void> {
		this.library.icons.push(icon);
		await this.save();
	}

	/** Remove a custom icon (metadata + files) */
	async remove(id: string): Promise<void> {
		const icon = this.getById(id);
		if (!icon) return;

		// Delete image file
		const iconsDir = `${this.pluginDir}/${ICONS_DIR}`;
		try {
			await this.adapter.remove(`${iconsDir}/${id}.png`);
		} catch {
			// File may not exist
		}

		this.library.icons = this.library.icons.filter((i) => i.id !== id);
		await this.save();
	}

	/** Rename a custom icon */
	async rename(id: string, newName: string): Promise<void> {
		const icon = this.getById(id);
		if (!icon) return;

		icon.name = newName;
		await this.save();
	}

	/** Get the file path for a custom icon */
	getIconPath(id: string): string {
		return `${this.pluginDir}/${ICONS_DIR}/${id}.png`;
	}

	/** Get resource URL for a custom icon (for <img> src) */
	getIconUrl(id: string): string {
		const path = this.getIconPath(id);
		return this.adapter.getResourcePath(path);
	}
}
