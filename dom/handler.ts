import { FileHandler } from "io/fileHandler";
import Crafty, { CraftyNode } from "main";
import { debounce } from "obsidian";

export class DOMHandler {
	private static selection_listeners_free: (() => void)[] = [];

	static #freeSelectionListeners() {
		let callback = this.selection_listeners_free.pop();
		while (callback) {
			callback();
			callback = this.selection_listeners_free.pop();
		}
	}

	static #showSelection(
		Plugin: Crafty,
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

		body.createEl("span", {
			text: "Saved",
			cls: ["save_state"],
		});
		const inputChangeCallback = debounce(
			(event: Event) => {
				this.#saveDescription(Plugin, text_area, selected_node.value);
			},
			1000,
			true
		);
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

	static async #saveDescription(
		plugin: Crafty,
		text_area: HTMLTextAreaElement,
		node: CraftyNode
	) {
		const file = plugin.app.workspace.getActiveFile();
		if (!file) return;

		const description = text_area.value;

		if (!description) {
			delete node.description;
		} else {
			node.description = description;
		}
		const save_state = document.querySelector(".save_state");
		if (save_state) {
			save_state.textContent = "Saving...";
		}
		await FileHandler.updateCanvasNode(node, file, plugin.app.vault);
		if (save_state) {
			setTimeout(() => {
				save_state.textContent = "Saved";
			}, 200);
		}
		if (plugin.canvasLeaf) {
			this.attachToolTip(plugin);
			plugin.changeLeafFocus(plugin.canvasLeaf, true);
			setTimeout(() => {
				plugin.changeLeafFocus(plugin.leaf, true);
			}, 100);
		}
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
}
