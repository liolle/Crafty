import Crafty, { CraftyNode } from "main";

export class DOMHandler {
	private static selection_listeners_free: (() => void)[] = [];

	static #freeSelectionListeners() {
		let callback = this.selection_listeners_free.pop();
		while (callback) {
			callback();
			callback = this.selection_listeners_free.pop();
		}
	}

	static async activatePanelView(plugin: Crafty) {
		const leaf = await plugin.createPanelLeaf();
		if (!leaf) return;
		plugin.leaf = leaf;

		//@ts-ignore
		const container = leaf.containerEl;
		container.empty();
		plugin.app.workspace.revealLeaf(leaf);
	}

	static async closePanelView(plugin: Crafty) {
		plugin.leaf?.detach();
		plugin.leaf = null;
	}

	static async showPlaceholderView(plugin: Crafty) {
		plugin.createPanelLeaf();
		const leaf = await plugin.createPanelLeaf();
		if (!leaf) return;

		//@ts-ignore
		const container = leaf.containerEl;
		container.empty();
		const div = container.createEl("div", {
			cls: ["place-holder-container"],
		});

		div.createEl("div", {
			text: "placeholder",
		});
	}

	static #showSelection(
		selected_node: { name: string; value: CraftyNode },
		container: HTMLElement
	) {
		this.#freeSelectionListeners();
		const title = this.#titleFromNode(selected_node.value);

		const header_area = container.createEl("div", {
			cls: ["description-header-div"],
		});
		header_area.createEl("span", {
			text: title,
			cls: [],
		});
		const body = container.createEl("div", {
			cls: ["description-modal-body"],
		});

		const text_area = body.createEl("textarea", {
			cls: ["description-modal-input"],
		});
		const inputChangeCallback = (event: Event) => {
			console.log(text_area.value);
		};
		//@ts-ignore
		text_area.inputChangeCallback = inputChangeCallback;
		text_area.addEventListener("input", inputChangeCallback);
		text_area.value = selected_node.value.description || "";
		this.selection_listeners_free.push(() => {
			text_area.removeEventListener(
				"input",
				//@ts-ignore
				inputChangeCallback
			);
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

	static async updatePanelDOM(plugin: Crafty) {
		const leaf = plugin.leaf;

		if (!leaf) return;
		//@ts-ignore
		const container = leaf.containerEl;
		if (!container || !plugin.state) return;
		container.empty();
		const nodes = Array.from(plugin.state, ([name, value]) => ({
			name,
			value,
		}));

		const selected_node = nodes.filter((val) => val.value.selected);

		if (selected_node.length == 0) {
			// this.showPlaceholderView(plugin);
			return;
		}

		if (selected_node.length > 1) {
			// this.showPlaceholderView(plugin);
			return;
		}

		const canvasL = plugin.CurrentLeaf();
		this.#showSelection(selected_node[0], container);
		plugin.changeLeafFocus(canvasL, true);
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
