import { FileHandler } from "io/fileHandler";
import Crafty from "main";
import { CraftyNode } from "observers/observer";
import { TFile, Vault, debounce } from "obsidian";

export class DOMHandler {
	private static selection_listeners_cb: (() => void)[] = [];
	private static nodes_click_lister_cb: (() => void)[] = [];
	private static last_node_id = "";

	static #freeSelectionListeners() {
		let callback = this.selection_listeners_cb.pop();
		while (callback) {
			callback();
			callback = this.selection_listeners_cb.pop();
		}
	}

	static #freeNodesClickListeners() {
		let callback = this.nodes_click_lister_cb.pop();
		while (callback) {
			callback();
			callback = this.nodes_click_lister_cb.pop();
		}
	}

	static async populateNodes(nodes: CraftyNode[] | null) {
		const body = document.querySelector(".nodes-body");

		if (nodes == null || !body) return;
		DOMHandler.#freeNodesClickListeners();
		body.empty();

		for (const node of nodes) {
			const cls = ["node-element"];
			if (node.selected) cls.push("node-active");
			const child = createEl("div", {
				text: node.title,
				attr: { class: cls.join(" ") },
			});

			const clickCallback = (event: Event) => {
				node.container.click();
			};
			child.addEventListener("click", clickCallback);

			this.nodes_click_lister_cb.push(() => {
				child.removeEventListener("click", clickCallback);
			});

			body.appendChild(child);
		}
	}

	static async showSelectedNode(
		node: CraftyNode | null,
		vault: Vault,
		file: TFile
	) {
		if (!node || this.last_node_id == node.id) return;
		this.#freeSelectionListeners();
		const title: HTMLSpanElement | null = document.querySelector(
			".description-header-div span"
		);
		const text_area: HTMLTextAreaElement | null =
			document.querySelector(".description-input");
		text_area?.removeAttribute("disabled");
		const save_state: HTMLSpanElement | null =
			document.querySelector(".save_state");
		if (!title || !text_area || !save_state) return;

		const inputChangeCallback = debounce(
			async (t) => {
				save_state.setText("Saving...");
				node.description = text_area.value;
				await FileHandler.updateCanvasNode(node, file, vault);
				setTimeout(() => {
					save_state.setText("Saved");
				}, 200);
			},
			1000,
			true
		);

		text_area.addEventListener("input", inputChangeCallback);
		this.selection_listeners_cb.push(() => {
			text_area.removeEventListener("input", inputChangeCallback);
		});

		// initial state
		text_area.value = node.description || "";
		title.setText(node.title);
	}

	static async showEmptyEdit() {
		this.#freeSelectionListeners();
		const title: HTMLSpanElement | null = document.querySelector(
			".description-header-div span"
		);
		const text_area: HTMLTextAreaElement | null =
			document.querySelector(".description-input");

		text_area?.setAttr("disabled", true);
		if (!title || !text_area) return;

		// initial state
		text_area.value = "";
		title.setText("");
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

	static free() {
		this.#freeNodesClickListeners();
		this.#freeSelectionListeners();
	}
}
