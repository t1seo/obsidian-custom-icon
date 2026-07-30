import type { InlineIconAnnotation, InlineIconAnnotationMapping } from "../types";

export class InlineAnnotationStore {
	private annotations: Map<string, InlineIconAnnotation>;

	constructor(initial: InlineIconAnnotationMapping = {}) {
		this.annotations = new Map(
			Object.entries(initial).map(([id, annotation]) => [id, { ...annotation }]),
		);
	}

	get(id: string): InlineIconAnnotation | undefined {
		const annotation = this.annotations.get(id);
		return annotation ? { ...annotation } : undefined;
	}

	set(id: string, markdown: string, now: number, createdAt?: number): InlineIconAnnotation {
		const existing = this.annotations.get(id);
		const annotation: InlineIconAnnotation = {
			id,
			markdown,
			createdAt: createdAt ?? existing?.createdAt ?? now,
			updatedAt: now,
		};
		this.annotations.set(id, annotation);
		return { ...annotation };
	}

	remove(id: string): boolean {
		return this.annotations.delete(id);
	}

	toJSON(): InlineIconAnnotationMapping {
		return Object.fromEntries(
			Array.from(this.annotations, ([id, annotation]) => [id, { ...annotation }]),
		);
	}
}
