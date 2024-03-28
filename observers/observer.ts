import { DOMHandler } from "dom/handler";
import Crafty from "main";
import { WorkspaceLeaf } from "obsidian";

export class AttributeObserver {
	private observer: MutationObserver | null;
	private config = { attributes: true, attributeFilter: ["class"] };
	private leaf: WorkspaceLeaf;

	observeCanvasNodeClass(plugin: Crafty) {
		//@ts-ignore
		const leaf: WorkspaceLeaf = plugin.CurrentLeaf();
		if (!leaf || leaf.getViewState().type != "canvas") return;
		this.leaf = leaf;
		if (!this.observer) {
			this.#initObserver(plugin);
		} else {
			this.#updateNodeClass();
		}
	}

	#initObserver(plugin: Crafty) {
		if (!this.observer) {
			this.observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					//@ts-ignore
					if (!this.leaf.view.canvas) return;
					const nodes = Array.from(
						//@ts-ignore
						this.leaf.view.canvas.selection
					);

					if (plugin.selected_node) {
						plugin.selected_node.clear();
						for (const elem of nodes) {
							//@ts-ignore
							plugin.selected_node.add(elem.id);
						}
					}

					plugin.updateNodeList();
					DOMHandler.updatePanelView(plugin);
				});
			});
		}
		this.#addObservableElement();
	}

	#updateNodeClass() {
		this.disconnect();
		this.#addObservableElement();
	}

	#addObservableElement() {
		const nodes = Array.from(
			//@ts-ignore
			this.leaf.view.canvas.nodes,
			([id, value]) => ({
				id,
				container: value.nodeEl,
				data: value.unknownData,
			})
		);

		if (this.observer) {
			for (const node of nodes) {
				this.observer.observe(node.container, this.config);
			}
		}
	}

	disconnect() {
		if (this.observer) this.observer.disconnect();
	}
}

export abstract class Observer {
	update: () => void;
}

export abstract class Subject {
	registerObserver: (observer: Observer) => void;
	removeObserver: (observer: Observer) => void;
	notifyObserver: () => void;
}
