import {
	ItemView,
	Plugin,
	TAbstractFile,
	WorkspaceLeaf,
	debounce,
} from "obsidian";

import { FSWatcher, watch } from "fs";
import { AttributeObserver } from "observers/observer";
import { DOMHandler } from "dom/handler";

export const VIEW_TYPE_EXAMPLE = "crafty-plugin";

export interface CraftyNode {
	file?: string;
	text?: string;
	label?: string;
	description?: string;
	id: string;
	type: string;
	selected: boolean;
}

class ExampleView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Crafty";
	}

	#setBaseLayout() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h2", { text: "Title" });
	}

	async onOpen() {
		this.#setBaseLayout();
	}

	async onClose() {
		// Nothing to clean up.
	}
}

export default class Crafty extends Plugin {
	state: Map<string, CraftyNode>;
	leaf: WorkspaceLeaf;
	canvasLeaf: WorkspaceLeaf | null;
	html_list: HTMLDivElement | null = null;
	file_watcher: FSWatcher;
	att_observer: AttributeObserver;
	selected_node: Set<string>;
	panel_container: Element;
	async onload() {
		this.state = new Map<string, CraftyNode>();
		this.selected_node = new Set<string>();
		this.att_observer = new AttributeObserver();

		// Right panel
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

		const interval = window.setInterval(async () => {
			if (this.app.workspace.getActiveFile() != null) {
				this.att_observer.observeCanvasNodeClass(this);
				DOMHandler.attachToolTip(this);
				this.trackFileChange();
				this.firstContainerRender();
				window.clearInterval(interval);
			}
		}, 300);

		this.registerInterval(interval);

		app.workspace.onLayoutReady(async () => {
			this.registerEvent(
				this.app.workspace.on(
					"active-leaf-change",
					debounce((leaf) => {
						let canvas_leaf = null;
						this.app.workspace.iterateAllLeaves((leaf) => {
							if (leaf.getViewState().type == "canvas") {
								canvas_leaf = leaf;
								this.canvasLeaf = leaf;
							}
						});

						if (!canvas_leaf) {
							DOMHandler.detachPanelView(this);
							this.canvasLeaf = null;
							return;
						} else {
							DOMHandler.activatePanelView(this);
							this.att_observer.observeCanvasNodeClass(this);
							this.trackFileChange();
							this.updateNodeList();
							DOMHandler.attachToolTip(this);
							DOMHandler.updatePanelDOM(this);
						}
					}, 50)
				)
			);
		});
	}

	async firstContainerRender() {
		const abs_file = app.workspace.getActiveFile();
		if (!abs_file) return;

		const file = this.#absFileToFile(abs_file);

		if (!file || file.extension != "canvas") {
			DOMHandler.detachPanelView(this);
			return;
		}

		DOMHandler.activatePanelView(this);

		this.updateNodeList();
		DOMHandler.updatePanelDOM(this);
	}

	trackFileChange() {
		const file_path = this.CurrentFilePath();

		if (file_path) {
			if (this.file_watcher) this.file_watcher.close();
			this.file_watcher = watch(
				file_path,
				debounce(async (event) => {
					this.updateNodeList();
					DOMHandler.updatePanelDOM(this);
				}, 50)
			);
		}
	}

	CurrentFilePath() {
		const file = app.workspace.getActiveFile();
		if (!file) return;
		//@ts-ignore
		return `${file.vault.adapter.basePath}/${file.path}`;
	}

	extractNodeFromLeaf() {
		const extracted_state: CraftyNode[] = [];

		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type != "canvas") return;
			//@ts-ignore
			const nodes = leaf.view.canvas.data.nodes;
			console.log(nodes);

			if (!nodes) return;
			for (const node of nodes) {
				extracted_state.push({
					file: node.file,
					text: node.text,
					label: node.label,
					id: node.id,
					type: node.type,
					description: node.description,
					selected: this.selected_node.has(node.id),
				});
			}
		});

		return extracted_state;
	}

	updateNodeList() {
		const extracted_state: CraftyNode[] = this.extractNodeFromLeaf();
		this.setNodeList(extracted_state);
	}

	setNodeList(state: CraftyNode[]) {
		this.state.clear();
		for (const node of state) {
			this.state.set(node.id, node);
		}
	}

	#absFileToFile(file: TAbstractFile) {
		const cur_file = app.vault.getFiles();
		return cur_file.find((value) => value.name == file.name);
	}

	onunload() {
		if (this.file_watcher) this.file_watcher.close();
		if (this.att_observer) this.att_observer.disconnect();
	}
}
