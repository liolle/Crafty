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
		if (!pos["end"]) pos["end"] = [node];
		//@ts-ignore
		else pos["end"].push(node);
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
		this.#increaseSize();
	}

	remove(word: string, id?: string) {
		this.#decreaseSize();
		return null;
	}

	search(word: string) {
		const res: CraftyNode[] = [];
		return res;
	}

	clear() {
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
