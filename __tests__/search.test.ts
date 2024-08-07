//Search tests

// Sort tests
import { CraftyNode, NodesExplorer } from "nodes/nodes";
import { beforeEach, describe, expect, test } from "vitest";

const sample_titles = [
	"Cascade",
	"Phoenix",
	"Nebula",
	"Horizon",
	"Mirage",
	"Dragon",
	"Odyssey",
	"Pinnacle",
	"Comet",
	"Aurora",
	"Eclipse",
	"Infinity",
	"Zenith",
	"Serenity",
	"Apple",
	"Banana",
	"Cherry",
	"Grape",
	"Kiwi",
	"Mango",
	"Orange",
	"Peach",
	"Pear",
	"Strawberry",
	"Watermelon",
	"Pineapple",
	"Blueberry",
	"Raspberry",
	"Blackberry",
	"Radiant",
	"Whispering",
	"Majestic",
	"Vibrant",
	"Enchanted",
	"Luminous",
	"Mystical",
	"Serene",
	"Wandering",
	"Cosmic",
	"Tranquil",
	"Energetic",
	"Celestial",
	"Harmonious",
	"Galactic",
	"Lion",
	"Tiger",
	"Elephant",
	"Zebra",
	"Giraffe",
	"Kangaroo",
	"Panda",
	"Koala",
	"Hippopotamus",
	"Dolphin",
	"Octopus",
	"Butterfly",
	"Hawk",
	"Owl",
	"Turtle",
];

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
		explorer.remove("empty");
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
		explorer.remove(node.title);

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

	test("Similar word search", () => {
		const explorer = new NodesExplorer();
		const words = [
			"hello",
			"hell",
			"heaven",
			"heavy",
			"halo",
			"hero",
			"help",
			"heat",
			"heap",
		];

		const test_cases = [
			["helo", 1, ["hello", "hell", "halo", "hero", "help"]],
			["heaven", 0, ["heaven"]],
			[
				"heav",
				2,
				["hell", "heaven", "heavy", "hero", "help", "heat", "heap"],
			],
			["hero", 1, ["hero"]],
			["heap", 0, ["heap"]],
			["he", 2, ["hell", "hero", "help", "heat", "heap"]],
			["hallo", 2, ["hello", "hell", "halo"]],
			["h", 1, []],
			["hll", 2, ["hello", "hell", "halo", "help"]],
			["hex", 2, ["hell", "hero", "help", "heat", "heap"]],
		];

		for (const idx in words) {
			explorer.add({
				id: `id_${idx}`,
				title: words[idx],
				description: "",
				container: null,
				selected: false,
				type: "file",
				extension: "canvas",
				created_at: 0,
				last_modified: 0,
			});
		}

		for (const el of test_cases) {
			//@ts-ignore
			const results = explorer.findSimilar(el[0], el[1]);
			//@ts-ignore

			expect(results.length).toBe(el[2].length);
			for (const node of results) {
				//@ts-ignore
				expect(el[2]).toContain(node.title);
			}
		}
	});

	// Simulation
	test("Multiple operation", () => {
		expect(explorer.size).toBe(0);
		const n = sample_titles.length;

		for (let i = 0; i < n; i++) {
			explorer.add({
				id: `id_${i}`,
				title: sample_titles[i],
				description: "",
				container: null,
				selected: false,
				type: "file",
				extension: "canvas",
				created_at: 0,
				last_modified: 0,
			});
		}
		expect(explorer.size).toBe(n);

		const search = explorer.search("Zebra");
		expect(search.length).toBe(1);
		expect(search[0].title).toBe("Zebra");

		let rm_count = 0;

		for (let i = 0; i < n; i += 2) {
			explorer.remove(sample_titles[i]);
			rm_count++;
		}
		expect(explorer.size).toBe(n - rm_count);
		for (let i = 1; i < n; i += 2) {
			explorer.add({
				id: `id_bis_${i}`,
				title: sample_titles[i],
				description: "",
				container: null,
				selected: false,
				type: "file",
				extension: "canvas",
				created_at: 0,
				last_modified: 0,
			});
		}

		for (let i = 1; i < n; i += 2) {
			const search = explorer.search(sample_titles[i]);
			expect(search.length).toBe(2);
			expect(search[0].title).toBe(sample_titles[i]);
			expect(search[0].id == search[1].id).toBe(false);
		}
	});
});
