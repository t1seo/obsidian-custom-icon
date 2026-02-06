import { Plugin } from "obsidian";

export default class IconicaPlugin extends Plugin {
	async onload() {
		console.log("Iconica plugin loaded");
	}

	onunload() {
		console.log("Iconica plugin unloaded");
	}
}
