import { FileHandler } from "io/fileHandler";
import Crafty, { CraftyNode, VIEW_TYPE } from "main";
import { WorkspaceLeaf } from "obsidian";
import { DescriptionModal } from "./descriptionModal";

export class DOMHandler {
	static async activatePanelView(plugin: Crafty) {
		const { workspace } = plugin.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(true);
			await leaf.setViewState({
				type: VIEW_TYPE,
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

	static async showPlaceholderView(plugin: Crafty) {
		const { workspace } = plugin.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(true);
			await leaf.setViewState({
				type: VIEW_TYPE,
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
		const title_character_limit = 48;
		let title = "";
		let file = [];

		switch (node.type) {
			case "text":
				if (!node.text || /^\s*$/.test(node.text)) title = "Untitled";
				else title = node.text;
				break;

			case "file":
				//@ts-ignore
				file = node.file.split("/");
				title = file[file.length - 1];
				break;

			case "group":
				title = node.label as string;
				break;

			default:
				break;
		}
		return title.length > title_character_limit
			? `${title.slice(0, title_character_limit)}`
			: title;
	}

	static #onModalOpenCallback(event: Event) {
		event.stopPropagation();
		//@ts-ignore
		const plugin = this.plugin;
		//@ts-ignore
		const node = this.node;

		new DescriptionModal(
			plugin.app,
			node.value.description,
			async (result) => {
				const file = plugin.app.workspace.getActiveFile();
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
					plugin.app.workspace.setActiveLeaf(plugin.canvasLeaf, {
						focus: true,
					});
					this.attachToolTip(plugin);
				}
			}
		).open();
	}

	static #onPanelClickCallback(event: Event) {
		//@ts-ignore
		this.selectNode(this.node.value.id, this.plugin);
	}

	static async updatePanelDOM(plugin: Crafty) {
		const container = plugin.html_list;
		if (!container || !plugin.state) return;

		const nodes = Array.from(plugin.state, ([name, value]) => ({
			name,
			value,
		}));

		this.clearPanelEventAll(plugin);

		for (const node of nodes) {
			const cls = [];
			cls.push("panel-div");
			if (node.value.selected) {
				cls.push("active-panel-div");
			}

			const panel = createEl("div", {
				cls: cls,
			});

			panel.createEl("span", {
				text: `${this.#titleFromNode(node.value)}`,
			});
			const edit_btn = panel.createEl("button", { text: "edit" });

			const openModalCallback = this.#onModalOpenCallback.bind({
				plugin: plugin,
				node: node,
				attachToolTip: this.attachToolTip,
			});

			//@ts-ignore
			edit_btn.openModalCallback = openModalCallback;
			edit_btn.addEventListener("click", openModalCallback);

			const clickCallback = this.#onPanelClickCallback.bind({
				selectNode: this.selectNode,
				node: node,
				plugin: plugin,
			});

			//@ts-ignore
			panel.clickCallback = clickCallback;
			panel.addEventListener("click", clickCallback);

			container.appendChild(panel);
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

	static clearPanelEventAll(plugin: Crafty) {
		const container = plugin.html_list;
		if (!container) return;
		const panels = container.querySelectorAll(".panel-div");
		container.empty();

		panels.forEach((panel) => {
			this.#clearPanelItemEvent(panel);
		});
	}

	static #clearPanelItemEvent(panel: Element) {
		if (!panel) return;
		//@ts-ignore
		if (panel.clickCallback) {
			panel.removeEventListener(
				"click",
				//@ts-ignore
				panel.clickCallback
			);
		}

		const edit_btn = panel.querySelector("button");
		if (edit_btn) {
			//@ts-ignore
			if (edit_btn.openModalCallback) {
				edit_btn.removeEventListener(
					"click",
					//@ts-ignore
					edit_btn.openModalCallback
				);
			}
		}
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
