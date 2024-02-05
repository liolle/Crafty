import { DOMHandler } from "dom/handler";
import Crafty from "main";
import { WorkspaceLeaf } from "obsidian";

export class AttributeObserver {
	observer: MutationObserver;

	observeCanvasNodeClass(plugin: Crafty) {
		plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type != "canvas") return;

			//@ts-ignore
			const canvas_nodes: HTMLElement[] =
				leaf.view.containerEl.querySelectorAll(".canvas-node");
			for (const node of canvas_nodes) {
				this.#observeNodeClass(node, leaf, plugin);
			}
		});
	}

	#observeNodeClass(
		target: HTMLElement,
		leaf: WorkspaceLeaf,
		plugin: Crafty
	) {
		const config = { attributes: true, attributeFilter: ["class"] };
		if (!this.observer) {
			this.observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					//@ts-ignore
					const nodes = Array.from(leaf.view.canvas.selection);
					//@ts-ignore

					plugin.selected_node.clear();
					for (const elem of nodes) {
						//@ts-ignore
						plugin.selected_node.add(elem.id);
					}
					plugin.updateNodeList();
					DOMHandler.updatePanelDOM(plugin);
				});
			});
		}
		this.observer.observe(target, config);
	}

	disconnect() {
		if (this.observer) this.observer.disconnect();
	}
}
