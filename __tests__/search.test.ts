//Search tests

// Sort tests
import { CraftyNode, NodesExplorer } from "nodes/nodes";
import { beforeEach, describe, expect, test } from "vitest";

const sample_nodes: CraftyNode[] = [
	{
		id: "s1",
		title: "node1",
		description: "",
		container: null,
		selected: false,
		type: "canvas",
	},
	{
		id: "s2",
		title: "node2",
		description: "",
		container: null,
		selected: false,
		type: "canvas",
	},
	{
		id: "s1",
		title: "node1",
		description: "node1 bis",
		container: null,
		selected: false,
		type: "canvas",
	},
];

describe("NodesExplorer", () => {
	const explorer = new NodesExplorer();

	beforeEach(() => {
		explorer.clear();
	});

	// Add elements
	test("Simple add", () => {
		expect(explorer.size).toBe(0);

		explorer.add(sample_nodes[0]);

		expect(explorer.size).toBe(1);
	});

	test("Add multiple", () => {
		expect(explorer.size).toBe(0);

		explorer.add(sample_nodes[0]);
		explorer.add(sample_nodes[1]);

		expect(explorer.size).toBe(2);
	});

	test("Add multiple overlap", () => {
		expect(explorer.size).toBe(0);

		explorer.add(sample_nodes[0]);
		explorer.add(sample_nodes[2]);

		expect(explorer.size).toBe(1);
	});

	// Remove elements
	test("Simple remove", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);
		explorer.remove(node.title);

		expect(explorer.size).toBe(0);
	});

	// Search elements
	test("Simple search", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);

		const search = explorer.search(node.title);
		const s_node = search[0];
		expect(search.length).toBe(1);
		expect(s_node.title).toBe(node.title);
	});

	// Search elements
	test("Search overlap", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		const node2 = sample_nodes[2];
		explorer.add(node);
		explorer.add(node2);

		const search = explorer.search(node.title);
		expect(search.length).toBe(1);

		const s_node = search[0];
		expect(s_node.title).toBe(node2.title);
		expect(s_node.description).toBe(node2.description);
	});
});
