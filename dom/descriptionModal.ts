import { Modal, App } from "obsidian";

export class DescriptionModal extends Modal {
	private result: string | undefined;
	private onSubmit: (result: string | undefined) => void;

	constructor(
		app: App,
		text: string | undefined,
		onSubmit: (result: string | undefined) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.result = text;
	}

	onOpen() {
		const { contentEl } = this;

		const body = contentEl.createEl("div", {
			cls: ["description-modal-body"],
		});

		const input = body.createEl("textarea", {
			cls: ["description-modal-input"],
		});

		const lambda = () => {
			this.result = input.value;
		};

		input.addEventListener("input", lambda);
		input.value = this.result || "";

		const submit_btn = createEl("button", { text: "Save" });
		submit_btn.addEventListener("click", (event) => {
			input.removeEventListener("input", lambda);
			this.close();
			this.onSubmit(this.result);
		});
		body.appendChild(submit_btn);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
