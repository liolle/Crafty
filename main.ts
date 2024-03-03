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
	type: string;
	selected: boolean;
}

class BaseView extends ItemView {
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

	html_list: HTMLDivElement | null = null;

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
						const current_file = this.app.workspace.getActiveFile();

						if (
							!current_file ||
							current_file.extension != "canvas"
						) {
							this.current_file = "";
							DOMHandler.detachPanelView(this);
							this.canvasLeaf = null;
							return;
						}

						if (this.current_file == current_file.name) return;
						this.current_file = current_file.name;

						this.canvasLeaf = this.CurrentLeaf();
						DOMHandler.activatePanelView(this);
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
					}, 100)
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
	}

	async #firstContainerRender() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;

		if (file.extension != "canvas") {
			DOMHandler.detachPanelView(this);
			return;
		}

		if (!this.node_state) {
			this.node_state = new NodeState(this);
		} else {
			this.node_state.resetNavigation();
		}

		this.updateNodeList();
		DOMHandler.activatePanelView(this);
		await DOMHandler.updatePanelDOM(this);
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
					DOMHandler.updatePanelDOM(this);
					if (this.att_observer) {
						this.att_observer.observeCanvasNodeClass(this);
					}
				}, 50)
			);
		}
	}

	CurrentFilePath() {
		const file = this.app.workspace.getActiveFile();
		if (!file) return;
		//@ts-ignore
		return `${file.vault.adapter.basePath}/${file.path}`;
	}

	CurrentLeaf() {
		let outputLeaf: WorkspaceLeaf | null = null;
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (this.current_file) {
				if (
					leaf.getViewState().type == "canvas" &&
					//@ts-ignore
					leaf.view.file.name == this.current_file
				) {
					outputLeaf = leaf;
					return;
				}
			} else {
				outputLeaf = leaf;
				return;
			}
		});
		return outputLeaf;
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
		if (this.html_list) DOMHandler.clearPanelEventAll(this);
	}
}
