import { FileHandler } from "io/fileHandler";
import { CraftyNode } from "observers/observer";
import { TFile, Vault, debounce, setIcon } from "obsidian";

export class DOMHandler {
	private static selection_listeners_cb: (() => void)[] = [];
	private static nodes_click_lister_cb: (() => void)[] = [];
	private static title_edit_lister_cb: (() => void)[] = [];
	private static last_node_id = "";
	private static titleInput: HTMLDivElement | null = null;
	private static titleDisplay: HTMLDivElement | null = null;

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

	static #freeTitleEditListeners() {
		let callback = this.title_edit_lister_cb.pop();
		while (callback) {
			callback();
			callback = this.title_edit_lister_cb.pop();
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
			3000,
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

	static getEditPanel() {}

	static getNodePanel() {}

	static getTitleDisplay() {
		if (!this.titleDisplay) {
			const element = createEl("div", {
				attr: { class: "title-edit-div" },
			});

			element.createEl("span", {
				attr: { class: "title" },
			});

			const icon_container = element.createEl("span", {
				attr: { class: "edit-icon" },
			});

			setIcon(icon_container, "pencil");

			const icon_click_cb = () => {
				const input = DOMHandler.getTitleInput();
				element.classList.add("hidden");
				input.classList.remove("hidden");
				input.querySelector("input");
				const inner_input = input.querySelector("input");
				if (!inner_input) return;
				inner_input.focus();
			};
			icon_container.addEventListener("click", icon_click_cb);

			this.title_edit_lister_cb.push(() => {
				icon_container.removeEventListener("click", icon_click_cb);
			});

			this.titleDisplay = element;
		}
		return this.titleDisplay;
	}

	static getTitleInput() {
		if (!this.titleInput) {
			const element = createEl("div", {
				attr: { class: "title-edit-div hidden" },
			});

			const input = element.createEl("input", {
				attr: { class: "title-input" },
			});

			const input_focus_lost_cb = () => {
				const display = DOMHandler.getTitleDisplay();
				element.classList.add("hidden");
				display.classList.remove("hidden");
			};
			input.addEventListener("focusout", input_focus_lost_cb);

			this.title_edit_lister_cb.push(() => {
				input.removeEventListener("focusout", input_focus_lost_cb);
			});

			this.titleInput = element;
		}
		return this.titleInput;
	}

	static free() {
		this.#freeNodesClickListeners();
		this.#freeSelectionListeners();
		this.#freeTitleEditListeners();
	}
}
