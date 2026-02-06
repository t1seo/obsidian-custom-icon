import { beforeEach, describe, expect, it, vi } from "vitest";
import { IconLibraryService } from "../src/services/IconLibraryService";

/** Create a mock DataAdapter */
function createMockAdapter(data: Record<string, string> = {}) {
	const store: Record<string, string> = { ...data };
	return {
		read: vi.fn(async (path: string) => {
			if (store[path] !== undefined) return store[path];
			throw new Error("File not found");
		}),
		write: vi.fn(async (path: string, content: string) => {
			store[path] = content;
		}),
		remove: vi.fn(async (path: string) => {
			if (store[path] === undefined) throw new Error("File not found");
			delete store[path];
		}),
		getResourcePath: vi.fn((path: string) => `app://local/${path}`),
		_store: store,
	};
}

describe("IconLibraryService", () => {
	let service: IconLibraryService;
	let adapter: ReturnType<typeof createMockAdapter>;
	const pluginDir = ".obsidian/plugins/obsidian-custom-icon";

	beforeEach(() => {
		adapter = createMockAdapter();
		service = new IconLibraryService(adapter as any, pluginDir);
	});

	describe("load", () => {
		it("loads empty library when file does not exist", async () => {
			await service.load();
			expect(service.getAll()).toEqual([]);
		});

		it("loads library from disk", async () => {
			const icons = [{ id: "custom-1", name: "test", path: "icons/custom-1.png", createdAt: 1000 }];
			adapter._store[`${pluginDir}/icon-library.json`] = JSON.stringify({ icons });

			await service.load();
			expect(service.getAll()).toEqual(icons);
		});

		it("handles malformed JSON gracefully", async () => {
			adapter._store[`${pluginDir}/icon-library.json`] = "not-json";

			await service.load();
			expect(service.getAll()).toEqual([]);
		});
	});

	describe("save", () => {
		it("writes library to disk", async () => {
			await service.load();
			await service.add({ id: "custom-1", name: "test", path: "icons/custom-1.png", createdAt: 1000 });

			expect(adapter.write).toHaveBeenCalled();
			const written = JSON.parse(adapter.write.mock.calls[0][1]);
			expect(written.icons).toHaveLength(1);
			expect(written.icons[0].id).toBe("custom-1");
		});
	});

	describe("getAll", () => {
		it("returns all icons", async () => {
			const icons = [
				{ id: "a", name: "alpha", path: "icons/a.png", createdAt: 1 },
				{ id: "b", name: "beta", path: "icons/b.png", createdAt: 2 },
			];
			adapter._store[`${pluginDir}/icon-library.json`] = JSON.stringify({ icons });
			await service.load();

			expect(service.getAll()).toHaveLength(2);
		});
	});

	describe("search", () => {
		beforeEach(async () => {
			const icons = [
				{ id: "a", name: "react", path: "icons/a.png", createdAt: 1, tags: ["frontend"] },
				{ id: "b", name: "python", path: "icons/b.png", createdAt: 2, tags: ["backend"] },
				{ id: "c", name: "docker", path: "icons/c.png", createdAt: 3, tags: ["devops"] },
			];
			adapter._store[`${pluginDir}/icon-library.json`] = JSON.stringify({ icons });
			await service.load();
		});

		it("returns all icons for empty query", () => {
			expect(service.search("")).toHaveLength(3);
			expect(service.search("  ")).toHaveLength(3);
		});

		it("searches by name", () => {
			const results = service.search("react");
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe("react");
		});

		it("searches case-insensitively", () => {
			expect(service.search("PYTHON")).toHaveLength(1);
		});

		it("searches by tag", () => {
			const results = service.search("devops");
			expect(results).toHaveLength(1);
			expect(results[0].name).toBe("docker");
		});

		it("returns empty for no match", () => {
			expect(service.search("nonexistent")).toHaveLength(0);
		});
	});

	describe("getById", () => {
		it("returns icon by ID", async () => {
			const icons = [{ id: "custom-1", name: "test", path: "icons/custom-1.png", createdAt: 1 }];
			adapter._store[`${pluginDir}/icon-library.json`] = JSON.stringify({ icons });
			await service.load();

			expect(service.getById("custom-1")?.name).toBe("test");
		});

		it("returns undefined for unknown ID", async () => {
			await service.load();
			expect(service.getById("nope")).toBeUndefined();
		});
	});

	describe("add", () => {
		it("adds icon and saves", async () => {
			await service.load();
			await service.add({ id: "new-1", name: "new", path: "icons/new-1.png", createdAt: 999 });

			expect(service.getAll()).toHaveLength(1);
			expect(service.getById("new-1")?.name).toBe("new");
			expect(adapter.write).toHaveBeenCalled();
		});
	});

	describe("remove", () => {
		beforeEach(async () => {
			const icons = [{ id: "custom-1", name: "test", path: "icons/custom-1.png", createdAt: 1 }];
			adapter._store[`${pluginDir}/icon-library.json`] = JSON.stringify({ icons });
			await service.load();
		});

		it("removes icon metadata and file", async () => {
			await service.remove("custom-1");

			expect(service.getAll()).toHaveLength(0);
			expect(adapter.remove).toHaveBeenCalledWith(`${pluginDir}/icons/custom-1.png`);
		});

		it("does nothing for unknown ID", async () => {
			await service.remove("unknown");
			expect(service.getAll()).toHaveLength(1);
		});

		it("handles missing file gracefully", async () => {
			adapter.remove.mockRejectedValueOnce(new Error("not found"));
			await service.remove("custom-1");
			expect(service.getAll()).toHaveLength(0);
		});
	});

	describe("rename", () => {
		beforeEach(async () => {
			const icons = [{ id: "custom-1", name: "old-name", path: "icons/custom-1.png", createdAt: 1 }];
			adapter._store[`${pluginDir}/icon-library.json`] = JSON.stringify({ icons });
			await service.load();
		});

		it("renames icon and saves", async () => {
			await service.rename("custom-1", "new-name");
			expect(service.getById("custom-1")?.name).toBe("new-name");
			expect(adapter.write).toHaveBeenCalled();
		});

		it("does nothing for unknown ID", async () => {
			await service.rename("unknown", "new-name");
			expect(service.getById("custom-1")?.name).toBe("old-name");
		});
	});

	describe("getIconPath", () => {
		it("returns correct path", () => {
			expect(service.getIconPath("custom-1")).toBe(`${pluginDir}/icons/custom-1.png`);
		});
	});

	describe("getIconUrl", () => {
		it("returns resource URL via adapter", () => {
			const url = service.getIconUrl("custom-1");
			expect(adapter.getResourcePath).toHaveBeenCalledWith(`${pluginDir}/icons/custom-1.png`);
			expect(url).toBe(`app://local/${pluginDir}/icons/custom-1.png`);
		});
	});
});
