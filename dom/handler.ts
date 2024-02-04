import { FileHandler } from "io/fileHandler";
import Crafty, { CraftyNode, VIEW_TYPE_EXAMPLE } from "main";
import { App, Modal, WorkspaceLeaf } from "obsidian";

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
		plugin.panel_container = container;
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
		console.log(node);

		if (node.type == "group") return node.label;
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

			const elem = createEl("div", {
				text: `${this.#titleFromNode(node.value)}`,
				cls: cls,
			});

			elem.addEventListener("click", (event) => {
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
								plugin.canvasLeaf
							);
							plugin.app.workspace.revealLeaf(plugin.canvasLeaf);
						}
					}
				).open();
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
				if (!description) {
					content_blocker.removeAttribute("aria-label");
					continue;
				}
				content_blocker.setAttribute("aria-label", `${description}`);
			}
		});
	}
}

export class DescriptionModal extends Modal {
	result: string | undefined;
	onSubmit: (result: string | undefined) => void;

	constructor(
		app: App,
		text: string | undefined,
		onSubmit: (result: string | undefined) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.result = text;
	}

	onOpen() {
		const { contentEl } = this;

		const body = contentEl.createEl("div", {
			cls: ["description-modal-body"],
		});

		const input = body.createEl("textarea", {
			cls: ["description-modal-input"],
		});

		const lambda = () => {
			this.result = input.value;
		};

		input.addEventListener("input", lambda);
		input.value = this.result || "";

		const submit_btn = createEl("button", { text: "Save" });
		submit_btn.addEventListener("click", (event) => {
			input.removeEventListener("input", lambda);
			this.close();
			this.onSubmit(this.result);
		});
		body.appendChild(submit_btn);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
