export interface CanvasView {
	canvas: {
		selection: Set<{ id: string }>;
		nodes: Map<string, { nodeEl: HTMLElement; file: unknown }>;
		data: {
			nodes: Array<{
				id: string;
				title?: string;
				description?: string;
				type: string;
				file?: string;
				text?: string;
				label?: string;
				url?: string;
			}>;
		};
	};
}

export interface CanvasNodeStats {
	file: {
		stat: {
			ctime: number;
			mtime: number;
		};
	};
}
