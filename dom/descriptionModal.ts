import { Modal, App } from "obsidian";

export class DescriptionModal extends Modal {
	private result: string | undefined;
	private onSubmit: (result: string | undefined) => void;
	private text_area: HTMLTextAreaElement;
	private submit_btn: HTMLButtonElement;

	constructor(
		app: App,
		text: string | undefined,
		onSubmit: (result: string | undefined) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.result = text;
	}

	inputHandler(event: Event) {
		const text_area = event.target as HTMLTextAreaElement;
		this.result = text_area.value;
	}

	submitHandler(event: Event) {
		this.onSubmit(this.result);
		this.close();
	}

	onOpen() {
		const { contentEl } = this;

		const body = contentEl.createEl("div", {
			cls: ["description-modal-body"],
		});

		this.text_area = body.createEl("textarea", {
			cls: ["description-modal-input"],
		});
		this.text_area.addEventListener("input", this.inputHandler.bind(this));
		this.text_area.value = this.result || "";

		this.submit_btn = createEl("button", { text: "Save" });
		this.submit_btn.addEventListener(
			"click",
			this.submitHandler.bind(this)
		);
		body.appendChild(this.submit_btn);
		console.log(this);
	}

	onClose() {
		const { contentEl, text_area, submit_btn } = this;
		contentEl.empty();

		if (text_area) {
			this.text_area.removeEventListener("input", this.inputHandler);
		}

		if (submit_btn) {
			this.submit_btn.removeEventListener("click", this.submitHandler);
		}
	}
}
