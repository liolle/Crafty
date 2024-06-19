import { CraftyNode, NodesExplorer } from "nodes/nodes";
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

// TYPE //

export class AttributeObserver {
	private observer: MutationObserver | null;
	private config = { attributes: true, attributeFilter: ["class"] };

	observe(leaf: WorkspaceLeaf | null, node_state: NodesState) {
		if (!leaf) return;
		if (this.observer) this.disconnect();
		this.observer = new MutationObserver((mutation) => {
			this.#callback(leaf, node_state);
		});

		this.#addObservableElement(leaf);
	}

	#callback(leaf: WorkspaceLeaf, node_state: NodesState) {
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
			//@ts-ignore
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
	private rel_node_map: Map<string, number> = new Map();
	private node_arr: CraftyNode[] = [];
	private rel_node_arr: CraftyNode[] = [];
	private selected: string[] = [];
	private firstID: string;
	private currentID = "";
	private node_explorer = new NodesExplorer();
	private currentSearch = "";

	registerObserver(observer: NodeObserver) {
		this.observers.push(observer);
	}
	removeObserver(observer: NodeObserver) {
		this.observers = this.observers.filter((val) => val != observer);
	}
	notifyObserver() {
		for (const obs of this.observers) {
			obs.update(this.nodes);
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

	#indexNodes() {
		this.rel_node_map.clear();
		const n = this.rel_node_arr.length;
		for (let i = 0; i < n; i++)
			this.rel_node_map.set(this.rel_node_arr[i].id, i);
	}

	#clearRelNodes() {
		while (this.rel_node_arr.length > 0) this.rel_node_arr.pop();
	}

	#PopulateRelNodes(nodes: CraftyNode[]) {
		this.#clearRelNodes();
		for (const node of nodes) this.rel_node_arr.push(node);
		this.#indexNodes();
	}

	add(nodes: CraftyNode[]) {
		for (const node of nodes) {
			if (this.node_map.size == 0) this.firstID = node.id;
			if (this.selected.includes(node.id)) node.selected = true;
			this.node_map.set(node.id, this.node_arr.length);
			this.node_arr.push(node);
			this.node_explorer.add(node);
		}
		this.firstID = "";
		if (nodes.length > 0) this.firstID = this.node_arr[0].id;
		this.notifyObserver();
	}

	remove(id_list: string[]) {
		for (const id of id_list) {
			if (this.node_map.has(id)) {
				//@ts-ignore
				this.#swapIdx(this.node_map.get(id), this.node_arr.length - 1);
				const node = this.node_arr.pop();
				if (node) this.node_explorer.remove(node.title, id);
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
		this.node_explorer.clear();
		this.add(nodes);
	}

	selectNodes(id_list: string[]) {
		const n = id_list.length;
		this.selected = id_list;
		if (n == 0) {
			this.currentID = "";
		} else {
			this.currentID = id_list[0];
		}
		for (const node of this.node_arr) node.selected = false;
		for (const id of id_list) {
			const node_idx = this.node_map.get(id);
			if (node_idx == undefined) continue;
			this.node_arr[node_idx].selected = true;
		}
		this.notifyObserver();
	}

	// Search

	#update() {
		if (this.currentSearch == "") this.#PopulateRelNodes(this.node_arr);
		else {
			this.#PopulateRelNodes(
				this.node_explorer.findSimilar(this.currentSearch, 4)
			);
		}
	}

	setSearchWord(word: string) {
		this.currentSearch = word;
		this.notifyObserver();
	}

	// Navigator
	current(id: string) {
		this.currentID = id;
		const idx = this.node_map.get(id);
		if (idx === undefined) return;

		const next_node = this.node_arr[idx];
		if (!next_node.container) return;
		next_node.container.click();
	}

	#findFirstNode() {
		const id = this.rel_node_arr[0].id;
		this.currentID = id || "";

		const idx = this.rel_node_map.get(id);
		if (idx == undefined) return null;

		const next_node = this.rel_node_arr[idx];
		if (!next_node.container) return null;

		return next_node;
	}

	next() {
		const idx = this.rel_node_map.get(this.currentID);

		if (idx === undefined) {
			const next_node = this.#findFirstNode();
			if (!next_node || !next_node.container) return;
			next_node.container.click();
			return;
		}

		const next_idx = (idx + 1) % this.rel_node_arr.length;
		const next_node = this.rel_node_arr[next_idx];
		if (!next_node.container) return;
		next_node.container.click();
	}
	previous() {
		const idx = this.rel_node_map.get(this.currentID);

		if (idx === undefined) {
			const next_node = this.#findFirstNode();
			if (!next_node || !next_node.container) return;
			next_node.container.click();
			return;
		}

		const prev_idx = idx - 1 < 0 ? this.rel_node_arr.length - 1 : idx - 1;
		const next_node = this.rel_node_arr[prev_idx];
		if (!next_node.container) return;
		next_node.container.click();
	}

	get nodes() {
		this.#update();
		return this.rel_node_arr;
	}

	get selectedNode() {
		const idx = this.node_map.get(this.currentID);
		if (idx == undefined) return null;
		return this.node_arr[idx];
	}
}
