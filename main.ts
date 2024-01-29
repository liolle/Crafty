import {
	ItemView,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
	debounce,
} from "obsidian";

import { FSWatcher, watch } from "fs";

export const VIEW_TYPE_EXAMPLE = "crafty-plugin";

interface CanvasNode {
	file: string;
	height: number;
	id: string;
	type: string;
	width: number;
	text?: string;
	x: number;
	y: number;
}

interface CanvasEdge {
	fromNode: string;
	fromSide: string;
	id: string;
	toNode: string;
	toSide: string;
}

interface CanvasState {
	nodes: CanvasNode[];
	edges: CanvasEdge[];
}

interface CraftyNode {
	file?: string;
	id: string;
	text?: string;
	type: string;
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
	async onload() {
		this.state = new Map<string, CraftyNode>();
		await this.loadSettings();

		// Right panel
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			new Notice("This is a notice   !");
			this.activateView();
		});

		const interval = window.setInterval(async () => {
			if (this.app.workspace.getActiveFile() != null) {
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
				this.app.workspace.on("active-leaf-change", async () => {
					this.trackFileChange();
					this.firstContainerRender();
				})
			);
		});
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

		const content = await this.#extractFromFile(file);
		if (!content) return;

		this.updateState(content);

		this.updateContainer();
	}

	trackFileChange() {
		const file_path = this.#CurrentFilePath();

		if (file_path) {
			this.file_watcher = watch(
				file_path,
				debounce(async (event) => {
					const abs_file = app.workspace.getActiveFile();
					if (!abs_file) return;

					const file = this.#absFileToFile(abs_file);
					if (!file) return;
					const content = await this.#extractFromFile(file);
					if (!content) return;

					this.updateState(content);

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
			container.appendChild(
				createEl("div", {
					text: `${this.titleFromNode(node.value)}`,
					cls: ["panel-div"],
				})
			);
		}
	}

	titleFromNode(node: CraftyNode) {
		console.log(node);

		//@ts-ignore
		if (node.type == "text") return node.text;

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

	extractNode(state: CanvasState) {
		const extracted_state: CraftyNode[] = [];
		console.log(state);

		for (const node of state.nodes) {
			extracted_state.push({
				file: node.file,
				text: node.text,
				id: node.id,
				type: node.type,
			});
		}

		return extracted_state;
	}

	updateState(state: CanvasState) {
		const extracted_state: CraftyNode[] = this.extractNode(state);
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

	async #extractFromFile(file: TFile) {
		if (!file || file.extension != "canvas") return;
		const content = await app.vault.cachedRead(file);
		try {
			const file_content: CanvasState = JSON.parse(content);
			return file_content;
		} catch (error) {
			console.log(error);
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		if (this.file_watcher) this.file_watcher.close();
	}
}
