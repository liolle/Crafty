import Crafty, { CraftyNode } from "main";

interface NavigationNode {
	id: string;
	data: CraftyNode;
	container: HTMLElement;
	next: string;
	prev: string;
}

export class NodeState {
	private plugin: Crafty;
	private node_map: Map<string, NavigationNode>;
	private first: string;
	private currentId: string;
	constructor(plugin: Crafty) {
		this.plugin = plugin;
		this.node_map = new Map<string, NavigationNode>();
		this.setNavigation();
	}

	setNavigation() {
		this.updateNavigation();
	}

	resetNavigation() {
		this.node_map.clear();
		this.updateNavigation();
	}

	updateNavigation() {
		this.plugin.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.getViewState().type != "canvas") return;

			const nodes = Array.from(
				//@ts-ignore
				leaf.view.canvas.nodes,
				([id, value]) => ({
					id,
					container: value.nodeEl,
					data: value.unknownData,
				})
			);

			for (let i = 0; i < nodes.length; i++) {
				const nav_node: NavigationNode = {
					...nodes[i],
					next: "",
					prev: "",
				};
				if (i == 0) {
					this.first = nodes[i].id;
					nav_node.prev = nodes[nodes.length - 1].id;
				} else {
					nav_node.prev = nodes[i - 1].id;
				}
				nav_node.next = nodes[(i + 1) % nodes.length].id;

				this.node_map.set(nodes[i].id, nav_node);
			}

			console.log(this.node_map);
		});
	}

	setCurrent(id: string) {
		if (this.node_map.has(id)) {
			this.currentId = id;
		}
	}

	current() {
		if (!this.currentId) {
			this.currentId = this.first;
		}
		if (this.node_map.has(this.currentId)) {
			const node = this.node_map.get(this.currentId);
			return {
				container: node?.container,
				data: node?.data,
			};
		}
	}
	next() {
		if (!this.currentId) {
			return this.current();
		}
		const next_node = this.node_map.get(this.currentId);
		if (!next_node) return this.current();
		this.currentId = next_node.next;
		return this.current();
	}
	prev() {
		if (!this.currentId) {
			return this.current();
		}

		const prev_node = this.node_map.get(this.currentId);
		if (!prev_node) return this.current();
		this.currentId = prev_node.prev;
		return this.current();
	}
}
