import { ItemView, Plugin, WorkspaceLeaf, debounce } from "obsidian";

import { DOMHandler } from "dom/handler";
import { FSWatcher, watch } from "fs";
import { AttributeObserver } from "observers/observer";
import { NodeState } from "states/handler";

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
	state: Map<string, CraftyNode> | null = null;
	selected_node: Set<string> | null = null;

	leaf: WorkspaceLeaf | null = null;
	canvasLeaf: WorkspaceLeaf | null = null;

	att_observer: AttributeObserver | null = null;
	node_state: NodeState | null = null;
	file_watcher: FSWatcher | null = null;

	partial_update = false;
	detached_panel = false;
	current_file: string;

	async onload() {
		this.state = new Map<string, CraftyNode>();
		this.selected_node = new Set<string>();
		this.att_observer = new AttributeObserver();
		this.registerView(VIEW_TYPE, (leaf) => new BaseView(leaf));

		const interval = window.setInterval(async () => {
			if (this.app.workspace.getActiveFile() != null) {
				if (this.att_observer) {
					this.att_observer.observeCanvasNodeClass(this);
				}
				DOMHandler.attachToolTip(this);
				this.trackFileChange();
				this.#firstContainerRender();
				window.clearInterval(interval);
			}
		}, 300);

		this.registerInterval(interval);

		this.app.workspace.onLayoutReady(async () => {
			this.registerEvent(
				this.app.workspace.on(
					"active-leaf-change",
					debounce((leaf) => {
						if (this.partial_update) {
							this.partial_update = false;
							return;
						}
						const current_file = this.app.workspace.getActiveFile();
						this.#updateCanvasLeaf(leaf);

						if (
							!current_file ||
							current_file.extension != "canvas"
						) {
							this.current_file = "";
							DOMHandler.showPlaceholderView(this);
							return;
						}
						if (this.current_file != current_file.name) {
							this.selected_node?.clear();
						}
						this.current_file = current_file.name;
						this.updateNodeList();

						if (!this.node_state) {
							this.node_state = new NodeState(this);
						} else {
							this.node_state.resetNavigation();
						}

						this.trackFileChange();
						DOMHandler.attachToolTip(this);
						DOMHandler.updatePanelDOM(this);
						if (this.att_observer) {
							this.att_observer.observeCanvasNodeClass(this);
						}
					}, 200) // avoid multiple active-leaf trigger for the same event
				)
			);
		});

		this.addCommand({
			id: "next-node",
			name: "Next node",
			callback: () => {
				if (!this.node_state) return;
				const next_node = this.node_state.next();
				if (next_node) {
					next_node.container?.click();
				}
			},
		});

		this.addCommand({
			id: "prev-node",
			name: "Prev node",
			callback: () => {
				if (!this.node_state) return;
				const next_node = this.node_state.prev();
				if (next_node) {
					next_node.container?.click();
				}
			},
		});

		this.addCommand({
			id: "show-panel",
			name: "Show Panel",
			callback: async () => {
				//@ts-ignore
				const rightSplit = this.app.workspace.rightSplit;

				if (rightSplit.collapsed) {
					await DOMHandler.closePanelView(this);
				} else if (!this.detached_panel) {
					await DOMHandler.closePanelView(this);
					rightSplit.collapse();
					return;
				}
				await DOMHandler.activatePanelView(this);
				await DOMHandler.updatePanelDOM(this);
			},
		});
	}

	async #firstContainerRender() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;

		if (file.extension != "canvas") {
			DOMHandler.showPlaceholderView(this);
			return;
		}

		if (!this.node_state) {
			this.node_state = new NodeState(this);
		} else {
			this.node_state.resetNavigation();
		}

		this.updateNodeList();
		await DOMHandler.activatePanelView(this);
		await DOMHandler.updatePanelDOM(this);
	}

	changeLeafFocus(leaf: WorkspaceLeaf | null, partial: boolean) {
		if (!leaf) return;
		this.partial_update = partial;
		this.app.workspace.setActiveLeaf(leaf);
	}

	trackFileChange() {
		const file_path = this.CurrentFilePath();

		if (file_path) {
			if (this.file_watcher) this.file_watcher.close();
			this.file_watcher = watch(
				file_path,
				debounce(async (event) => {
					this.updateNodeList();
					if (this.node_state) {
						this.node_state.resetNavigation();
					}
					if (this.att_observer) {
						this.att_observer.observeCanvasNodeClass(this);
					}
				}, 200)
			);
		}
	}

	async createPanelLeaf() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(true);
			await leaf.setViewState({
				type: VIEW_TYPE,
				active: true,
			});
			return leaf;
		}
		this.leaf = leaf;
	}

	CurrentFilePath() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		//@ts-ignore
		return `${file.vault.adapter.basePath}/${file.path}`;
	}

	#updateCanvasLeaf(leaf: WorkspaceLeaf | null) {
		if (!leaf || leaf.getViewState().type != "canvas") return;
		this.canvasLeaf = leaf;
	}

	CurrentLeaf() {
		return this.canvasLeaf;
	}

	extractNodeFromLeaf() {
		const extracted_state: CraftyNode[] = [];
		const leaf = this.CurrentLeaf();

		//@ts-ignore
		if (!leaf || leaf.getViewState().type != "canvas")
			return extracted_state;

		//@ts-ignore
		const nodes = leaf.view.canvas.data.nodes;

		if (!nodes) return extracted_state;
		for (const node of nodes) {
			extracted_state.push({
				file: node.file,
				text: node.text,
				label: node.label,
				id: node.id,
				type: node.type,
				description: node.description,
				selected: this.selected_node?.has(node.id) || false,
			});
		}
		return extracted_state;
	}

	updateNodeList() {
		const extracted_state: CraftyNode[] = this.extractNodeFromLeaf();
		this.setNodeList(extracted_state);
	}

	setNodeList(state: CraftyNode[]) {
		if (!this.state) return;
		this.state.clear();
		for (const node of state) {
			this.state.set(node.id, node);
		}
	}

	onunload() {
		if (this.file_watcher) this.file_watcher.close();
		if (this.att_observer) this.att_observer.disconnect();
	}
}
