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
		if (this.observer) this.disconnect();
		this.observer = new MutationObserver((mutation) => {
			this.#callback(leaf, mutation, node_state);
		});

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
		const view_state = leaf.getViewState();
		if (view_state.type != "canvas") return;
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
		this.observer = null;
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
		this.firstID = this.node_arr[0].id || "";
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
		if (nodes.length < 1) return;
		while (this.node_arr.length > 0) this.node_arr.pop();
		while (this.selected.length > 0) this.selected.pop();
		this.node_map.clear();
		this.currentID = "";
		this.add(nodes);
	}

	selectNodes(id_list: string[]) {
		if (id_list.length == 1) this.current(id_list[0]);
		else if (this.selected.length > 1) {
			this.current(this.node_arr[0].id);
		}
		this.notifyObserver();
	}

	// Navigator
	current(id: string) {
		// const target = this.node_map.get(id);
		// if (!target) return;
		this.currentID = id;
	}
	next() {
		let id = this.currentID;
		if (id == "") {
			this.currentID = this.firstID;
			id = this.currentID;
		}
		const idx = this.node_map.get(id);
		if (idx === undefined) return;

		const next_idx = (idx + 1) % this.node_arr.length;
		const next_node = this.node_arr[next_idx];
		next_node.container.click();
	}
	previous() {
		let id = this.currentID;
		if (id == "") {
			this.currentID = this.firstID;
			id = this.currentID;
		}
		const idx = this.node_map.get(id);
		if (idx === undefined) return;
		const prev_idx = idx - 1 < 0 ? this.node_arr.length - 1 : idx - 1;
		const next_node = this.node_arr[prev_idx];
		next_node.container.click();
	}
}
