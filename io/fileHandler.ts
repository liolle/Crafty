import { CraftyNode } from "main";
import { TFile, Vault } from "obsidian";

export interface RawCraftyNode {
	file?: string;
	description?: string;
	id: string;
	text?: string;
	type: string;
	height: number;
	width: number;
	x: number;
	y: number;
}

export class FileHandler {
	static async updateCanvasNode(node: CraftyNode, file: TFile, vault: Vault) {
		const content = await vault.read(file);

		try {
			const parsed_data = JSON.parse(content);

			for (const elem of parsed_data.nodes) {
				if (elem.id == node.id) {
					delete elem.description;

					if (node.description) {
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
