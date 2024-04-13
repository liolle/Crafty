import { CraftyNode } from "observers/observer";
import { TFile, Vault } from "obsidian";

export class FileHandler {
	static async updateCanvasNode(node: CraftyNode, file: TFile, vault: Vault) {
		const content = await vault.read(file);
		try {
			const parsed_data = JSON.parse(content);
			for (const elem of parsed_data.nodes) {
				if (elem.id == node.id) {
					delete elem.description;
					if (node.description && node.description != "") {
						elem.description = node.description;
					}
					break;
				}
			}
			await vault.modify(file, JSON.stringify(parsed_data));
		} catch (error) {
			console.error(error);
		}
	}
}
