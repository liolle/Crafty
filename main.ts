import "@shoelace-style/shoelace/dist/components/button/button.js";
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
import {
	AttributeObserver,
	NodeObserver,
	NodesState,
} from "observers/observer";

export const VIEW_TYPE = "crafty-plugin";

interface RawNode {
	description: string | undefined;
	file: string | undefined;
	text: string | undefined;
	label: string | undefined;
	url: string | undefined;
	title: string | undefined;
	height: number;
	id: string;
	type: string;
	width: number;
	x: number;
	y: number;
}

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

		tabGroup.createEl("sl-tab-panel", {
			attr: {
				name: "Nodes",
				class: "nodes-body",
			},
		});
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
	private current_file: TFile;
	private current_canvas_leaf: WorkspaceLeaf | null = null;

	async onload() {
		this.node_state = new NodesState();
		this.att_observer = new AttributeObserver();
		this.registerView(VIEW_TYPE, (leaf) => new BaseView(leaf));
		this.node_state = new NodesState();
		DOMHandler.setCraftyInstance(this);
		//initial setup
		this.#updateCurrentFile();

		// Update tooltip
		const description_listener = new NodeObserver(
			debounce(
				(nodes) => {
					for (const node of nodes) {
						if (node.description != "") {
							node.container.setAttribute(
								"aria-label",
								`${node.description}`
							);
						} else {
							node.container.removeAttribute("aria-label");
						}
					}
				},
				200,
				true
			)
		);

		// Update sidebar nodes
		const sidebar_node_listener = new NodeObserver(
			debounce(
				(nodes) => {
					DOMHandler.populateNodes(nodes);
					this.att_observer?.observe(
						this.current_canvas_leaf,
						//@ts-ignore
						this.node_state
					);
				},
				200,
				true
			)
		);

		// Update sidebar description
		const sidebar_description_listener = new NodeObserver(
			debounce(
				(nodes) => {
					const selected_node = this.node_state?.selectedNode;

					if (!selected_node) DOMHandler.showEmptyEdit();
					else DOMHandler.showSelectedNode();
				},
				200,
				true
			)
		);

		this.node_state.registerObserver(description_listener);
		this.node_state.registerObserver(sidebar_node_listener);
		this.node_state.registerObserver(sidebar_description_listener);

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
				if (this.current_file.extension == "canvas") this.#syncNodes();
				this.att_observer?.observe(
					this.current_canvas_leaf,
					//@ts-ignore
					this.node_state
				);
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
			debounce(async (event) => this.#syncNodes(), 200)
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
		)
			return;
		if (!this.node_state) return;
		//@ts-ignore
		const raw_nodes = this.current_canvas_leaf.view.canvas.data.nodes;
		const raw_nodes_map = this.#extractNodeData(raw_nodes);
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
					type: node?.type || "",
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
	#extractNodeData(raw_nodes: RawNode[] | null) {
		if (!raw_nodes || raw_nodes.length < 1) return null;
		const raw_node_map: Map<
			string,
			{
				id: string;
				title: string;
				description: string;
				type: string;
			}
		> = new Map();

		for (const el of raw_nodes) {
			raw_node_map.set(el.id, {
				id: el.id,
				title:
					el.title ||
					this.#createTitle(el.text, el.file, el.label, el.url),
				description: el.description || "",
				type: el.type,
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
}
