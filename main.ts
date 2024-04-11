import { ItemView, Plugin, TFile, WorkspaceLeaf, debounce } from "obsidian";
import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";
import "@shoelace-style/shoelace/dist/components/rating/rating.js";
import "@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js";
import "@shoelace-style/shoelace/dist/components/tab-group/tab-group.js";
import "@shoelace-style/shoelace/dist/components/tab/tab.js";

import { FSWatcher, watch } from "fs";
import {
	AttributeObserver,
	NodeObserver,
	NodesState,
} from "observers/observer";
import { DOMHandler } from "dom/handler";

export const VIEW_TYPE = "crafty-plugin";

interface RawNode {
	description: string | undefined;
	file: string | undefined;
	text: string | undefined;
	label: string | undefined;
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

		for (const tab of ["Edit", "Nodes"]) {
			const tb = tabGroup.createEl("sl-tab", {
				text: tab,
			});
			tb.setAttrs({ slot: "nav", panel: tab });
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

		const edit_header = edit_panel.createEl("div", {
			attr: { class: "description-header-div" },
		});

		edit_panel.createEl("textarea", {
			attr: { class: "description-input" },
		});

		edit_panel.createEl("span", {
			text: "Saved",
			attr: { class: "save_state" },
		});

		edit_header.createEl("span", {
			attr: {},
		});
	}

	async onOpen() {
		this.#setBaseLayout();
	}

	async onClose() {
		console.log("closing");

		DOMHandler.free();
	}
}

export default class Crafty extends Plugin {
	private att_observer: AttributeObserver | null = null;
	private file_watcher: FSWatcher | null = null;

	private node_state: NodesState | null = null;

	private detached_panel = false;
	private current_file: TFile;
	private current_canvas_leaf: WorkspaceLeaf | null = null;

	async onload() {
		this.node_state = new NodesState();
		this.att_observer = new AttributeObserver();
		this.registerView(VIEW_TYPE, (leaf) => new BaseView(leaf));
		this.node_state = new NodesState();
		//initial setup
		this.#updateCurrentFile();

		// Update tooltip
		const description_listener = new NodeObserver(
			debounce(
				(nodes) => {
					for (const node of nodes) {
						if (node.description != "")
							node.container.setAttribute(
								"aria-label",
								`${node.description}`
							);
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
					if (!selected_node) return;
					else
						DOMHandler.showSelectedNode(
							selected_node,
							this.app.vault,
							this.current_file
						);
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
				this.node_state.next();
			},
		});

		this.addCommand({
			id: "prev-node",
			name: "Prev node",
			callback: () => {
				if (!this.node_state) return;
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
					this.activateView();
					if (rightSplit.collapsed) rightSplit.expand();
				} else {
					this.closeView();
				}
			},
		});
	}

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
		this.detached_panel = false;
		workspace.revealLeaf(leaf);
	}

	async closeView() {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);
		if (leaves.length < 1) return;
		leaves[0].detach();
		this.detached_panel = true;
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

	#syncNodes() {
		if (
			!this.current_canvas_leaf ||
			//@ts-ignore
			!this.current_canvas_leaf.view.canvas
		)
			return;
		//@ts-ignore
		const raw_nodes = this.current_canvas_leaf.view.canvas.data.nodes;
		const raw_nodes_map = this.#extractNodeData(raw_nodes);
		if (!raw_nodes_map) return;

		const nodes = Array.from(
			//@ts-ignore
			this.current_canvas_leaf.view.canvas.nodes,
			([key, val]) => {
				const node = raw_nodes_map.get(key);

				return {
					id: key,
					title: node?.title || "Untitled",
					description: node?.description || "",
					selected: false,
					container: val.nodeEl,
				};
			}
		);
		if (!this.node_state) return;
		this.node_state.replace(nodes);
	}

	#extractNodeData(raw_nodes: RawNode[] | null) {
		if (!raw_nodes || raw_nodes.length < 1) return null;
		const raw_node_map: Map<
			string,
			{
				id: string;
				title: string;
				description: string;
			}
		> = new Map();

		for (const el of raw_nodes) {
			raw_node_map.set(el.id, {
				id: el.id,
				title: this.#createTitle(el.text, el.file, el.label),
				description: el.description || "",
			});
		}
		return raw_node_map;
	}

	#createTitle(
		text: string | undefined,
		file: string | undefined,
		label: string | undefined
	) {
		if (!text && !file && !label) return "Untitled";
		if (!text && !file) return label || "Untitled";
		if (!file && !label) return text || "Untitled";
		if (!text && !label) return file?.split("/").pop() || "Untitled";
		return "Untitled";
	}

	// Getters
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
}
