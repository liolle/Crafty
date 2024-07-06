import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dropdown/dropdown.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/rating/rating.js";
import "@shoelace-style/shoelace/dist/components/tab-group/tab-group.js";
import "@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js";
import "@shoelace-style/shoelace/dist/components/tab/tab.js";
import "@shoelace-style/shoelace/dist/themes/light.css";
import { ItemView, Plugin, TFile, WorkspaceLeaf, debounce } from "obsidian";

import { DOMHandler } from "dom/handler";
import { FSWatcher, watch } from "fs";
import { CraftyNode, FILE_TYPE, NODE_TYPE } from "nodes/nodes";
import {
	AttributeObserver,
	NodeFilterObserver,
	NodeObserver,
	NodesFilterState,
	NodesState,
} from "observers/observer";

export const VIEW_TYPE = "crafty-plugin";

export class BaseView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "Crafty";
	}

	#setBaseLayout() {
		const container = this.containerEl.children[1];
		container.empty();
		const tabGroup = container.createEl("sl-tab-group", {
			cls: ["side-bar-nav"],
		});

		const tabs = [];

		for (const tab of ["Edit", "Nodes"]) {
			const tb = tabGroup.createEl("sl-tab", {
				text: tab,
			});
			tb.setAttrs({ slot: "nav", panel: tab });
			tabs.push(tb);
		}

		//Nodes tab
		const node_list = tabGroup.createEl("sl-tab-panel", {
			attr: {
				name: "Nodes",
			},
		});

		const nodes_panel = node_list.createEl("div", {
			attr: { class: "nodes-panel " },
		});

		const search_area = nodes_panel.createEl("div", {
			attr: { class: "search-area" },
		});

		const search_bar_row = createEl("div", {
			attr: { class: "search-bar-row" },
		});

		const filter_row = createEl("div", {
			attr: { class: "filter-row" },
		});

		const search_bar = DOMHandler.getSearchBar();
		const sort_button = DOMHandler.getSortButton();
		search_bar_row.appendChild(search_bar);
		search_bar_row.appendChild(sort_button);

		const filters_container = DOMHandler.getFiltersContainer();
		filter_row.appendChild(filters_container);

		search_area.appendChild(search_bar_row);
		search_area.appendChild(filter_row);

		const nodes_container = DOMHandler.getNodesContainer();
		nodes_panel.appendChild(nodes_container);

		//Edit tab
		const edit_panel = tabGroup.createEl("sl-tab-panel", {
			attr: {
				name: "Edit",
				class: "description-body",
			},
		});

		// Edit Node Title
		const edit_header = edit_panel.createEl("div", {
			attr: { class: "description-header-div" },
		});

		const edit_header_display = DOMHandler.getTitleDisplay();
		const edit_header_input = DOMHandler.getTitleInput();
		edit_header.appendChild(edit_header_display);
		edit_header.appendChild(edit_header_input);

		// Edit Node Description
		const text_area = DOMHandler.getTextArea();
		const save_state = DOMHandler.getSaveState();
		edit_panel.appendChild(text_area);
		edit_panel.appendChild(save_state);
	}

	async onOpen() {
		this.#setBaseLayout();
	}

	async onClose() {
		DOMHandler.free();
	}
}

export default class Crafty extends Plugin {
	private att_observer: AttributeObserver | null = null;
	private file_watcher: FSWatcher | null = null;

	private node_state: NodesState | null = null;
	private node_filter_state: NodesFilterState | null = null;
	private current_file: TFile;
	private current_canvas_leaf: WorkspaceLeaf | null = null;

	GLOBAL_CD = 100;

	async onload() {
		this.node_state = new NodesState();
		this.att_observer = new AttributeObserver();
		this.registerView(VIEW_TYPE, (leaf) => new BaseView(leaf));
		this.node_state = new NodesState();
		this.node_filter_state = new NodesFilterState();
		DOMHandler.setCraftyInstance(this);
		//initial setup
		this.#updateCurrentFile();

		// Filter nodes
		const filter_listener = new NodeFilterObserver((filters) => {
			const filters_display = DOMHandler.getFiltersDisplay();
			const badges = filters_display.querySelectorAll(
				".filter-menu-badge-display"
			);

			//@ts-ignore
			for (const badge of badges) {
				badge.classList.remove("badge-display-active");
				const span = badge.querySelector("span") as HTMLSpanElement;
				const value = span.getText();
				const filter = filters.find((val) => val.title == value);
				if (filter && filter.isActive)
					badge.classList.add("badge-display-active");
			}

			if (this.nodeState) {
				this.nodeState.setFilters(
					filters.filter((val) => val.isActive)
				);
			}
		});

		// Update tooltip
		const description_listener = new NodeObserver(
			debounce(
				(nodes) => {
					if (!this.node_state) return;
					const all_nodes = this.node_state.allNodes;

					for (const node of all_nodes) {
						if (!node.container) continue;
						if (node.description != "") {
							node.container.setAttribute(
								"aria-label",
								`${node.description}`
							);
						} else {
							node.container?.removeAttribute("aria-label");
						}
					}
				},
				this.GLOBAL_CD,
				true
			)
		);

		// Update sidebar nodes
		const sidebar_node_listener = new NodeObserver(
			debounce(
				(nodes) => {
					DOMHandler.populateNodes(nodes);
					if (!this.att_observer) return;
					this.att_observer.observe(
						this.current_canvas_leaf,
						//@ts-ignore
						this.node_state
					);
				},
				this.GLOBAL_CD,
				true
			)
		);

		// Update sidebar description
		const sidebar_description_listener = new NodeObserver(
			debounce(
				(nodes) => {
					if (!this.node_state) return;
					if (!this.node_state.selectedNode)
						DOMHandler.showEmptyEdit();
					else DOMHandler.showSelectedNode();
				},
				this.GLOBAL_CD,
				true
			)
		);

		this.node_state.registerObserver(description_listener);
		this.node_state.registerObserver(sidebar_node_listener);
		this.node_state.registerObserver(sidebar_description_listener);

		this.node_filter_state.registerObserver(filter_listener);

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (!leaf) return;
				const view_state = leaf.getViewState();
				if (view_state.type != "canvas") return;
				if (leaf == this.current_canvas_leaf) return;
				this.#updateCurrentFile();
				this.#updateCurrentLeaf(null);
				this.#trackFileChange(null);
				if (this.current_file.extension == "canvas") this.#syncNodes();
				this.att_observer?.observe(
					this.current_canvas_leaf,
					//@ts-ignore
					this.node_state
				);
			})
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				this.#updateCurrentFile();
				this.#updateCurrentLeaf(null);
				this.#trackFileChange(null);

				if (this.current_file.extension == "canvas") {
					this.#syncNodes();
					this.att_observer?.observe(
						this.current_canvas_leaf,
						//@ts-ignore
						this.node_state
					);
					DOMHandler.showSelectedNode();
					DOMHandler.showNodes();
				} else {
					DOMHandler.showEmptyEdit();
					DOMHandler.showEmptyNodes();
				}
			})
		);

		this.addCommand({
			id: "next-node",
			name: "Next node",
			callback: () => {
				if (!this.node_state) return;
				DOMHandler.hideTitle();
				this.node_state.next();
			},
		});

		this.addCommand({
			id: "prev-node",
			name: "Prev node",
			callback: () => {
				if (!this.node_state) return;
				DOMHandler.hideTitle();
				this.node_state.previous();
			},
		});

		this.addCommand({
			id: "show-panel",
			name: "Show Panel",
			callback: async () => {
				//@ts-ignore
				const rightSplit = this.app.workspace.rightSplit;
				const sidebar_leaf = this.sidebarLeaf;

				if (rightSplit.collapsed || !sidebar_leaf) {
					setTimeout(() => {
						this.activateView();
					}, 50);
					if (rightSplit.collapsed) rightSplit.expand();
				} else {
					this.closeView();
				}
			},
		});
	}
	/**
	 * Show sidebar
	 */
	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE, active: true });
		}
		workspace.revealLeaf(leaf);
		this.#updateCurrentFile();
		this.#updateCurrentLeaf(null);
		this.#trackFileChange(null);
		this.#syncNodes();
	}

	/**
	 * Hide sidebar
	 */
	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);
		if (leaves.length < 1) return;
		leaves[0].detach();
	}

	get sidebarLeaf() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);
		if (leaves.length < 1) return;
		return leaves[0];
	}

	/**
	 * Set current_file to current activeFile
	 * @returns void
	 */
	#updateCurrentFile() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		this.current_file = file;
	}

	/**
	 * Set current_canvas_leaf to leaf if leaf is a canvas
	 * @param {WorkspaceLeaf} leaf
	 */
	#updateCurrentLeaf(leaf: WorkspaceLeaf | null) {
		if (!leaf) {
			this.app.workspace.iterateAllLeaves((leaf) => {
				const view_state = leaf.getViewState();
				if (view_state.type != "canvas") return;
				//@ts-ignore
				const classList = leaf.containerEl.classList;
				if (!/mod-active/.test(classList.value)) return;
				this.current_canvas_leaf = leaf;
			});
			return;
		}
		const view_state = leaf.getViewState();
		if (view_state.type != "canvas") return;
		this.current_canvas_leaf = leaf;
	}

	/**
	 * @param {TFile} file
	 * Use FSWatcher to listen for change in file
	 */
	#trackFileChange(file: TFile | null) {
		if (!file && !this.current_file) return;
		if (!file) file = this.current_file;

		//@ts-ignore
		const path = `${file.vault.adapter.basePath}/${file.path}`;
		if (this.file_watcher) this.file_watcher.close();
		this.file_watcher = watch(
			path,
			debounce(async (event) => this.#syncNodes(), this.GLOBAL_CD)
		);
	}

	/**
	 * Extract nodes content from canvas data and update the current the NodesState.
	 * @returns
	 */
	#syncNodes() {
		if (
			!this.current_canvas_leaf ||
			//@ts-ignore
			!this.current_canvas_leaf.view.canvas
		) {
			return;
		}

		if (!this.node_state) return;
		//@ts-ignore
		const canvas_data = this.current_canvas_leaf.view.canvas;
		const raw_nodes_map = this.#extractNodeData(canvas_data);

		const selection = Array.from(
			//@ts-ignore
			this.current_canvas_leaf.view.canvas.selection
			//@ts-ignore
		).map((val) => val.id);

		if (!raw_nodes_map) {
			this.node_state.replace([]);
			this.node_state.selectNodes([]);
			return;
		}
		const nodes = Array.from(
			//@ts-ignore
			this.current_canvas_leaf.view.canvas.nodes,
			//@ts-ignore
			([key, val]) => {
				const node = raw_nodes_map.get(key);

				return {
					id: key,
					title: node?.title || "Untitled",
					description: node?.description || "",
					selected: selection.includes(key),
					container: val.nodeEl,
					type: (node?.type || "") as NODE_TYPE,
					extension: (node?.extension || "") as FILE_TYPE,
					created_at: node?.created_at || 0,
					last_modified: node?.last_modified || 0,
				};
			}
		);

		this.node_state.replace(nodes);
		this.node_state.selectNodes(selection);
	}

	/**
	 * Extract and format id, title and description from  raw_nodes
	 * @param raw_nodes
	 * @returns Map<string,CraftyNode>
	 */
	#extractNodeData(canvas: object) {
		const raw_node_map: Map<string, CraftyNode> = new Map();
		if (!canvas) return raw_node_map;

		//@ts-ignore
		const data = canvas.data.nodes;

		//@ts-ignore
		const stats = canvas.nodes;

		for (const el of data) {
			const file_stats = stats.get(el.id).file;

			raw_node_map.set(el.id, {
				id: el.id,
				title:
					el.title ||
					this.#createTitle(el.text, el.file, el.label, el.url),
				description: el.description || "",
				type: el.type,
				extension: el.file ? el.file.split(".").pop() || "" : "",
				created_at: file_stats ? file_stats.stat.ctime : 0,
				last_modified: file_stats ? file_stats.stat.mtime : 0,
				selected: false,
				container: null,
			});
		}
		return raw_node_map;
	}

	/**
	 * Create default tile for nodes.
	 * @param {string | undefined} text
	 * @param {string | undefined} file
	 * @param {string | undefined} label
	 * @param {string | undefined} url
	 * @returns
	 */
	#createTitle(
		text: string | undefined,
		file: string | undefined,
		label: string | undefined,
		url: string | undefined
	) {
		if (file != undefined) return file?.split("/").pop() || "Untitled";
		return text || label || url || "Untitled";
	}

	getFileObserver(): FSWatcher | null {
		return this.file_watcher;
	}

	getAttributeObserver(): AttributeObserver | null {
		return this.att_observer;
	}

	onunload() {
		if (this.file_watcher) this.file_watcher.close();
		if (this.att_observer) this.att_observer.disconnect();
		DOMHandler.free();
	}

	get vault() {
		return this.app.vault;
	}

	get selectedNode() {
		if (!this.node_state) return null;
		return this.node_state.selectedNode;
	}

	get currentFile() {
		return this.current_file;
	}

	get nodeState() {
		return this.node_state;
	}

	get nodeFilterState() {
		return this.node_filter_state;
	}
}
