import emojiData from "emojibase-data/en/data.json";

// Emojibase group IDs (from Unicode CLDR):
// 0 = Smileys & Emotion, 1 = People & Body, 2 = Component,
// 3 = Animals & Nature, 4 = Food & Drink, 5 = Travel & Places,
// 6 = Activities, 7 = Objects, 8 = Symbols, 9 = Flags
const EMOJIBASE_GROUP_MAP: Record<number, string> = {
	0: "smileys-emotion",
	1: "people-body",
	3: "animals-nature",
	4: "food-drink",
	5: "travel-places",
	6: "activities",
	7: "objects",
	8: "symbols",
	9: "flags",
};

export interface EmojiItem {
	emoji: string;
	label: string;
	tags: string[];
	category: string;
	order: number;
}

/** Pre-processed emoji list (excludes components like skin tone modifiers) */
const allEmojis: EmojiItem[] = emojiData
	.filter((e) => e.group !== undefined && e.group !== 2 && e.emoji)
	.map((e) => ({
		emoji: e.emoji,
		label: e.label ?? "",
		tags: e.tags ?? [],
		category: EMOJIBASE_GROUP_MAP[e.group!] ?? "symbols",
		order: e.order ?? 9999,
	}))
	.sort((a, b) => a.order - b.order);

/** Group emojis by category */
const emojisByCategory = new Map<string, EmojiItem[]>();
for (const e of allEmojis) {
	const list = emojisByCategory.get(e.category) ?? [];
	list.push(e);
	emojisByCategory.set(e.category, list);
}

/** Get all emojis grouped by category */
export function getEmojisByCategory(): Map<string, EmojiItem[]> {
	return emojisByCategory;
}

/** Get all emojis as a flat list */
export function getAllEmojis(): EmojiItem[] {
	return allEmojis;
}

/** Search emojis by query (matches label and tags) */
export function searchEmojis(query: string): EmojiItem[] {
	if (!query.trim()) return allEmojis;

	const q = query.toLowerCase().trim();
	const terms = q.split(/\s+/);

	return allEmojis.filter((e) => {
		const haystack = `${e.label} ${e.tags.join(" ")}`.toLowerCase();
		return terms.every((term) => haystack.includes(term));
	});
}

/** Get a random emoji */
export function getRandomEmoji(): EmojiItem {
	return allEmojis[Math.floor(Math.random() * allEmojis.length)];
}
