// INTERFACES //
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
	type: NODE_TYPE;
	extension: FILE_TYPE;
	created_at: number;
	last_modified: number;
}

abstract class Explorer {
	add: (node: CraftyNode) => void;
	remove: (node: CraftyNode) => CraftyNode | null;
	search: (word: string) => CraftyNode[];
	clear: () => void;
}

export class NodeFilter {
	private _group: string;
	private _title: string;
	private _type: FILE_TYPE;
	private active = false;

	constructor(group: string, type: FILE_TYPE) {
		this._group = group;
		this._title = type == "" ? "default" : type;
		this._type = type;
	}

	enable() {
		this.active = true;
	}

	disable() {
		this.active = false;
	}

	get group() {
		return this._group;
	}

	get title() {
		return this._title;
	}

	get type() {
		return this._type;
	}

	get isActive() {
		return this.active;
	}
}

// INTERFACES //

// TYPES //

export type AUDIO_FORMAT =
	| "flac"
	| "m4a"
	| "mp3"
	| "ogg"
	| "wav"
	| "webm"
	| "3gp";
export type IMAGE_FORMAT =
	| "avif"
	| "bmp"
	| "gif"
	| "jpeg"
	| "jpg"
	| "png"
	| "svg"
	| "webp";
export type VIDEO_FORMAT = "mkv" | "mov" | "mp4" | "ogv" | "webm";
export type DOCUMENT_FORMAT = "canvas" | "json" | "pdf" | "md";
export type NODE_TYPE = "link" | "text" | "group" | "file" | "";
export type FILE_TYPE =
	| AUDIO_FORMAT
	| VIDEO_FORMAT
	| IMAGE_FORMAT
	| DOCUMENT_FORMAT
	| NODE_TYPE
	| "audio"
	| "video"
	| "image";

export const FILE_FORMAT = {
	Audio: {
		flac: "flac",
		m4a: "m4a",
		mp3: "mp3",
		ogg: "ogg",
		wav: "wav",
		webm: "webm",
		"3gp": "3gp",
	},
	Image: {
		avif: "avif",
		bmp: "bmp",
		gif: "gif",
		jpeg: "jpeg",
		jpg: "jpg",
		png: "png",
		svg: "svg",
		webp: "webp",
	},
	Video: { mkv: "mkv", mov: "mov", mp4: "mp4", ogv: "ogv", webm: "webm" },
	Document: { canvas: "canvas", md: "md", pdf: "pdf", json: "json" },
	General: {
		link: "link",
		text: "text",
		group: "group",
		video: "video",
		audio: "audio",
		image: "image",
	},
};

export type CRAFTY_NODE_SORT_TYPE = "name" | "created_at" | "last_modified";
export type NODE_ORDER = "asc" | "des";

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
	#splitPart(word: string): string[] {
		const result: string[] = [];
		const len = word.length;
		for (let idx = 0; idx < len; idx++) {
			result.push(word.substring(len - idx - 1, len));
		}
		return result;
	}

	#addSingle(title: string, node: CraftyNode) {
		title = title.toLowerCase();
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

	add(node: CraftyNode) {
		for (const word of this.#splitPart(node.title)) {
			this.#addSingle(word, node);
		}
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

	remove(node: CraftyNode) {
		for (const word of this.#splitPart(node.title)) {
			this.#removeR(word, 0, this.#root, {}, 0, node.id);
		}

		return null;
	}

	#searchR(word: string, idx: number, root: object): CraftyNode[] {
		word = word.toLowerCase();
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
		word = word.toLowerCase();
		if (!root) return;
		const keys = Object.keys(root);
		if (idx >= word.length) {
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
			//@ts-ignore
			const [up, low] = [
				word[idx].toLocaleLowerCase(),
				word[idx].toLocaleUpperCase(),
			];
			//@ts-ignore
			const next_lower = root[up];
			//@ts-ignore
			const next_upper = root[low];
			if (!next_lower && !next_upper) return;
			this.#prefixSearchR(word, idx + 1, next_lower, acc);
			this.#prefixSearchR(word, idx + 1, next_upper, acc);
		}
	}

	prefixSearch(word: string): CraftyNode[] {
		const res: CraftyNode[] = [];
		this.#prefixSearchR(word, 0, this.#root, res);
		return res;
	}

	#findSimilarR(
		root: object,
		letter: string,
		word: string,
		previousRow: number[],
		res: Array<[CraftyNode, number]>,
		precision: number
	): void {
		word = word.toLowerCase();
		const n = word.length;
		const currentRow = new Array(n + 1).fill(0);
		currentRow[0] = previousRow[0] + 1;
		let min = Infinity;
		for (let i = 1; i <= n; i++) {
			const insertionCost = currentRow[i - 1] + 1;
			const deleteCost = previousRow[i] + 1;
			let replaceCost = previousRow[i - 1];
			if (word[i - 1] != letter) replaceCost++;

			currentRow[i] = Math.min(insertionCost, deleteCost, replaceCost);
			min = Math.min(min, currentRow[i]);
		}

		if (currentRow[n] <= precision) {
			//@ts-ignore
			const nodes = root["end"];
			if (nodes && nodes.length > 0) {
				for (const node of nodes) res.push([node, currentRow[n]]);
			}
		}

		if (min <= precision) {
			const keys = Object.keys(root);
			for (const key of keys) {
				if (key == "end") continue;
				this.#findSimilarR(
					//@ts-ignore
					root[key],
					key,
					word,
					currentRow,
					res,
					precision
				);
			}
		}
	}

	#lcs(s1: string, s2: string) {
		const n = s1.length,
			m = s2.length;
		const dp = new Array(n + 1)
			.fill(null)
			.map(() => new Array(m + 1).fill(0));
		for (let i = n - 1; i >= 0; i--) {
			for (let j = m - 1; j >= 0; j--) {
				if (s1[i] == s2[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
				else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
			}
		}
		return dp[0][0];
	}

	findSimilar(word: string, precision: number): CraftyNode[] {
		word = word.toLowerCase();
		const res: Array<[CraftyNode, number]> = [];
		const n = word.length;
		const currentRow = new Array(n + 1).fill(0);
		const keys = Object.keys(this.#root);
		for (const key of keys) {
			this.#findSimilarR(
				//@ts-ignore
				this.#root[key],
				key,
				word,
				currentRow,
				res,
				precision
			);
		}
		res.sort((a, b) => a[1] - b[1]);
		return res
			.filter((val) => {
				const lcs_ration =
					this.#lcs(word, val[0].title.toLowerCase()) /
					Math.max(val[0].title.length, word.length);
				return lcs_ration > 0.4;
			})
			.map((val) => val[0]);
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

export class NodeComparator {
	static SORT_BY_CREATED_AT(node1: CraftyNode, node2: CraftyNode) {
		if (node1.type != "file" && node2.type != "file") return 0;
		if (node1.type != "file") return 1;
		if (node2.type != "file") return -1;
		return node1.created_at - node2.created_at;
	}

	static SORT_BY_LAST_MODIFIED(node1: CraftyNode, node2: CraftyNode) {
		if (node1.type != "file" && node2.type != "file") return 0;
		if (node1.type != "file") return 1;
		if (node2.type != "file") return -1;
		return node2.last_modified - node1.last_modified;
	}

	static SORT_BY_NAME(node1: CraftyNode, node2: CraftyNode) {
		const [t1, t2] = [node1.title.toLowerCase(), node2.title.toLowerCase()];
		if (t1 > t2) return 1;
		else if (t1 < t2) return -1;
		return 0;
	}
}
