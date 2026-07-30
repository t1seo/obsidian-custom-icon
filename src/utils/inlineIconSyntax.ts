function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildInlineIconRegex(prefix: string): RegExp {
	return new RegExp(`:${escapeRegex(prefix)}-([\\w-]+)(?:~([\\w-]+))?:`, "g");
}

export function setInlineIconAnnotation(shortcode: string, annotationId: string | null): string {
	const body = shortcode.slice(0, -1);
	const separatorIndex = body.lastIndexOf("~");
	const base = separatorIndex === -1 ? body : body.slice(0, separatorIndex);
	return `${base}${annotationId ? `~${annotationId}` : ""}:`;
}

export function replaceInlineIconInSection(
	source: string,
	lineStart: number,
	lineEnd: number,
	currentShortcode: string,
	nextShortcode: string,
	occurrenceIndex: number,
): string | null {
	const lines = source.split("\n");
	const sectionLines = lines.slice(lineStart, lineEnd + 1);
	if (sectionLines.length === 0) return null;

	const section = sectionLines.join("\n");
	let matchIndex = -1;
	let searchFrom = 0;
	for (let index = 0; index <= occurrenceIndex; index += 1) {
		matchIndex = section.indexOf(currentShortcode, searchFrom);
		if (matchIndex === -1) return null;
		searchFrom = matchIndex + currentShortcode.length;
	}

	const nextSection = `${section.slice(0, matchIndex)}${nextShortcode}${section.slice(
		matchIndex + currentShortcode.length,
	)}`;
	lines.splice(lineStart, sectionLines.length, ...nextSection.split("\n"));
	return lines.join("\n");
}
