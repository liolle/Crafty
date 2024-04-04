import { ItemView, Plugin, TFile, WorkspaceLeaf, debounce } from "obsidian";

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
	}

	async onOpen() {
		this.#setBaseLayout();
	}

	async onClose() {
		// Nothing to clean up.
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

		const interval = window.setInterval(async () => {
			if (this.app.workspace.getActiveFile() != null) {
				window.clearInterval(interval);
			}
		}, 300);

		this.registerInterval(interval);

		// Update description
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
		this.node_state.registerObserver(description_listener);

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

				if (rightSplit.collapsed) {
					console.log("open panel");
					rightSplit.expand();
				} else if (!this.detached_panel) {
					rightSplit.collapse();
					console.log("close panel");
					return;
				}
			},
		});
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
		this.node_state?.replace(nodes);
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
				title: el.text || el.file || el.label || "Untitled",
				description: el.description || "",
			});
		}
		return raw_node_map;
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
	}
}
