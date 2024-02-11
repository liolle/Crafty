import { Modal, App } from "obsidian";

export class DescriptionModal extends Modal {
	private result: string | undefined;
	private onSubmit: (result: string | undefined) => void;
	private text_area: HTMLTextAreaElement;
	private save_btn: HTMLButtonElement;

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
		const inputChangeCallback = this.inputHandler.bind(this);
		//@ts-ignore
		this.text_area.inputChangeCallback = inputChangeCallback;
		this.text_area.addEventListener("input", inputChangeCallback);
		this.text_area.value = this.result || "";

		this.save_btn = createEl("button", { text: "Save" });
		const saveCallback = this.submitHandler.bind(this);
		//@ts-ignore
		this.save_btn.saveCallback = saveCallback;
		this.save_btn.addEventListener("click", saveCallback);
		body.appendChild(this.save_btn);
	}

	onClose() {
		const { contentEl, text_area, save_btn } = this;
		contentEl.empty();

		if (text_area) {
			//@ts-ignore
			if (this.text_area.inputChangeCallback) {
				this.text_area.removeEventListener(
					"input",
					//@ts-ignore
					this.text_area.inputChangeCallback
				);
			}
		}

		if (save_btn) {
			//@ts-ignore
			if (this.save_btn.saveCallback) {
				this.save_btn.removeEventListener(
					"click",
					//@ts-ignore
					this.save_btn.saveCallback
				);
			}
		}
	}
}
