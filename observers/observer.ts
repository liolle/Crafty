import { WorkspaceLeaf } from "obsidian";

export class AttributeObserver {
	private observer: MutationObserver | null;
	private config = { attributes: true, attributeFilter: ["class"] };
	private leaf: WorkspaceLeaf;

	observe(leaf: WorkspaceLeaf | null) {
		if (!leaf) return;
		if (!this.observer) {
			this.observer = new MutationObserver((mutation) =>
				this.#callback(leaf, mutation)
			);
		}
		this.#addObservableElement(leaf);
	}

	#callback(leaf: WorkspaceLeaf, mutations: MutationRecord[]) {
		const view_state = leaf.getViewState();
		if (view_state.type != "canvas") return;

		console.log("selection changed");
	}

	#addObservableElement(leaf: WorkspaceLeaf) {
		const nodes = Array.from(
			//@ts-ignore
			leaf.view.canvas.nodes,
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
	update: (...args: any[]) => void;
}

export abstract class Navigator<T> {
	current: (elem: T) => void;
	next: () => void;
	previous: () => void;
}

export abstract class Subject {
	registerObserver: (observer: Observer) => void;
	removeObserver: (observer: Observer) => void;
	notifyObserver: () => void;
}

export class NodeObserver implements Observer {
	update(nodes: CraftyNode[]) {
		console.log(nodes);
	}
}

export interface CraftyNode {
	id: string;
	title: string;
	description: string;
	// type: "text" | "file" | "group";
	selected: boolean;
}

/**
 *
 */
export class NodesState implements Subject, Navigator<string> {
	private observers: NodeObserver[] = [];

	private node_map: Map<string, number>;
	private node_arr: CraftyNode[];
	private firstID: string;
	private currentID = "";

	registerObserver(observer: NodeObserver) {
		this.observers.push(observer);
	}
	removeObserver(observer: NodeObserver) {
		this.observers = this.observers.filter((val) => val != observer);
	}
	notifyObserver() {
		for (const obs of this.observers) {
			obs.update(this.node_arr);
		}
	}

	// List
	#swapIdx(left: number, right: number) {
		const node1 = this.node_arr[left];
		const node2 = this.node_arr[right];

		this.node_map.set(node1.id, right);
		this.node_map.set(node2.id, left);

		[this.node_arr[left], this.node_arr[right]] = [
			this.node_arr[right],
			this.node_arr[left],
		];
	}

	add(nodes: CraftyNode[]) {
		for (const node of nodes) {
			if (this.node_map.size == 0) this.firstID = node.id;
			this.node_map.set(node.id, this.node_arr.length);
			this.node_arr.push(node);
		}
		this.notifyObserver();
	}
	remove(id_list: string[]) {
		for (const id of id_list) {
			if (this.node_map.has(id)) {
				//@ts-ignore
				this.#swapIdx(this.node_map.get(id), this.node_arr.length - 1);
				this.node_arr.pop();
				this.node_map.delete(id);
				//@ts-ignore
				this.#swapIdx(this.node_map.get(id), this.node_arr.length - 1);
			}
		}
		this.notifyObserver();
	}

	replace(nodes: CraftyNode[]) {
		while (this.node_arr.length > 0) this.node_arr.pop();
		this.node_map.clear();
		this.add(nodes);
	}

	// Navigator
	current(id: string) {
		const idx = this.node_map.get(this.currentID);
		const target = this.node_map.get(id);
		if (!target) return;
		if (idx) this.node_arr[idx].selected = false;
		this.node_arr[target].selected = true;
		this.currentID = id;
	}
	next() {}
	previous() {}

	setState() {
		//...
		this.notifyObserver();
	}
}
