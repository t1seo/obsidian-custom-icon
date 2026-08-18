import { readFileSync, writeFileSync } from "node:fs";

const version = process.env.npm_package_version;

if (!version) {
	throw new Error("npm_package_version is required");
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const versions = JSON.parse(readFileSync("versions.json", "utf8"));

manifest.version = version;
versions[version] = manifest.minAppVersion;

writeFileSync("manifest.json", `${JSON.stringify(manifest, null, "\t")}\n`);
writeFileSync("versions.json", `${JSON.stringify(versions, null, "\t")}\n`);
