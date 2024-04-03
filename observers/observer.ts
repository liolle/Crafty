import { WorkspaceLeaf } from "obsidian";
// TYPE //

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
	callback: (nodes: CraftyNode[]) => void;
	constructor(callback: (nodes: CraftyNode[]) => void) {
		this.callback = callback;
	}
	update(nodes: CraftyNode[]) {
		this.callback(nodes);
	}
}

export interface CraftyNode {
	id: string;
	title: string;
	description: string;
	container: HTMLElement;
	selected: boolean;
}

// TYPE //

export class AttributeObserver {
	private observer: MutationObserver | null;
	private config = { attributes: true, attributeFilter: ["class"] };
	private TIMER = 4;
	private count = this.TIMER;
	private timer = null;

	private node_state: NodesState | null;

	observe(leaf: WorkspaceLeaf | null, node_state: NodesState) {
		if (!leaf) return;
		if (!this.observer) {
			this.observer = new MutationObserver((mutation) => {
				this.#callback(leaf, mutation, node_state);
			});
		}
		this.#addObservableElement(leaf);
	}

	#callback(
		leaf: WorkspaceLeaf,
		mutations: MutationRecord[],
		node_state: NodesState
	) {
		const view_state = leaf.getViewState();
		if (view_state.type != "canvas") return;

		const selection = Array.from(
			//@ts-ignore
			leaf.view.canvas.selection,
			//@ts-ignore
			(val) => val.id
		);
		node_state.selectNodes(selection);
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

/**
 *
 */
export class NodesState implements Subject, Navigator<string> {
	private observers: NodeObserver[] = [];

	private node_map: Map<string, number> = new Map();
	private node_arr: CraftyNode[] = [];
	private selected: string[] = [];
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

	selectNodes(id_list: string[]) {
		for (const id of this.selected) {
			const idx = this.node_map.get(id);
			if (!idx) continue;
			this.node_arr[idx].selected = false;
		}
		while (this.selected.length > 0) this.selected.pop();
		for (const id of id_list) {
			const idx = this.node_map.get(id);
			if (!idx) continue;
			this.node_arr[idx].selected = true;
			this.selected.push(id);
		}
		this.notifyObserver();
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
