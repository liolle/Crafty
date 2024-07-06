import { DOMHandler } from "dom/handler";
import {
	CRAFTY_NODE_SORT_TYPE,
	CraftyNode,
	FILE_FORMAT,
	FILE_TYPE,
	NODE_ORDER,
	NODE_TYPE,
	NodeComparator,
	NodeFilter,
	NodesExplorer,
} from "nodes/nodes";
import { WorkspaceLeaf } from "obsidian";
import {
	AudioSpecification,
	ExpressionSpecification,
	ImageSpecification,
	Specification,
	VideoSpecification,
} from "specification";
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

export class NodeFilterObserver implements Observer {
	callback: (filters: NodeFilter[]) => void;
	constructor(callback: (filters: NodeFilter[]) => void) {
		this.callback = callback;
	}
	update(filters: NodeFilter[]) {
		this.callback(filters);
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
	private lastID = "";
	private node_explorer = new NodesExplorer();
	private currentSearch = "";
	private sort_by: CRAFTY_NODE_SORT_TYPE = "name";
	private node_order: NODE_ORDER = "asc";
	private filters: NodeFilter[] = [];

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

	#sort() {
		const sort_button = DOMHandler.getSortButton();
		const text = sort_button.querySelector(".sb-text") as HTMLSpanElement;
		const sort_menu = DOMHandler.getSortMenu();
		const sort_name = sort_menu.querySelector(".s-name");
		const sort_created = sort_menu.querySelector(".s-created");
		const sort_last = sort_menu.querySelector(".s-last");
		//@ts-ignore
		for (const node of [sort_name, sort_created, sort_last]) {
			if (!node) continue;
			node.classList.remove("check-active");
		}
		switch (this.sort_by) {
			case "name":
				this.rel_node_arr.sort(NodeComparator.SORT_BY_NAME);
				if (text) text.setText("Name");
				if (sort_name) sort_name.classList.add("check-active");
				break;
			case "created_at":
				this.rel_node_arr.sort(NodeComparator.SORT_BY_CREATED_AT);
				if (text) text.setText("Created_at");
				if (sort_created) sort_created.classList.add("check-active");
				break;
			case "last_modified":
				this.rel_node_arr.sort(NodeComparator.SORT_BY_LAST_MODIFIED);
				if (text) text.setText("Last_modified");
				if (sort_last) sort_last.classList.add("check-active");
				break;
			default:
				this.rel_node_arr.sort(NodeComparator.SORT_BY_NAME);
				break;
		}
	}

	#order() {
		const sort_menu = DOMHandler.getSortMenu();
		const sort_asc = sort_menu.querySelector(".s-asc");
		const sort_desc = sort_menu.querySelector(".s-desc");
		//@ts-ignore
		for (const node of [sort_asc, sort_desc]) {
			if (!node) continue;
			node.classList.remove("check-active");
		}

		if (this.node_order == "des") {
			this.rel_node_arr.reverse();
			if (sort_desc) sort_desc.classList.add("check-active");
		} else {
			if (sort_asc) sort_asc.classList.add("check-active");
		}
	}

	#getFilterSpec() {
		if (this.filters.length == 0)
			return new ExpressionSpecification<CraftyNode>(() => true);
		let specification: Specification<CraftyNode> =
			new ExpressionSpecification<CraftyNode>(() => false);

		for (const filter of this.filters) {
			if (filter.type == "audio") {
				specification = specification.or(
					new AudioSpecification<CraftyNode>()
				);
			} else if (filter.type == "video") {
				specification = specification.or(
					new VideoSpecification<CraftyNode>()
				);
			} else if (filter.type == "image") {
				specification = specification.or(
					new ImageSpecification<CraftyNode>()
				);
			} else {
				const or_specification =
					new ExpressionSpecification<CraftyNode>((candidate) => {
						if (candidate.type == "file")
							return candidate.extension == filter.type;
						else return candidate.type == filter.type;
					});
				specification = specification.or(or_specification);
			}
		}

		return specification;
	}

	#PopulateRelNodes(nodes: CraftyNode[]) {
		this.#clearRelNodes();
		const spec = this.#getFilterSpec();
		for (const node of nodes) {
			if (spec.isSatisfied(node)) this.rel_node_arr.push(node);
		}

		this.#sort();
		this.#order();
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
			this.lastID = this.currentID;
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

	order(order: NODE_ORDER) {
		if (this.node_order != order) {
			this.node_order = order;
			this.notifyObserver();
		}
	}

	sortBy(sort_by: CRAFTY_NODE_SORT_TYPE) {
		if (this.sort_by != sort_by) {
			this.sort_by = sort_by;
			this.notifyObserver();
		}
	}

	setFilters(filters: NodeFilter[]) {
		this.filters = filters;
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

	get isNodeSame() {
		if (this.currentID == "" || this.lastID == "") return false;
		return this.currentID == this.lastID;
	}
}

export class NodesFilterState implements Subject {
	private observers: NodeFilterObserver[] = [];
	private filter_index: Map<FILE_TYPE | NODE_TYPE, number> = new Map();
	private filter_list: NodeFilter[] = [];

	constructor() {
		let idx = 0;
		for (const group in FILE_FORMAT) {
			//@ts-ignore
			for (const type in FILE_FORMAT[group]) {
				const t = type as FILE_TYPE;
				this.filter_list.push(new NodeFilter(group, t));
				this.filter_index.set(t, idx++);
			}
		}
	}

	registerObserver(observer: NodeFilterObserver) {
		this.observers.push(observer);
	}
	removeObserver(observer: NodeFilterObserver) {
		this.observers = this.observers.filter((val) => val != observer);
	}
	notifyObserver() {
		for (const obs of this.observers) {
			obs.update(this.filter_list);
		}
	}

	addFilter(filter: FILE_TYPE) {
		const idx = this.filter_index.get(filter);
		if (!idx) return;
		if (this.filter_list[idx].isActive) return;
		this.filter_list[idx].enable();
		this.notifyObserver();
	}

	removeFilter(filter: FILE_TYPE) {
		const idx = this.filter_index.get(filter);
		if (!idx) return;
		if (!this.filter_list[idx].isActive) return;
		this.filter_list[idx].disable();
		this.notifyObserver();
	}

	getFilterByGroup(group: string) {
		return this.filter_list.filter((val) => val.group == group);
	}

	get activeFilters() {
		return this.filter_list.filter((val) => val.isActive);
	}

	get allFilters() {
		return this.filter_list;
	}
}
