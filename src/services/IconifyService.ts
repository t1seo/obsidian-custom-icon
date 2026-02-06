import { requestUrl } from "obsidian";
import { ICONIFY_API_HOSTS } from "../constants";

/** Parsed icon data from Iconify API */
export interface IconifyIcon {
	prefix: string;
	name: string;
	id: string; // "prefix:name"
	body: string; // SVG body (path data)
	width: number;
	height: number;
}

/** Search result from Iconify API */
interface IconifySearchResponse {
	icons: string[];
	total: number;
}

/** Icon data response from Iconify API */
interface IconifyDataResponse {
	prefix: string;
	icons: Record<string, { body: string; width?: number; height?: number }>;
	width?: number;
	height?: number;
	not_found?: string[];
}

/** In-memory SVG cache (LRU-like: oldest entries evicted when max reached) */
const svgCache = new Map<string, IconifyIcon>();
const MAX_CACHE_ENTRIES = 2000;

/** Try each API host until one succeeds */
async function fetchWithFallback(path: string): Promise<string> {
	for (const host of ICONIFY_API_HOSTS) {
		try {
			const res = await requestUrl({ url: `${host}${path}`, method: "GET" });
			if (res.status === 200) return res.text;
		} catch {
			// Try next host
		}
	}
	throw new Error(`All Iconify API hosts failed for ${path}`);
}

/** Search icons by query */
export async function searchIcons(query: string, limit = 64): Promise<string[]> {
	if (!query.trim()) return [];

	const path = `/search?query=${encodeURIComponent(query)}&limit=${limit}`;
	const text = await fetchWithFallback(path);
	const data: IconifySearchResponse = JSON.parse(text);
	return data.icons ?? [];
}

/** Fetch SVG data for a list of icon IDs (e.g. ["mdi:home", "mdi:star"]) */
export async function fetchIconData(iconIds: string[]): Promise<IconifyIcon[]> {
	if (iconIds.length === 0) return [];

	// Group by prefix
	const grouped = new Map<string, string[]>();
	for (const id of iconIds) {
		const [prefix, name] = id.split(":");
		if (!prefix || !name) continue;

		// Return from cache if available
		if (svgCache.has(id)) continue;

		const list = grouped.get(prefix) ?? [];
		list.push(name);
		grouped.set(prefix, list);
	}

	// Fetch each prefix group
	const results: IconifyIcon[] = [];

	for (const [prefix, names] of grouped) {
		const path = `/${prefix}.json?icons=${names.join(",")}`;
		try {
			const text = await fetchWithFallback(path);
			const data: IconifyDataResponse = JSON.parse(text);

			for (const [name, iconData] of Object.entries(data.icons)) {
				const icon: IconifyIcon = {
					prefix,
					name,
					id: `${prefix}:${name}`,
					body: iconData.body,
					width: iconData.width ?? data.width ?? 24,
					height: iconData.height ?? data.height ?? 24,
				};
				// Evict oldest entries if cache is full
				if (svgCache.size >= MAX_CACHE_ENTRIES) {
					const firstKey = svgCache.keys().next().value;
					if (firstKey) svgCache.delete(firstKey);
				}
				svgCache.set(icon.id, icon);
				results.push(icon);
			}
		} catch {
			// Skip failed prefixes
		}
	}

	// Also include cached results
	for (const id of iconIds) {
		const cached = svgCache.get(id);
		if (cached && !results.find((r) => r.id === id)) {
			results.push(cached);
		}
	}

	return results;
}

/** Get a single icon (from cache or API) */
export async function getIcon(iconId: string): Promise<IconifyIcon | null> {
	if (svgCache.has(iconId)) return svgCache.get(iconId)!;

	const results = await fetchIconData([iconId]);
	return results[0] ?? null;
}

/**
 * Create an SVG element from Iconify icon data (safe DOM construction).
 * No innerHTML used — parses the SVG body using DOMParser.
 */
export function createSvgElement(icon: IconifyIcon, size: number, color?: string): SVGElement {
	const ns = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(ns, "svg");
	svg.setAttribute("width", String(size));
	svg.setAttribute("height", String(size));
	svg.setAttribute("viewBox", `0 0 ${icon.width} ${icon.height}`);
	svg.setAttribute("fill", color ?? "currentColor");

	// Parse the SVG body string into DOM nodes safely
	const parser = new DOMParser();
	const doc = parser.parseFromString(`<svg xmlns="${ns}">${icon.body}</svg>`, "image/svg+xml");

	const parsed = doc.documentElement;
	while (parsed.firstChild) {
		svg.appendChild(svg.ownerDocument.importNode(parsed.firstChild, true));
	}

	return svg;
}

/** Get a random icon ID from a popular set */
export async function getRandomIcon(): Promise<string | null> {
	const sets = ["lucide", "mdi", "ph", "tabler"];
	const prefix = sets[Math.floor(Math.random() * sets.length)];

	try {
		const path = `/collection?prefix=${prefix}`;
		const text = await fetchWithFallback(path);
		const data = JSON.parse(text);

		// The uncategorized array or first category
		let allNames: string[] = [];
		if (data.uncategorized) {
			allNames = data.uncategorized;
		} else if (data.categories) {
			const firstCategory = Object.values(data.categories)[0];
			if (Array.isArray(firstCategory)) {
				allNames = firstCategory;
			}
		}

		if (allNames.length === 0) return null;
		const name = allNames[Math.floor(Math.random() * allNames.length)];
		return `${prefix}:${name}`;
	} catch {
		return null;
	}
}

/** Clear the SVG cache */
export function clearCache() {
	svgCache.clear();
}
