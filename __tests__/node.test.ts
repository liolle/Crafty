//Search tests

// Sort tests
import { CraftyNode, NodesModifiers } from "nodes/nodes";
import { beforeEach, describe, expect, test } from "vitest";

const sample_nodes: CraftyNode[] = [
	{
		id: "id1",
		title: "a",
		description: "",
		container: null,
		selected: false,
		type: "canvas",
	},
	{
		id: "id2",
		title: "b",
		description: "",
		container: null,
		selected: false,
		type: "canvas",
	},
	{
		id: "id3",
		title: "c",
		description: "test",
		container: null,
		selected: false,
		type: "canvas",
	},
	{
		id: "id4",
		title: "az",
		description: "test",
		container: null,
		selected: false,
		type: "canvas",
	},
	{
		id: "id5",
		title: "bc",
		description: "test",
		container: null,
		selected: false,
		type: "canvas",
	},
];

function shuffle(arr: any[]) {
	const n = arr.length;

	for (let i = 0; i < n / 2; i++) {
		const left = Math.floor(Math.random() * n);
		let right = Math.floor(Math.random() * n);

		while (left == right) right = Math.floor(Math.random() * n);

		[arr[left], arr[right]] = [arr[right], arr[left]];
	}
}

describe("NodesExplorer", () => {
	const n = sample_nodes.length;

	beforeEach(() => {
		shuffle(sample_nodes);
	});

	// Add elements
	test("Sort by name", () => {
		NodesModifiers.sort(sample_nodes, "name");

		expect(sample_nodes[0].title).toBe("a");
		expect(sample_nodes[2].title).toBe("b");
		expect(sample_nodes[n - 1].title).toBe("c");
	});
});
