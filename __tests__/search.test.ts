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
];

describe("NodesExplorer", () => {
	const explorer = new NodesExplorer();

	beforeEach(() => {
		explorer.clear();
	});

	test("Simple add", () => {
		expect(explorer.size).toBe(0);

		explorer.add(sample_nodes[0]);

		expect(explorer.size).toBe(1);
	});

	test("Simple remove", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);
		explorer.remove(node.title);

		expect(explorer.size).toBe(0);
	});

	test("Simple search", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);

		const search = explorer.search(node.title);
		const s_node = search[0];
		expect(search.length).toBe(1);
		expect(s_node.title).toBe(node.title);
	});
});
