import { FileHandler } from "io/fileHandler";
import Crafty, { CraftyNode, VIEW_TYPE_EXAMPLE } from "main";
import { WorkspaceLeaf } from "obsidian";
import { DescriptionModal } from "./descriptionModal";

export class DOMHandler {
	static async activatePanelView(plugin: Crafty) {
		const { workspace } = plugin.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(true);
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
		plugin.leaf = leaf;

		const container = plugin.leaf.view.containerEl.children[1];
		container.empty();

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
			leaf = workspace.getRightLeaf(true);
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

		if (node.type == "group") return node.label;
	}

	static async updatePanelDOM(plugin: Crafty) {
		const container = plugin.html_list;
		if (!container || !plugin.state) return;

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

			const elem = createEl("div", {
				text: `${this.#titleFromNode(node.value)}`,
				cls: cls,
			});

			const edit_btn = elem.createEl("button", { text: "edit" });

			edit_btn.addEventListener("click", (event) => {
				event.stopPropagation();
				new DescriptionModal(
					plugin.app,
					node.value.description,
					async (result) => {
						const file = app.workspace.getActiveFile();
						if (!file) return;

						if (!result) {
							delete node.value.description;
						} else {
							node.value.description = result;
						}

						await FileHandler.updateCanvasNode(
							node.value,
							file,
							plugin.app.vault
						);

						if (plugin.canvasLeaf) {
							plugin.app.workspace.setActiveLeaf(
								plugin.canvasLeaf,
								{ focus: true }
							);
							this.attachToolTip(plugin);
						}
					}
				).open();
			});

			elem.addEventListener("click", (event) => {
				this.selectNode(node.value.id, plugin);
			});

			container.appendChild(elem);
		}
	}

	static attachToolTip(plugin: Crafty) {
		plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type != "canvas") return;
			//@ts-ignore
			const nodes = Array.from(leaf.view.canvas.nodes, ([id, value]) => ({
				id,
				container: value.nodeEl,
				data: value.unknownData,
			}));

			for (const node of nodes) {
				const description = node.data.description;
				const content_blocker: HTMLElement =
					node.container.querySelector(".canvas-node-container");
				if (!content_blocker) return;
				if (!description) {
					if (content_blocker)
						content_blocker.removeAttribute("aria-label");
					continue;
				}
				content_blocker.setAttribute("aria-label", `${description}`);
			}
		});
	}

	static selectNode(id: string, plugin: Crafty) {
		const leaf = plugin.CurrentLeaf();
		//@ts-ignore
		if (!leaf || leaf.getViewState().type != "canvas") return;

		const nodes = Array.from(
			//@ts-ignore
			leaf.view.canvas.nodes,
			([id, value]) => ({
				id,
				container: value.nodeEl,
				data: value.unknownData,
			})
		);

		for (const elem of nodes) {
			if (id == elem.id) {
				const container: HTMLElement = elem.container;

				if (plugin.node_state) {
					plugin.node_state.setCurrent(id);
					if (plugin.state) {
						elem.data.selected = true;
					}
				}
				container.click();
			}
		}
	}
}
