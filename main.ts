import {
	ItemView,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
} from "obsidian";

export const VIEW_TYPE_EXAMPLE = "crafty-plugin";

interface CardElement {
	title: string;
	id: string;
}

interface CanvasNode {
	file: string;
	height: number;
	id: string;
	type: string;
	width: number;
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
	file: string;
	id: string;
	type: string;
}

class ExampleView extends ItemView {
	element_list: CardElement[] = [
		{
			title: "card1",
			id: "t-1",
		},
		{
			title: "car d2",
			id: "t-2",
		},
	];
	html_list: HTMLDivElement | null = null;
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Crafty";
	}

	// probably need optimizations
	updateContainer() {
		const container = this.html_list;
		if (!container) return;
		for (const elem of this.element_list) {
			container.createEl("div", {
				text: `${elem.title}`,
				cls: ["panel-div"],
			});
		}
	}

	// probably need optimizations
	pushElements(elem: CardElement) {
		this.element_list.push(elem);
		this.updateContainer();
	}

	// probably need optimizations
	removeElement(id: string) {
		const idx = this.element_list.findIndex((value) => value.id == id);
		if (idx < 0) return;
		this.element_list.splice(idx, 1);
		this.updateContainer();
	}

	#setBaseLayout() {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl("h2", { text: "Title" });
		this.html_list = container.createEl("div", { cls: ["list-container"] });
	}

	async onOpen() {
		this.#setBaseLayout();
		this.updateContainer();
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
	async onload() {
		this.state = new Map<string, CraftyNode>();
		await this.loadSettings();

		// Right panel
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			new Notice("This is a no tice!");
			this.activateView();
		});

		app.workspace.onLayoutReady(async () => {
			this.registerEvent(
				this.app.workspace.on("active-leaf-change", async () => {
					const abs_file = app.workspace.getActiveFile();
					if (!abs_file) return;

					const file = this.#absFileToFile(abs_file);
					if (!file) return;

					const content = await this.#extractFromFile(file);
					if (!content) return;

					const extracted_state: CraftyNode[] =
						this.extractNode(content);
					this.setState(extracted_state);
				})
			);

			this.registerEvent(
				this.app.vault.on("modify", async (abs_file) => {
					const file = this.#absFileToFile(abs_file);
					if (!file) return;
					const content = await this.#extractFromFile(file);
					if (!content) return;
					this.updateState(content);
				})
			);
		});
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		workspace.revealLeaf(leaf);
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

		for (const node of state.nodes) {
			extracted_state.push({
				file: node.file,
				id: node.id,
				type: node.type,
			});
		}

		return extracted_state;
	}

	updateState(state: CanvasState) {
		const extracted_state: CraftyNode[] = this.extractNode(state);

		const modified = state.nodes.length != this.state.size;
		if (!modified) return;

		for (const node of extracted_state) {
			if (!this.state.has(node.id)) {
				console.log("need update view");

				this.setState(extracted_state);
				break;
			}
		}
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

	onunload() {}
}
