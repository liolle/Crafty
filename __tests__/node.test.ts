//Search tests

// Sort tests
import { CraftyNode } from "nodes/nodes";
import {
	AudioSpecification,
	DocumentSpecification,
	FileSpecification,
	GroupSpecification,
	ImageSpecification,
	TextSpecification,
	VideoSpecification,
	WebSpecification,
} from "specification";
import { describe, expect, test } from "vitest";

const sample_nodes: CraftyNode[] = [
	{
		id: "id1",
		title: "a",
		description: "",
		container: null,
		selected: false,
		type: "file",
		extension: "canvas",
	},
	{
		id: "id2",
		title: "b",
		description: "",
		container: null,
		selected: false,
		type: "file",
		extension: "md",
	},
	{
		id: "id3",
		title: "c",
		description: "test",
		container: null,
		selected: false,
		type: "file",
		extension: "pdf",
	},
	{
		id: "id4",
		title: "az",
		description: "test",
		container: null,
		selected: false,
		type: "file",
		extension: "wav",
	},
	{
		id: "id5",
		title: "bc",
		description: "test",
		container: null,
		selected: false,
		type: "file",
		extension: "avif",
	},
	{
		id: "id5",
		title: "bc",
		description: "test",
		container: null,
		selected: false,
		type: "file",
		extension: "mp4",
	},
	{
		id: "id5",
		title: "bc",
		description: "test",
		container: null,
		selected: false,
		type: "text",
		extension: "",
	},
	{
		id: "id5",
		title: "bc",
		description: "test",
		container: null,
		selected: false,
		type: "link",
		extension: "",
	},
	{
		id: "id5",
		title: "bc",
		description: "test",
		container: null,
		selected: false,
		type: "group",
		extension: "",
	},
];

describe("Specification", () => {
	test("Audio specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "file",
			extension: "mp3",
		};

		const specification = new AudioSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});
	test("Image specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "file",
			extension: "jpg",
		};

		const specification = new ImageSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});
	test("Video specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "file",
			extension: "mp4",
		};

		const specification = new VideoSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});
	test("Document specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "file",
			extension: "pdf",
		};

		const specification = new DocumentSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});

	test("File specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "file",
			extension: "jpg",
		};

		const specification = new FileSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});
	test("Text specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "text",
			extension: "",
		};

		const specification = new TextSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});
	test("Web specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "file",
			extension: "mp3",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const specification = new WebSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});
	test("Group specification", () => {
		const node1: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "link",
			extension: "",
		};

		const node2: CraftyNode = {
			id: "id5",
			title: "bc",
			description: "test",
			container: null,
			selected: false,
			type: "group",
			extension: "",
		};

		const specification = new GroupSpecification<CraftyNode>();

		expect(specification.isSatisfied(node1)).toBe(false);
		expect(specification.isSatisfied(node2)).toBe(true);
	});

	test("Composed specification (and) ", () => {
		//
	});
	test("Composed specification (or) ", () => {
		// Audio or Video
		const audio = new AudioSpecification<CraftyNode>();
		const video = new VideoSpecification<CraftyNode>();

		const results = sample_nodes.filter((val) => {
			return audio.or(video).isSatisfied(val);
		});

		const audio_video = [
			"flac",
			"m4a",
			"mp3",
			"ogg",
			"wav",
			"webm",
			"3gp",
			"mkv",
			"mov",
			"mp4",
			"ogv",
			"webm",
		];
		expect(results.length).toBe(2);
		for (const el of results) expect(audio_video).toContain(el.extension);

		//Document of Webpage
		const document = new DocumentSpecification<CraftyNode>();
		const web = new WebSpecification<CraftyNode>();

		const results2 = sample_nodes.filter((val) => {
			return document.or(web).isSatisfied(val);
		});

		expect(results2.length).toBe(4);
		expect(results2[0].extension).toBe("canvas");
		expect(results2[1].extension).toBe("md");
		expect(results2[2].extension).toBe("pdf");
		expect(results2[3].type).toBe("link");
	});
	test("Composed specification (not) ", () => {
		// No documents
		const document = new DocumentSpecification<CraftyNode>();

		const results = sample_nodes.filter((val) => {
			return document.not().isSatisfied(val);
		});

		expect(results.length).toBe(6);
		expect(results[0].extension).toBe("wav");
		expect(results[2].extension).toBe("mp4");
		expect(results[4].type).toBe("link");
		expect(results[5].type).toBe("group");
	});
});
