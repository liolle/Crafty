import { ItemView, Plugin, TFile, WorkspaceLeaf, debounce } from "obsidian";

import { FSWatcher, watch } from "fs";
import { AttributeObserver, NodesState } from "observers/observer";

export const VIEW_TYPE = "crafty-plugin";

export interface CraftyNode {
	file?: string;
	text?: string;
	label?: string;
	description?: string;
	id: string;
	type: "text" | "file" | "group";
	selected: boolean;
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
	private state: Map<string, CraftyNode> | null = null;
	private selected_node: Set<string> | null = null;

	leaf: WorkspaceLeaf | null = null;
	private panel: WorkspaceLeaf | null = null;

	private att_observer: AttributeObserver | null = null;
	private file_watcher: FSWatcher | null = null;

	private node_state: NodesState | null = null;

	partial_update = false;
	private detached_panel = false;
	private current_file: TFile;
	private current_canvas_leaf: WorkspaceLeaf | null = null;

	async onload() {
		this.state = new Map<string, CraftyNode>();
		this.selected_node = new Set<string>();
		this.att_observer = new AttributeObserver();
		this.node_state = new NodesState();
		this.registerView(VIEW_TYPE, (leaf) => new BaseView(leaf));
		//initial setup
		this.#updateCurrentFile();

		const interval = window.setInterval(async () => {
			if (this.app.workspace.getActiveFile() != null) {
				window.clearInterval(interval);
			}
		}, 300);

		this.registerInterval(interval);

		this.app.workspace.onLayoutReady(async () => {});

		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				if (!leaf) return;
				const view_state = leaf.getViewState();
				if (view_state.type != "canvas") return;
				if (leaf == this.current_canvas_leaf) return;
				console.log("Inner tab changed");
				this.#updateCurrentLeaf(leaf);
				this.#trackFileChange(null);
				this.att_observer?.observe(this.current_canvas_leaf);
			})
		);

		this.registerEvent(
			this.app.workspace.on("layout-change", () => {
				console.log("file changed");
				this.#updateCurrentFile();
				this.#trackFileChange(null);
				this.att_observer?.observe(this.current_canvas_leaf);
			})
		);

		this.addCommand({
			id: "next-node",
			name: "Next node",
			callback: () => {
				console.log("next node");
			},
		});

		this.addCommand({
			id: "prev-node",
			name: "Prev node",
			callback: () => {
				console.log("prev node");
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

	changeLeafFocus(leaf: WorkspaceLeaf | null, partial: boolean) {
		if (!leaf) return;
		this.partial_update = partial;
		this.app.workspace.setActiveLeaf(leaf);
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
	#updateCurrentLeaf(leaf: WorkspaceLeaf) {
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
			debounce(async (event) => {
				this.app.workspace.iterateAllLeaves((leaf) => {
					const view_state = leaf.getViewState();
					if (
						view_state.type != "canvas" ||
						leaf != this.current_canvas_leaf
					)
						return;

					console.log(event, leaf);

					//TODO Update NodesState
				});
			}, 200)
		);
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
