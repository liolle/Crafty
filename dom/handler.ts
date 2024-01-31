import Crafty, { CraftyNode, VIEW_TYPE_EXAMPLE } from "main";
import { WorkspaceLeaf } from "obsidian";

export class DOMHandler {
	static async activatePanelView(plugin: Crafty) {
		const { workspace } = plugin.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
		plugin.leaf = leaf;

		const container = plugin.leaf.view.containerEl.children[1];
		container.empty();
		container.createEl("h2", { text: "Title" });
		plugin.html_list = container.createEl("div", {
			cls: ["list-container"],
		});

		workspace.revealLeaf(plugin.leaf);
	}

	static async detachPanelView(plugin: Crafty) {
		const { workspace } = plugin.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
		plugin.leaf = leaf;

		const container = plugin.leaf.view.containerEl.children[1];
		container.empty();
		const div = container.createEl("div", {
			cls: ["place-holder-container"],
		});

		div.createEl("div", {
			text: "placeholder",
		});
	}

	static #titleFromNode(node: CraftyNode) {
		//@ts-ignore
		if (node.type == "text") {
			if (!node.text || /^\s*$/.test(node.text)) return "...";
			return node.text;
		}

		if (node.type == "file") return node.file;
	}

	static async updatePanelDOM(plugin: Crafty) {
		const container = plugin.html_list;
		if (!container) return;

		const nodes = Array.from(plugin.state, ([name, value]) => ({
			name,
			value,
		}));

		container.empty();

		for (const node of nodes) {
			const cls = [];
			cls.push("panel-div");
			if (node.value.selected) {
				cls.push("active-panel-div");
			}
			container.appendChild(
				createEl("div", {
					text: `${this.#titleFromNode(node.value)}`,
					cls: cls,
				})
			);
		}
	}
}
