import { SlDropdown, SlMenu } from "@shoelace-style/shoelace";
import { FileHandler } from "io/fileHandler";
import Crafty from "main";
import { CraftyNode, FILE_TYPE, NodeFilter } from "nodes/nodes";
import { debounce, setIcon } from "obsidian";

export class DOMHandler {
	private static selection_listeners_cb: (() => void)[] = [];
	private static nodes_click_lister_cb: (() => void)[] = [];
	private static title_edit_lister_cb: (() => void)[] = [];
	private static searchbar_lister_cb: (() => void)[] = [];
	private static sort_menu_lister_cb: (() => void)[] = [];
	private static filter_menu_badge_lister_cb: (() => void)[] = [];
	private static last_node_id = "";
	private static titleInput: HTMLDivElement | null = null;
	private static titleDisplay: HTMLDivElement | null = null;
	private static textArea: HTMLTextAreaElement | null = null;
	private static save_state: HTMLSpanElement | null = null;
	private static search_bar: HTMLInputElement | null = null;
	private static nodes_container: HTMLDivElement | null = null;
	private static filters_container: HTMLDivElement | null = null;
	private static filters_display: HTMLDivElement | null = null;
	private static sort_button: SlDropdown | null = null;
	private static filter_button: SlDropdown | null = null;
	private static sort_menu: SlMenu | null = null;
	private static filter_menu: SlMenu | null = null;
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

	static #freeSearchBarListeners() {
		let callback = this.searchbar_lister_cb.pop();
		while (callback) {
			callback();
			callback = this.searchbar_lister_cb.pop();
		}
	}

	static #freeSortMenuListeners() {
		let callback = this.sort_menu_lister_cb.pop();
		while (callback) {
			callback();
			callback = this.sort_menu_lister_cb.pop();
		}
	}

	static #freeFilterMenuBadgeListeners() {
		let callback = this.filter_menu_badge_lister_cb.pop();
		while (callback) {
			callback();
			callback = this.filter_menu_badge_lister_cb.pop();
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
				//@ts-ignore
				node.container.click();
			};
			child.addEventListener("click", clickCallback);

			this.nodes_click_lister_cb.push(() => {
				child.removeEventListener("click", clickCallback);
			});

			body.appendChild(child);
		}
	}

	static showSelectedNode() {
		if (!this.crafty) return;
		const node = this.crafty.selectedNode;
		if (!node || this.last_node_id == node.id) return;
		this.#freeSelectionListeners();
		const title_container = this.getTitleDisplay();
		const title = title_container.querySelector("span");

		const text_area = this.getTextArea();
		const save_state = this.getSaveState();

		text_area.classList.remove("hidden");
		save_state.classList.remove("hidden");

		if (!title) return;

		// initial state

		title_container.classList.remove("hidden");
		title.setText(node.title);
		this.updateTextArea(node.description || "");
	}

	static async showEmptyEdit() {
		this.#freeSelectionListeners();

		const text_area = this.getTextArea();
		const save_state = this.getSaveState();

		text_area.classList.add("hidden");
		save_state.classList.add("hidden");

		DOMHandler.hideTitle();
	}

	static async showEmptyNodes() {
		const search_bar = this.getSearchBar();
		const nodes_container = this.getNodesContainer();
		const sort_button = this.getSortButton();
		const filter_button = this.getFiltersButton();
		search_bar.classList.add("hidden");
		nodes_container.classList.add("hidden");
		sort_button.classList.add("hidden");
		filter_button.classList.add("hidden");
	}

	static async showNodes() {
		const search_bar = this.getSearchBar();
		const nodes_container = this.getNodesContainer();
		const sort_button = this.getSortButton();
		const filter_button = this.getFiltersButton();
		search_bar.classList.remove("hidden");
		nodes_container.classList.remove("hidden");
		sort_button.classList.remove("hidden");
		filter_button.classList.remove("hidden");
	}

	static hideTitle() {
		const title_display = this.getTitleDisplay();
		const title_input = this.getTitleInput();
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

	static updateTextArea(value: string) {
		if (!this.crafty || !this.crafty.nodeState) return;
		if (this.crafty.nodeState.isNodeSame) return;
		const text_area = this.getTextArea();
		text_area.value = value;
	}

	static getTextArea() {
		if (!this.textArea) {
			const element = createEl("textarea", {
				attr: { class: "description-input" },

			});

			this.textArea = element;
		}

		this.#freeSelectionListeners();
		this.textArea.spellcheck = this.crafty?.settings.editor_spell_check_enabled ?? false;

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
			1000,
			true
		);

		this.textArea.addEventListener("input", inputChangeCallback);
		this.selection_listeners_cb.push(() => {
			if (!this.textArea) return;
			this.textArea.removeEventListener("input", inputChangeCallback);
		});
		return this.textArea;
	}

	static getSearchBar() {
		if (!this.search_bar) {
			const search_bar = createEl("input", {
				attr: { class: "searchBar-input" },
			});

			search_bar.placeholder = "Search";
			const search_change_cb = debounce(() => {
				if (!this.crafty || !this.crafty.nodeState) return;
				const node_state = this.crafty.nodeState;
				node_state.setSearchWord(search_bar.value);
			}, 1000);
			search_bar.addEventListener("input", search_change_cb);

			this.searchbar_lister_cb.push(() => {
				search_bar.removeEventListener("input", search_change_cb);
			});
			this.search_bar = search_bar;
		}

		return this.search_bar;
	}

	static #toggleSortMenu() {
		const sort_button = this.getSortButton();
		const attributes_name = sort_button.getAttributeNames();
		if (attributes_name.includes("open"))
			sort_button.removeAttribute("open");
		else sort_button.setAttr("open", true);
	}

	static #sortItemTemplate(
		title: string,
		groupe: string,
		check_marker: string,
		callback: () => void
	) {
		const container = createEl("div", {
			attr: { class: `sort-item ` },
		});

		const item = createEl("div", {});
		item.setText(title);
		const check_logo = createEl("div", {
			attr: { class: `${groupe} sort-check ${check_marker}` },
		});
		setIcon(check_logo, "check");

		container.addEventListener("click", callback);
		this.sort_menu_lister_cb.push(() => {
			container.removeEventListener("click", callback);
		});

		container.appendChild(check_logo);
		container.appendChild(item);
		return container;
	}

	static getSortMenu() {
		if (!this.sort_menu) {
			const menu = createEl("sl-menu", {
				attr: { class: "sort-menu" },
			});

			const selectName = () => {
				if (!this.crafty || !this.crafty.nodeState) return;
				this.crafty.nodeState.sortBy("name");
				this.#toggleSortMenu();
			};

			const selectCreated = () => {
				if (!this.crafty || !this.crafty.nodeState) return;
				this.crafty.nodeState.sortBy("created_at");
				this.#toggleSortMenu();
			};

			const selectLastModified = () => {
				if (!this.crafty || !this.crafty.nodeState) return;
				this.crafty.nodeState.sortBy("last_modified");
				this.#toggleSortMenu();
			};

			const selectAscending = () => {
				if (!this.crafty || !this.crafty.nodeState) return;
				this.crafty.nodeState.order("asc");
				this.#toggleSortMenu();
			};

			const selectDescending = () => {
				if (!this.crafty || !this.crafty.nodeState) return;
				this.crafty.nodeState.order("des");
				this.#toggleSortMenu();
			};

			const pick_name = this.#sortItemTemplate(
				"Name",
				"g1",
				"s-name",
				selectName
			);
			const pick_created = this.#sortItemTemplate(
				"Created_At",
				"g1",
				"s-created",
				selectCreated
			);

			const pick_last = this.#sortItemTemplate(
				"Last_Modified",
				"g1",
				"s-last",
				selectLastModified
			);
			const pick_asc = this.#sortItemTemplate(
				"Ascending",
				"g2",
				"s-asc",
				selectAscending
			);
			const pick_desc = this.#sortItemTemplate(
				"Descending",
				"g2",
				"s-desc",
				selectDescending
			);

			const divider = createEl("sl-divider", {});

			menu.appendChild(pick_name);
			menu.appendChild(pick_created);
			menu.appendChild(pick_last);
			menu.appendChild(divider);
			menu.appendChild(pick_asc);
			menu.appendChild(pick_desc);

			this.sort_menu = menu;
		}
		return this.sort_menu;
	}

	static getSortButton() {
		if (!this.sort_button) {
			const sort_button = createEl("sl-dropdown", {
				attr: {
					class: "sort-button-container",
					distance: "-40",
					skidding: "-10",
				},
			});

			const button = createEl("button", {
				attr: { class: "sort-button", slot: "trigger" },
			});

			const text = createEl("span", {
				attr: { class: "sort-button-large sb-text" },
			});

			const logo = createEl("div", {});

			setIcon(logo, "arrow-down-up");

			button.appendChild(logo);
			button.appendChild(text);

			sort_button.appendChild(button);

			sort_button.appendChild(this.getSortMenu());

			this.sort_button = sort_button;
		}

		return this.sort_button;
	}

	static getNodesContainer() {
		if (!this.nodes_container) {
			const nodes_container = createEl("div", {
				attr: { class: "nodes-container" },
			});
			nodes_container.createEl("div", {
				attr: { class: "nodes-body" },
			});
			this.nodes_container = nodes_container;
		}
		return this.nodes_container;
	}

	static #getFilterSection(
		group: "Document" | "Video" | "Audio" | "Image" | "General"
	) {
		const container = createEl("div", {
			attr: {
				class: "filter-menu-badge-container",
			},
		});
		let filters: NodeFilter[] = [];
		switch (group) {
			case "Document":
				if (this.crafty && this.crafty.nodeFilterState) {
					filters =
						this.crafty.nodeFilterState.getFilterByGroup(
							"Document"
						);
				}
				break;
			case "Image":
				if (this.crafty && this.crafty.nodeFilterState) {
					filters =
						this.crafty.nodeFilterState.getFilterByGroup("Image");
				}
				break;

			case "Audio":
				if (this.crafty && this.crafty.nodeFilterState) {
					filters =
						this.crafty.nodeFilterState.getFilterByGroup("Audio");
				}
				break;

			case "Video":
				if (this.crafty && this.crafty.nodeFilterState) {
					filters =
						this.crafty.nodeFilterState.getFilterByGroup("Video");
				}
				break;

			case "General":
				if (this.crafty && this.crafty.nodeFilterState) {
					filters =
						this.crafty.nodeFilterState.getFilterByGroup("General");
				}
				break;

			default:
				break;
		}

		for (const el of filters) {
			const badge = createEl("div", {
				attr: {
					class: "filter-menu-badge",
				},
			});
			const badge_span = createEl("span", {});
			badge_span.setText(el.title);
			badge.appendChild(badge_span);

			const badge_click_cb = () => {
				if (badge.classList.contains("badge-active")) {
					if (this.crafty && this.crafty.nodeFilterState) {
						this.crafty.nodeFilterState.removeFilter(
							el.title as FILE_TYPE
						);
					}
					badge.classList.remove("badge-active");
				} else {
					if (this.crafty && this.crafty.nodeFilterState) {
						this.crafty.nodeFilterState.addFilter(
							el.title as FILE_TYPE
						);
					}
					badge.classList.add("badge-active");
				}
			};
			badge.addEventListener("click", badge_click_cb);

			this.filter_menu_badge_lister_cb.push(() => {
				badge.removeEventListener("click", badge_click_cb);
			});

			container.appendChild(badge);
		}

		return container;
	}

	static getFilterMenu() {
		if (!this.filter_menu) {
			this.#freeFilterMenuBadgeListeners();
			const filter_menu = createEl("sl-menu", {
				attr: {
					class: "filter-menu",
				},
			});

			//Document
			const general = createEl("div", {
				attr: {
					class: "filter-menu-section",
				},
			});
			const general_title = createEl("span", {});
			general_title.setText("General");
			general.appendChild(general_title);
			general.appendChild(this.#getFilterSection("General"));

			//Document
			const document = createEl("div", {
				attr: {
					class: "filter-menu-section",
				},
			});
			const document_title = createEl("span", {});
			document_title.setText("Documents");
			document.appendChild(document_title);
			document.appendChild(this.#getFilterSection("Document"));

			//Image
			const image = createEl("div", {
				attr: {
					class: "filter-menu-section",
				},
			});
			const image_title = createEl("span", {});
			image_title.setText("Image");
			image.appendChild(image_title);
			image.appendChild(this.#getFilterSection("Image"));

			//Audio
			const audio = createEl("div", {
				attr: {
					class: "filter-menu-section",
				},
			});
			const audio_title = createEl("span", {});
			audio_title.setText("Audio");
			audio.appendChild(audio_title);
			audio.appendChild(this.#getFilterSection("Audio"));

			//Video
			const video = createEl("div", {
				attr: {
					class: "filter-menu-section",
				},
			});
			const video_title = createEl("span", {});
			video_title.setText("Video");
			video.appendChild(video_title);
			video.appendChild(this.#getFilterSection("Image"));

			filter_menu.appendChild(general);
			filter_menu.appendChild(document);
			filter_menu.appendChild(image);
			filter_menu.appendChild(audio);
			filter_menu.appendChild(video);

			this.filter_menu = filter_menu;
		}
		return this.filter_menu;
	}

	static getFiltersButton() {
		if (!this.filter_button) {
			const filter_button = createEl("sl-dropdown", {
				attr: {
					class: "",
					distance: "-40",
					skidding: "-10",
				},
			});

			const expand_button = createEl("button", {
				attr: { class: "filters-button", slot: "trigger" },
			});

			const logo_container = createEl("div", {});
			setIcon(logo_container, "plus");
			const button_text = createEl("span");
			button_text.setText("Filter");

			expand_button.appendChild(logo_container);
			expand_button.appendChild(button_text);

			filter_button.appendChild(expand_button);

			filter_button.appendChild(this.getFilterMenu());

			this.filter_button = filter_button;
		}
		return this.filter_button;
	}

	static getFiltersDisplay() {
		if (!this.filters_display) {
			const filters_display = createEl("div", {
				attr: { class: "filters_display" },
			});

			let filters: NodeFilter[] = [];

			if (this.crafty && this.crafty.nodeFilterState) {
				filters = this.crafty.nodeFilterState.allFilters;
			}

			for (const el of filters) {
				const badge = createEl("div", {
					attr: {
						class: "filter-menu-badge-display",
					},
				});
				const badge_span = createEl("span", {});
				badge_span.setText(el.title);
				badge.appendChild(badge_span);

				if (el.isActive) badge.classList.add("badge-display-active");

				filters_display.appendChild(badge);
			}

			this.filters_display = filters_display;
		}
		return this.filters_display;
	}

	static getFiltersContainer() {
		if (!this.filters_container) {
			const container = createEl("div", {
				attr: {
					class: "filters-container",
				},
			});
			container.appendChild(this.getFiltersDisplay());
			container.appendChild(this.getFiltersButton());

			this.filters_container = container;
		}
		return this.filters_container;
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
		this.#freeSearchBarListeners();
		this.#freeSortMenuListeners();
		this.#freeFilterMenuBadgeListeners();
	}
}
