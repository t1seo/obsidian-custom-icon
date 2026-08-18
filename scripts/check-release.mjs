import { existsSync, readFileSync, statSync } from "node:fs";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));
const errors = [];

if (!/^[a-z-]+$/.test(manifest.id) || manifest.id.includes("obsidian") || manifest.id.endsWith("plugin")) {
	errors.push("manifest.id must use lowercase letters and hyphens, exclude 'obsidian', and not end with 'plugin'");
}

if (!manifest.name || /obsidian|plugin/i.test(manifest.name)) {
	errors.push("manifest.name must be present and exclude 'Obsidian' and 'Plugin'");
}

if (
	typeof manifest.description !== "string" ||
	manifest.description.length > 250 ||
	!/[.!?]$/.test(manifest.description)
) {
	errors.push("manifest.description must be 250 characters or fewer and end with punctuation");
}

if (manifest.version !== packageJson.version) {
	errors.push(`version mismatch: manifest ${manifest.version}, package ${packageJson.version}`);
}

const expectedPackageName = manifest.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "");
if (packageJson.name !== expectedPackageName) {
	errors.push(`package name ${packageJson.name} must match manifest name slug ${expectedPackageName}`);
}

if (versions[manifest.version] !== manifest.minAppVersion) {
	errors.push(`versions.json must map ${manifest.version} to ${manifest.minAppVersion}`);
}

for (const asset of ["main.js", "manifest.json", "styles.css"]) {
	if (!existsSync(asset) || statSync(asset).size === 0) {
		errors.push(`missing or empty release asset: ${asset}`);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`Release check failed: ${error}`);
	process.exit(1);
}

console.log(`Release metadata and assets are valid for Vault Icon Studio ${manifest.version}.`);
