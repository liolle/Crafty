import {
	ItemView,
	Notice,
	Plugin,
	TAbstractFile,
	WorkspaceLeaf,
	debounce,
} from "obsidian";

import { FSWatcher, watch } from "fs";

export const VIEW_TYPE_EXAMPLE = "crafty-plugin";

interface CraftyNode {
	file?: string;
	id: string;
	text?: string;
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
		// this.updateContainer();
	}

	async onClose() {
		// Nothing to clean up.
	}
}

interface ExamplePluginSettings {
	dateFormat: string;
}

const DEFAULT_SETTINGS: Partial<ExamplePluginSettings> = {
	dateFormat: "YYYY-MM-DD",
};

export default class Crafty extends Plugin {
	panel_view: ExampleView | null;
	settings: ExamplePluginSettings;
	state: Map<string, CraftyNode>;
	leaf: WorkspaceLeaf;
	html_list: HTMLDivElement | null = null;
	file_watcher: FSWatcher;
	mutation_observer: MutationObserver;
	selected_node: Set<string>;
	async onload() {
		this.state = new Map<string, CraftyNode>();
		this.selected_node = new Set<string>();
		await this.loadSettings();

		// Right panel
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			new Notice("This is a notice ");
			this.activateView();
		});

		const interval = window.setInterval(async () => {
			if (this.app.workspace.getActiveFile() != null) {
				this.observeCanvasNodeClass();
				this.trackFileChange();
				this.firstContainerRender();
				window.clearInterval(interval);
			}
		}, 300);

		this.registerInterval(interval);

		app.workspace.onLayoutReady(async () => {
			this.trackFileChange();
			const abs_file = app.workspace.getActiveFile();
			if (!abs_file) return;

			this.registerEvent(
				this.app.workspace.on("active-leaf-change", async (leaf) => {
					if (!leaf || leaf.getViewState().type != "canvas") return;
					this.observeCanvasNodeClass();
					this.trackFileChange();
					this.firstContainerRender();
				})
			);
		});
	}

	observeCanvasNodeClass() {
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type != "canvas") return;
			//@ts-ignore
			const canvas_nodes: HTMLElement[] =
				leaf.view.containerEl.querySelectorAll(".canvas-node");

			for (const node of canvas_nodes) {
				this.observeNodeClass(node, leaf);
			}
		});
	}

	observeNodeClass(target: HTMLElement, leaf: WorkspaceLeaf) {
		const config = { attributes: true, attributeFilter: ["class"] };
		if (!this.mutation_observer) {
			this.mutation_observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					const nodes = Array.from(leaf.view.canvas.selection);
					this.selected_node.clear();
					for (const elem of nodes) {
						this.selected_node.add(elem.id);
					}
					this.updateState();
					this.updateContainer();
				});
			});
		}
		this.mutation_observer.observe(target, config);
	}

	async firstContainerRender() {
		const abs_file = app.workspace.getActiveFile();
		if (!abs_file) return;

		const file = this.#absFileToFile(abs_file);

		if (!file || file.extension != "canvas") {
			this.detachView();
			return;
		}

		this.activateView();

		this.updateState();
		this.updateContainer();
	}

	trackFileChange() {
		const file_path = this.#CurrentFilePath();

		if (file_path) {
			if (this.file_watcher) this.file_watcher.close();
			this.file_watcher = watch(
				file_path,
				debounce(async (event) => {
					this.updateState();
					this.updateContainer();
				}, 50)
			);
		}
	}

	#CurrentFilePath() {
		const file = app.workspace.getActiveFile();
		if (!file) return;
		//@ts-ignore
		return `${file.vault.adapter.basePath}/${file.path}`;
	}

	updateContainer() {
		const container = this.html_list;
		if (!container) return;

		const nodes = Array.from(this.state, ([name, value]) => ({
			name,
			value,
		}));

		container.empty();

		for (const node of nodes) {
			const cls = [];
			cls.push("panel-div");
			if (node.value.selected) {
				cls.push("active-panel-div");
			}
			container.appendChild(
				createEl("div", {
					text: `${this.titleFromNode(node.value)}`,
					cls: cls,
				})
			);
		}
	}

	titleFromNode(node: CraftyNode) {
		//@ts-ignore
		if (node.type == "text") {
			if (!node.text || /^\s*$/.test(node.text)) return "...";
			return node.text;
		}

		if (node.type == "file") return node.file;
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
		this.leaf = leaf;

		const container = this.leaf.view.containerEl.children[1];
		container.empty();
		container.createEl("h2", { text: "Title" });
		this.html_list = container.createEl("div", { cls: ["list-container"] });

		workspace.revealLeaf(this.leaf);
	}

	async detachView() {
		const { workspace } = this.app;
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({
				type: VIEW_TYPE_EXAMPLE,
				active: true,
			});
		}
		this.leaf = leaf;

		const container = this.leaf.view.containerEl.children[1];
		container.empty();
		const div = container.createEl("div", {
			cls: ["place-holder-container"],
		});

		div.createEl("div", {
			text: "placeholder",
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	extractNode() {
		const extracted_state: CraftyNode[] = [];

		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type != "canvas") return;
			//@ts-ignore
			const nodes = leaf.view.canvas.data.nodes;
			//@ts-ignore
			// const selection = leaf.view.canvas.selection;

			//@ts-ignore

			for (const node of nodes) {
				extracted_state.push({
					file: node.file,
					text: node.text,
					id: node.id,
					type: node.type,
					selected: this.selected_node.has(node.id),
				});
			}
		});

		return extracted_state;
	}

	updateState() {
		const extracted_state: CraftyNode[] = this.extractNode();
		this.setState(extracted_state);
	}

	setState(state: CraftyNode[]) {
		this.state.clear();
		for (const node of state) {
			this.state.set(node.id, node);
		}
	}

	#absFileToFile(file: TAbstractFile) {
		const cur_file = app.vault.getFiles();
		return cur_file.find((value) => value.name == file.name);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		if (this.file_watcher) this.file_watcher.close();
		if (this.mutation_observer) this.mutation_observer.disconnect();
	}
}
