import { FileHandler } from "io/fileHandler";
import Crafty from "main";
import { CraftyNode } from "observers/observer";
import { debounce, setIcon } from "obsidian";

export class DOMHandler {
	private static selection_listeners_cb: (() => void)[] = [];
	private static nodes_click_lister_cb: (() => void)[] = [];
	private static title_edit_lister_cb: (() => void)[] = [];
	private static last_node_id = "";
	private static titleInput: HTMLDivElement | null = null;
	private static titleDisplay: HTMLDivElement | null = null;
	private static textArea: HTMLTextAreaElement | null = null;
	private static save_state: HTMLSpanElement | null = null;
	private static crafty: Crafty | null;

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

	static async showSelectedNode() {
		if (!this.crafty) return;
		const node = this.crafty.selectedNode;
		if (!node || this.last_node_id == node.id) return;
		this.#freeSelectionListeners();
		const title_container = DOMHandler.getTitleDisplay();
		const title = title_container.querySelector("span");

		const text_area = DOMHandler.getTextArea();
		text_area.removeAttribute("disabled");

		if (!title) return;

		// initial state
		text_area.value = node.description || "";
		title_container.classList.remove("hidden");
		title.setText(node.title);
	}

	static async showEmptyEdit() {
		this.#freeSelectionListeners();

		const text_area: HTMLTextAreaElement | null =
			document.querySelector(".description-input");

		text_area?.setAttr("disabled", true);
		if (!text_area) return;

		text_area.value = "";

		DOMHandler.hideTitle();
	}

	static hideTitle() {
		const title_display = DOMHandler.getTitleDisplay();
		const title_input = DOMHandler.getTitleInput();
		title_display.classList.add("hidden");
		title_input.classList.add("hidden");
	}

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
				const span: HTMLSpanElement = element.querySelector(
					"span"
				) as HTMLSpanElement;

				inner_input.value = span.textContent || "";
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

	static getSaveState() {
		if (!this.save_state) {
			const save_state = createEl("span", {
				text: "Saved",
				attr: { class: "save_state" },
			});

			this.save_state = save_state;
		}
		return this.save_state;
	}

	static getTextArea() {
		if (!this.textArea) {
			const element = createEl("textarea", {
				attr: { class: "description-input" },
			});

			this.textArea = element;
		}
		this.#freeSelectionListeners();
		const inputChangeCallback = debounce(
			async (t) => {
				if (!this.crafty || !this.crafty.selectedNode || !this.textArea)
					return;

				const node = this.crafty.selectedNode;
				const file = this.crafty.currentFile;
				const vault = this.crafty.vault;
				const save_state = DOMHandler.getSaveState();
				save_state.setText("Saving...");
				node.description = this.textArea.value;
				await FileHandler.updateCanvasNode(node, file, vault);
				setTimeout(() => {
					save_state.setText("Saved");
				}, 200);
			},
			3000,
			true
		);

		this.textArea.addEventListener("input", inputChangeCallback);
		this.selection_listeners_cb.push(() => {
			if (!this.textArea) return;
			this.textArea.removeEventListener("input", inputChangeCallback);
		});
		return this.textArea;
	}

	static setCraftyInstance(crafty: Crafty) {
		this.crafty = crafty;
	}

	static getTitleInput() {
		if (!this.titleInput) {
			const element = createEl("div", {
				attr: { class: "title-edit-div hidden" },
			});

			const input = element.createEl("input", {
				attr: { class: "title-input" },
			});

			const input_focus_lost_cb = async () => {
				this.#saveTitle(element, input);
			};

			const input_enter_cb = async (ev: KeyboardEvent) => {
				if (ev.key == "Enter") {
					this.#saveTitle(element, input);
				}
			};

			input.addEventListener("focusout", input_focus_lost_cb);

			input.addEventListener("keydown", input_enter_cb);

			this.title_edit_lister_cb.push(() => {
				input.removeEventListener("keydown", input_enter_cb);
			});

			this.title_edit_lister_cb.push(() => {
				input.removeEventListener("focusout", input_focus_lost_cb);
			});

			this.titleInput = element;
		}
		return this.titleInput;
	}
	static async #saveTitle(element: HTMLDivElement, input: HTMLInputElement) {
		const display = DOMHandler.getTitleDisplay();
		element.classList.add("hidden");
		display.classList.remove("hidden");
		if (!this.crafty || !this.crafty.selectedNode || !this.textArea) return;
		const node = this.crafty.selectedNode;
		const file = this.crafty.currentFile;
		const vault = this.crafty.vault;
		node.title = input.value;
		await FileHandler.updateCanvasNode(node, file, vault);
	}

	static free() {
		this.#freeNodesClickListeners();
		this.#freeSelectionListeners();
		this.#freeTitleEditListeners();
	}
}
