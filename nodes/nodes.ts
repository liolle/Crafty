// TYPES //

export interface RawNode {
	description: string | undefined;
	file: string | undefined;
	text: string | undefined;
	label: string | undefined;
	url: string | undefined;
	title: string | undefined;
	height: number;
	id: string;
	type: string;
	width: number;
	x: number;
	y: number;
}

export interface CraftyNode {
	id: string;
	title: string;
	description: string;
	container: HTMLElement | null;
	selected: boolean;
	type: string;
}

abstract class Explorer {
	add: (node: CraftyNode) => void;
	remove: (word: string, id?: string) => CraftyNode | null;
	search: (word: string) => CraftyNode[];
	clear: () => void;
}

type NODE_SORT_TYPE = "default" | "name" | "last-modified";

// TYPES //

export class NodesExplorer implements Explorer {
	#root = {};
	#size = 0;

	#increaseSize() {
		this.#size++;
	}

	#decreaseSize() {
		if (this.#size > 0) this.#size--;
	}

	#addNode(pos: object, node: CraftyNode) {
		//@ts-ignore
		let arr: CraftyNode[] = pos["end"];
		if (!arr) {
			arr = [];
			//@ts-ignore
			pos["end"] = arr;
		}

		for (let i = 0; i < arr.length; i++) {
			if (arr[i].id == node.id) {
				arr[i] = node;
				return;
			}
		}
		arr.push(node);
		this.#increaseSize();
	}

	add(node: CraftyNode) {
		const { title } = node;
		let current = this.#root;

		for (let idx = 0; idx < title.length; idx++) {
			const char = title[idx];
			//@ts-ignore
			if (current[char]) current = current[char];
			else {
				//@ts-ignore
				current[char] = {};
				//@ts-ignore
				current = current[char];
			}
		}
		this.#addNode(current, node);
	}

	#removeNode(arr: CraftyNode[], id?: string) {
		const n = arr.length;
		if (!id) {
			while (arr.length > 0) arr.pop();
			return;
		}
		for (let i = 0; i < n; i++) {
			if (id == arr[i].id) {
				[arr[i]] = [arr[n - 1]];
				arr.pop();
			}
		}
	}

	#removeR(
		word: string,
		idx: number,
		root: object,
		last: object,
		last_idx: number,
		id?: string
	) {
		if (idx >= word.length) {
			if (!root) return;
			//@ts-ignore
			const arr = root["end"];
			if (!arr) return;
			this.#removeNode(arr, id);
			if (arr.length == 0) {
				//@ts-ignore
				delete root["end"];
				const keys = Object.keys(root);
				//@ts-ignore
				if (keys.length == 0) delete last[word[last_idx]];
			}
		}

		if (!root) return;
		//@ts-ignore
		const next = root[word[idx]];
		const keys = Object.keys(root);
		let len = keys.length;
		if (keys.includes("end")) len--;
		if (len > 1) {
			last = root;
			last_idx = idx;
		}
		this.#removeR(word, idx + 1, next, root, last_idx, id);
	}

	remove(word: string, id?: string) {
		this.#removeR(word, 0, this.#root, {}, 0, id);
		this.#decreaseSize();
		return null;
	}

	#searchR(word: string, idx: number, root: object): CraftyNode[] {
		if (idx >= word.length) {
			if (!root) return [];
			//@ts-ignore
			return root["end"] || [];
		}
		if (!root) return [];
		//@ts-ignore
		const next = root[word[idx]];
		if (!next) return [];
		return this.#searchR(word, idx + 1, next);
	}

	search(word: string): CraftyNode[] {
		return this.#searchR(word, 0, this.#root);
	}

	#prefixSearchR(word: string, idx: number, root: object, acc: CraftyNode[]) {
		const keys = Object.keys(root);
		if (idx >= word.length) {
			if (!root) return;
			//@ts-ignore
			const nodes = root["end"];
			if (nodes) for (const node of nodes) acc.push(node);
			for (const key of keys) {
				//@ts-ignore
				const next = root[key];
				if (!next) return;
				if (key != "end") this.#prefixSearchR(word, idx + 1, next, acc);
			}
		} else {
			if (!root) return;
			//@ts-ignore
			const next = root[word[idx]];
			this.#prefixSearchR(word, idx + 1, next, acc);
		}
	}

	prefixSearch(word: string): CraftyNode[] {
		const res: CraftyNode[] = [];
		this.#prefixSearchR(word, 0, this.#root, res);
		return res;
	}

	#clearR(root: object) {
		for (const key of Object.keys(root)) {
			if (key == "end") {
				//@ts-ignore
				const arr = root["end"];
				while (arr.length > 0) arr.pop();
			}
			//@ts-ignore
			else this.#clearR(root[key]);
			//@ts-ignore
			delete root[key];
		}
	}

	clear() {
		this.#clearR(this.#root);
		this.#size = 0;
	}

	get size() {
		return this.#size;
	}
}

export class NodesModifiers {
	/**
	 *
	 * @param {CraftyNode} first
	 * @param {CraftyNode} second
	 */
	static #SORT_BY_NAME = (first: CraftyNode, second: CraftyNode) => {
		if (first.title < second.title) return -1;
		else if (first.title > second.title) return 1;
		else return 0;
	};

	static sort(nodes: CraftyNode[], type: NODE_SORT_TYPE = "default") {
		switch (type) {
			case "name":
				nodes.sort(this.#SORT_BY_NAME);
				break;
			case "last-modified":
				nodes.sort(this.#SORT_BY_NAME);
				break;
			default:
				nodes.sort(this.#SORT_BY_NAME);
				break;
		}
	}

	static reverse(arr: Array<any>) {
		for (let i = 0, j = arr.length - 1; i < j; i++, j--) {
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
	}
}
