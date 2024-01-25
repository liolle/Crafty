import { Plugin, ItemView, WorkspaceLeaf, Notice } from "obsidian";

export const VIEW_TYPE_EXAMPLE = "crafty-plugin";

interface CardElement {
	title: string;
	id: string;
}

class ExampleView extends ItemView {
	element_list: CardElement[] = [
		{
			title: "card1",
			id: "t-1",
		},
		{
			title: "card2",
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

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: "default",
};

export default class Crafty extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		// Right panel
		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));

		this.addRibbonIcon("dice", "Sample Plugin", (evt: MouseEvent) => {
			new Notice("This is a notice!");
			this.activateView();
		});
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
			console.log(workspace);

			leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({ type: VIEW_TYPE_EXAMPLE, active: true });
		}

		workspace.revealLeaf(leaf);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
