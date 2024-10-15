//Search tests

// Sort tests
import { CraftyNode, NodesExplorer } from "nodes/nodes";
import { beforeEach, describe, expect, test } from "vitest";

// const sample_titles = [
// 	"Cascade",
// 	"Phoenix",
// 	"Nebula",
// 	"Horizon",
// 	"Mirage",
// 	"Dragon",
// 	"Odyssey",
// 	"Pinnacle",
// 	"Comet",
// 	"Aurora",
// 	"Eclipse",
// 	"Infinity",
// 	"Zenith",
// 	"Serenity",
// 	"Apple",
// 	"Banana",
// 	"Cherry",
// 	"Grape",
// 	"Kiwi",
// 	"Mango",
// 	"Orange",
// 	"Peach",
// 	"Pear",
// 	"Strawberry",
// 	"Watermelon",
// 	"Pineapple",
// 	"Blueberry",
// 	"Raspberry",
// 	"Blackberry",
// 	"Radiant",
// 	"Whispering",
// 	"Majestic",
// 	"Vibrant",
// 	"Enchanted",
// 	"Luminous",
// 	"Mystical",
// 	"Serene",
// 	"Wandering",
// 	"Cosmic",
// 	"Tranquil",
// 	"Energetic",
// 	"Celestial",
// 	"Harmonious",
// 	"Galactic",
// 	"Lion",
// 	"Tiger",
// 	"Elephant",
// 	"Zebra",
// 	"Giraffe",
// 	"Kangaroo",
// 	"Panda",
// 	"Koala",
// 	"Hippopotamus",
// 	"Dolphin",
// 	"Octopus",
// 	"Butterfly",
// 	"Hawk",
// 	"Owl",
// 	"Turtle",
// ];

const sample_nodes: CraftyNode[] = [
	{
		id: "s1",
		title: "node1",
		description: "",
		container: null,
		selected: false,
		type: "file",
		extension: "canvas",
		created_at: 0,
		last_modified: 0,
	},
	{
		id: "s2",
		title: "node2",
		description: "",
		container: null,
		selected: false,
		type: "file",
		extension: "canvas",
		created_at: 0,
		last_modified: 0,
	},
	{
		id: "s1",
		title: "node1",
		description: "node1 bis",
		container: null,
		selected: false,
		type: "file",
		extension: "canvas",
		created_at: 0,
		last_modified: 0,
	},
	{
		id: "s3",
		title: "node123",
		description: "description",
		container: null,
		selected: false,
		type: "file",
		extension: "canvas",
		created_at: 0,
		last_modified: 0,
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

		expect(explorer.size).toBe(sample_nodes[0].title.length);
	});

	test("Add multiple", () => {
		expect(explorer.size).toBe(0);

		explorer.add(sample_nodes[0]);
		explorer.add(sample_nodes[1]);

		expect(explorer.size).toBe(
			sample_nodes[0].title.length + sample_nodes[1].title.length
		);
	});

	test("Add multiple overlap", () => {
		expect(explorer.size).toBe(0);

		explorer.add(sample_nodes[0]);
		explorer.add(sample_nodes[2]);

		expect(explorer.size).toBe(sample_nodes[2].title.length);
	});

	// Remove elements
	test("Simple remove", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);
		explorer.remove(node);
		console.log(JSON.stringify(explorer));
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

	test("Search not exit", () => {
		expect(explorer.size).toBe(0);

		let search = explorer.search("empty");
		expect(search.length).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);

		search = explorer.search("empty");
		expect(search.length).toBe(0);
	});

	test("Search after remove", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		explorer.add(node);
		explorer.remove(node);

		const search = explorer.search(node.title);
		expect(search.length).toBe(0);
	});

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

	test("Prefix search", () => {
		expect(explorer.size).toBe(0);

		const node = sample_nodes[0];
		const node2 = sample_nodes[1];
		const node3 = sample_nodes[3];
		explorer.add(node);
		explorer.add(node2);
		explorer.add(node3);

		//@ts-ignore
		const search = explorer.prefixSearch("no");
		expect(search.length).toBe(3);
		expect(search).toContain(node);
		expect(search).toContain(node2);
		expect(search).toContain(node3);
	});
});
