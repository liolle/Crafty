var _a, _DOMHandler_freeSelectionListeners, _DOMHandler_freeNodesClickListeners, _DOMHandler_freeTitleEditListeners, _DOMHandler_freeSearchBarListeners, _DOMHandler_freeSortMenuListeners, _DOMHandler_freeFilterMenuBadgeListeners, _DOMHandler_toggleSortMenu, _DOMHandler_sortItemTemplate, _DOMHandler_getFilterSection, _DOMHandler_saveTitle;
import { __awaiter, __classPrivateFieldGet } from "tslib";
import { FileHandler } from "io/fileHandler";
import { debounce, setIcon } from "obsidian";
export class DOMHandler {
    static populateNodes(nodes) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = document.querySelector(".nodes-body");
            if (nodes == null || !body)
                return;
            __classPrivateFieldGet(_a, _a, "m", _DOMHandler_freeNodesClickListeners).call(_a);
            body.empty();
            for (const node of nodes) {
                const cls = ["node-element"];
                if (node.selected)
                    cls.push("node-active");
                const child = createEl("div", {
                    text: node.title,
                    attr: { class: cls.join(" ") },
                });
                const clickCallback = (event) => {
                    //@ts-ignore
                    node.container.click();
                };
                child.addEventListener("click", clickCallback);
                this.nodes_click_lister_cb.push(() => {
                    child.removeEventListener("click", clickCallback);
                });
                body.appendChild(child);
            }
        });
    }
    static showSelectedNode() {
        if (!this.crafty)
            return;
        const node = this.crafty.selectedNode;
        if (!node || this.last_node_id == node.id)
            return;
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeSelectionListeners).call(this);
        const title_container = this.getTitleDisplay();
        const title = title_container.querySelector("span");
        const text_area = this.getTextArea();
        const save_state = this.getSaveState();
        text_area.classList.remove("hidden");
        save_state.classList.remove("hidden");
        if (!title)
            return;
        // initial state
        title_container.classList.remove("hidden");
        title.setText(node.title);
        this.updateTextArea(node.description || "");
    }
    static showEmptyEdit() {
        return __awaiter(this, void 0, void 0, function* () {
            __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeSelectionListeners).call(this);
            const text_area = this.getTextArea();
            const save_state = this.getSaveState();
            text_area.classList.add("hidden");
            save_state.classList.add("hidden");
            _a.hideTitle();
        });
    }
    static showEmptyNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const search_bar = this.getSearchBar();
            const nodes_container = this.getNodesContainer();
            const sort_button = this.getSortButton();
            const filter_button = this.getFiltersButton();
            search_bar.classList.add("hidden");
            nodes_container.classList.add("hidden");
            sort_button.classList.add("hidden");
            filter_button.classList.add("hidden");
        });
    }
    static showNodes() {
        return __awaiter(this, void 0, void 0, function* () {
            const search_bar = this.getSearchBar();
            const nodes_container = this.getNodesContainer();
            const sort_button = this.getSortButton();
            const filter_button = this.getFiltersButton();
            search_bar.classList.remove("hidden");
            nodes_container.classList.remove("hidden");
            sort_button.classList.remove("hidden");
            filter_button.classList.remove("hidden");
        });
    }
    static hideTitle() {
        const title_display = this.getTitleDisplay();
        const title_input = this.getTitleInput();
        title_display.classList.add("hidden");
        title_input.classList.add("hidden");
    }
    static getTitleDisplay() {
        if (!this.titleDisplay) {
            const element = createEl("div", {
                attr: { class: "title-edit-div" },
            });
            element.createEl("span", {
                attr: { class: "title" },
            });
            const icon_container = element.createEl("span", {
                attr: { class: "edit-icon" },
            });
            setIcon(icon_container, "pencil");
            const icon_click_cb = () => {
                const input = _a.getTitleInput();
                element.classList.add("hidden");
                input.classList.remove("hidden");
                input.querySelector("input");
                const inner_input = input.querySelector("input");
                if (!inner_input)
                    return;
                const span = element.querySelector("span");
                inner_input.value = span.textContent || "";
                inner_input.focus();
            };
            icon_container.addEventListener("click", icon_click_cb);
            this.title_edit_lister_cb.push(() => {
                icon_container.removeEventListener("click", icon_click_cb);
            });
            this.titleDisplay = element;
        }
        return this.titleDisplay;
    }
    static getSaveState() {
        if (!this.save_state) {
            const save_state = createEl("span", {
                text: "Saved",
                attr: { class: "save_state" },
            });
            this.save_state = save_state;
        }
        return this.save_state;
    }
    static updateTextArea(value) {
        if (!this.crafty || !this.crafty.nodeState)
            return;
        if (this.crafty.nodeState.isNodeSame)
            return;
        const text_area = this.getTextArea();
        text_area.value = value;
    }
    static getTextArea() {
        var _b, _c;
        if (!this.textArea) {
            const element = createEl("textarea", {
                attr: { class: "description-input" },
            });
            this.textArea = element;
        }
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeSelectionListeners).call(this);
        this.textArea.spellcheck = (_c = (_b = this.crafty) === null || _b === void 0 ? void 0 : _b.settings.editor_spell_check_enabled) !== null && _c !== void 0 ? _c : false;
        const inputChangeCallback = debounce((t) => __awaiter(this, void 0, void 0, function* () {
            if (!this.crafty || !this.crafty.selectedNode || !this.textArea)
                return;
            const node = this.crafty.selectedNode;
            const file = this.crafty.currentFile;
            const vault = this.crafty.vault;
            const save_state = _a.getSaveState();
            save_state.setText("Saving...");
            node.description = this.textArea.value;
            yield FileHandler.updateCanvasNode(node, file, vault);
            setTimeout(() => {
                save_state.setText("Saved");
            }, 200);
        }), 1000, true);
        this.textArea.addEventListener("input", inputChangeCallback);
        this.selection_listeners_cb.push(() => {
            if (!this.textArea)
                return;
            this.textArea.removeEventListener("input", inputChangeCallback);
        });
        return this.textArea;
    }
    static getSearchBar() {
        if (!this.search_bar) {
            const search_bar = createEl("input", {
                attr: { class: "searchBar-input" },
            });
            search_bar.placeholder = "Search";
            const search_change_cb = debounce(() => {
                if (!this.crafty || !this.crafty.nodeState)
                    return;
                const node_state = this.crafty.nodeState;
                node_state.setSearchWord(search_bar.value);
            }, 1000);
            search_bar.addEventListener("input", search_change_cb);
            this.searchbar_lister_cb.push(() => {
                search_bar.removeEventListener("input", search_change_cb);
            });
            this.search_bar = search_bar;
        }
        return this.search_bar;
    }
    static getSortMenu() {
        if (!this.sort_menu) {
            const menu = createEl("sl-menu", {
                attr: { class: "sort-menu" },
            });
            const selectName = () => {
                if (!this.crafty || !this.crafty.nodeState)
                    return;
                this.crafty.nodeState.sortBy("name");
                __classPrivateFieldGet(this, _a, "m", _DOMHandler_toggleSortMenu).call(this);
            };
            const selectCreated = () => {
                if (!this.crafty || !this.crafty.nodeState)
                    return;
                this.crafty.nodeState.sortBy("created_at");
                __classPrivateFieldGet(this, _a, "m", _DOMHandler_toggleSortMenu).call(this);
            };
            const selectLastModified = () => {
                if (!this.crafty || !this.crafty.nodeState)
                    return;
                this.crafty.nodeState.sortBy("last_modified");
                __classPrivateFieldGet(this, _a, "m", _DOMHandler_toggleSortMenu).call(this);
            };
            const selectAscending = () => {
                if (!this.crafty || !this.crafty.nodeState)
                    return;
                this.crafty.nodeState.order("asc");
                __classPrivateFieldGet(this, _a, "m", _DOMHandler_toggleSortMenu).call(this);
            };
            const selectDescending = () => {
                if (!this.crafty || !this.crafty.nodeState)
                    return;
                this.crafty.nodeState.order("des");
                __classPrivateFieldGet(this, _a, "m", _DOMHandler_toggleSortMenu).call(this);
            };
            const pick_name = __classPrivateFieldGet(this, _a, "m", _DOMHandler_sortItemTemplate).call(this, "Name", "g1", "s-name", selectName);
            const pick_created = __classPrivateFieldGet(this, _a, "m", _DOMHandler_sortItemTemplate).call(this, "Created_At", "g1", "s-created", selectCreated);
            const pick_last = __classPrivateFieldGet(this, _a, "m", _DOMHandler_sortItemTemplate).call(this, "Last_Modified", "g1", "s-last", selectLastModified);
            const pick_asc = __classPrivateFieldGet(this, _a, "m", _DOMHandler_sortItemTemplate).call(this, "Ascending", "g2", "s-asc", selectAscending);
            const pick_desc = __classPrivateFieldGet(this, _a, "m", _DOMHandler_sortItemTemplate).call(this, "Descending", "g2", "s-desc", selectDescending);
            const divider = createEl("sl-divider", {});
            menu.appendChild(pick_name);
            menu.appendChild(pick_created);
            menu.appendChild(pick_last);
            menu.appendChild(divider);
            menu.appendChild(pick_asc);
            menu.appendChild(pick_desc);
            this.sort_menu = menu;
        }
        return this.sort_menu;
    }
    static getSortButton() {
        if (!this.sort_button) {
            const sort_button = createEl("sl-dropdown", {
                attr: {
                    class: "sort-button-container",
                    distance: "-40",
                    skidding: "-10",
                },
            });
            const button = createEl("button", {
                attr: { class: "sort-button", slot: "trigger" },
            });
            const text = createEl("span", {
                attr: { class: "sort-button-large sb-text" },
            });
            const logo = createEl("div", {});
            setIcon(logo, "arrow-down-up");
            button.appendChild(logo);
            button.appendChild(text);
            sort_button.appendChild(button);
            sort_button.appendChild(this.getSortMenu());
            this.sort_button = sort_button;
        }
        return this.sort_button;
    }
    static getNodesContainer() {
        if (!this.nodes_container) {
            const nodes_container = createEl("div", {
                attr: { class: "nodes-container" },
            });
            nodes_container.createEl("div", {
                attr: { class: "nodes-body" },
            });
            this.nodes_container = nodes_container;
        }
        return this.nodes_container;
    }
    static getFilterMenu() {
        if (!this.filter_menu) {
            __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeFilterMenuBadgeListeners).call(this);
            const filter_menu = createEl("sl-menu", {
                attr: {
                    class: "filter-menu",
                },
            });
            //Document
            const general = createEl("div", {
                attr: {
                    class: "filter-menu-section",
                },
            });
            const general_title = createEl("span", {});
            general_title.setText("General");
            general.appendChild(general_title);
            general.appendChild(__classPrivateFieldGet(this, _a, "m", _DOMHandler_getFilterSection).call(this, "General"));
            //Document
            const document = createEl("div", {
                attr: {
                    class: "filter-menu-section",
                },
            });
            const document_title = createEl("span", {});
            document_title.setText("Documents");
            document.appendChild(document_title);
            document.appendChild(__classPrivateFieldGet(this, _a, "m", _DOMHandler_getFilterSection).call(this, "Document"));
            //Image
            const image = createEl("div", {
                attr: {
                    class: "filter-menu-section",
                },
            });
            const image_title = createEl("span", {});
            image_title.setText("Image");
            image.appendChild(image_title);
            image.appendChild(__classPrivateFieldGet(this, _a, "m", _DOMHandler_getFilterSection).call(this, "Image"));
            //Audio
            const audio = createEl("div", {
                attr: {
                    class: "filter-menu-section",
                },
            });
            const audio_title = createEl("span", {});
            audio_title.setText("Audio");
            audio.appendChild(audio_title);
            audio.appendChild(__classPrivateFieldGet(this, _a, "m", _DOMHandler_getFilterSection).call(this, "Audio"));
            //Video
            const video = createEl("div", {
                attr: {
                    class: "filter-menu-section",
                },
            });
            const video_title = createEl("span", {});
            video_title.setText("Video");
            video.appendChild(video_title);
            video.appendChild(__classPrivateFieldGet(this, _a, "m", _DOMHandler_getFilterSection).call(this, "Image"));
            filter_menu.appendChild(general);
            filter_menu.appendChild(document);
            filter_menu.appendChild(image);
            filter_menu.appendChild(audio);
            filter_menu.appendChild(video);
            this.filter_menu = filter_menu;
        }
        return this.filter_menu;
    }
    static getFiltersButton() {
        if (!this.filter_button) {
            const filter_button = createEl("sl-dropdown", {
                attr: {
                    class: "",
                    distance: "-40",
                    skidding: "-10",
                },
            });
            const expand_button = createEl("button", {
                attr: { class: "filters-button", slot: "trigger" },
            });
            const logo_container = createEl("div", {});
            setIcon(logo_container, "plus");
            const button_text = createEl("span");
            button_text.setText("Filter");
            expand_button.appendChild(logo_container);
            expand_button.appendChild(button_text);
            filter_button.appendChild(expand_button);
            filter_button.appendChild(this.getFilterMenu());
            this.filter_button = filter_button;
        }
        return this.filter_button;
    }
    static getFiltersDisplay() {
        if (!this.filters_display) {
            const filters_display = createEl("div", {
                attr: { class: "filters_display" },
            });
            let filters = [];
            if (this.crafty && this.crafty.nodeFilterState) {
                filters = this.crafty.nodeFilterState.allFilters;
            }
            for (const el of filters) {
                const badge = createEl("div", {
                    attr: {
                        class: "filter-menu-badge-display",
                    },
                });
                const badge_span = createEl("span", {});
                badge_span.setText(el.title);
                badge.appendChild(badge_span);
                if (el.isActive)
                    badge.classList.add("badge-display-active");
                filters_display.appendChild(badge);
            }
            this.filters_display = filters_display;
        }
        return this.filters_display;
    }
    static getFiltersContainer() {
        if (!this.filters_container) {
            const container = createEl("div", {
                attr: {
                    class: "filters-container",
                },
            });
            container.appendChild(this.getFiltersDisplay());
            container.appendChild(this.getFiltersButton());
            this.filters_container = container;
        }
        return this.filters_container;
    }
    static setCraftyInstance(crafty) {
        this.crafty = crafty;
    }
    static getTitleInput() {
        if (!this.titleInput) {
            const element = createEl("div", {
                attr: { class: "title-edit-div hidden" },
            });
            const input = element.createEl("input", {
                attr: { class: "title-input" },
            });
            const input_focus_lost_cb = () => __awaiter(this, void 0, void 0, function* () {
                __classPrivateFieldGet(this, _a, "m", _DOMHandler_saveTitle).call(this, element, input);
            });
            const input_enter_cb = (ev) => __awaiter(this, void 0, void 0, function* () {
                if (ev.key == "Enter") {
                    __classPrivateFieldGet(this, _a, "m", _DOMHandler_saveTitle).call(this, element, input);
                }
            });
            input.addEventListener("focusout", input_focus_lost_cb);
            input.addEventListener("keydown", input_enter_cb);
            this.title_edit_lister_cb.push(() => {
                input.removeEventListener("keydown", input_enter_cb);
            });
            this.title_edit_lister_cb.push(() => {
                input.removeEventListener("focusout", input_focus_lost_cb);
            });
            this.titleInput = element;
        }
        return this.titleInput;
    }
    static free() {
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeNodesClickListeners).call(this);
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeSelectionListeners).call(this);
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeTitleEditListeners).call(this);
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeSearchBarListeners).call(this);
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeSortMenuListeners).call(this);
        __classPrivateFieldGet(this, _a, "m", _DOMHandler_freeFilterMenuBadgeListeners).call(this);
    }
}
_a = DOMHandler, _DOMHandler_freeSelectionListeners = function _DOMHandler_freeSelectionListeners() {
    let callback = this.selection_listeners_cb.pop();
    while (callback) {
        callback();
        callback = this.selection_listeners_cb.pop();
    }
}, _DOMHandler_freeNodesClickListeners = function _DOMHandler_freeNodesClickListeners() {
    let callback = this.nodes_click_lister_cb.pop();
    while (callback) {
        callback();
        callback = this.nodes_click_lister_cb.pop();
    }
}, _DOMHandler_freeTitleEditListeners = function _DOMHandler_freeTitleEditListeners() {
    let callback = this.title_edit_lister_cb.pop();
    while (callback) {
        callback();
        callback = this.title_edit_lister_cb.pop();
    }
}, _DOMHandler_freeSearchBarListeners = function _DOMHandler_freeSearchBarListeners() {
    let callback = this.searchbar_lister_cb.pop();
    while (callback) {
        callback();
        callback = this.searchbar_lister_cb.pop();
    }
}, _DOMHandler_freeSortMenuListeners = function _DOMHandler_freeSortMenuListeners() {
    let callback = this.sort_menu_lister_cb.pop();
    while (callback) {
        callback();
        callback = this.sort_menu_lister_cb.pop();
    }
}, _DOMHandler_freeFilterMenuBadgeListeners = function _DOMHandler_freeFilterMenuBadgeListeners() {
    let callback = this.filter_menu_badge_lister_cb.pop();
    while (callback) {
        callback();
        callback = this.filter_menu_badge_lister_cb.pop();
    }
}, _DOMHandler_toggleSortMenu = function _DOMHandler_toggleSortMenu() {
    const sort_button = this.getSortButton();
    const attributes_name = sort_button.getAttributeNames();
    if (attributes_name.includes("open"))
        sort_button.removeAttribute("open");
    else
        sort_button.setAttr("open", true);
}, _DOMHandler_sortItemTemplate = function _DOMHandler_sortItemTemplate(title, groupe, check_marker, callback) {
    const container = createEl("div", {
        attr: { class: `sort-item ` },
    });
    const item = createEl("div", {});
    item.setText(title);
    const check_logo = createEl("div", {
        attr: { class: `${groupe} sort-check ${check_marker}` },
    });
    setIcon(check_logo, "check");
    container.addEventListener("click", callback);
    this.sort_menu_lister_cb.push(() => {
        container.removeEventListener("click", callback);
    });
    container.appendChild(check_logo);
    container.appendChild(item);
    return container;
}, _DOMHandler_getFilterSection = function _DOMHandler_getFilterSection(group) {
    const container = createEl("div", {
        attr: {
            class: "filter-menu-badge-container",
        },
    });
    let filters = [];
    switch (group) {
        case "Document":
            if (this.crafty && this.crafty.nodeFilterState) {
                filters =
                    this.crafty.nodeFilterState.getFilterByGroup("Document");
            }
            break;
        case "Image":
            if (this.crafty && this.crafty.nodeFilterState) {
                filters =
                    this.crafty.nodeFilterState.getFilterByGroup("Image");
            }
            break;
        case "Audio":
            if (this.crafty && this.crafty.nodeFilterState) {
                filters =
                    this.crafty.nodeFilterState.getFilterByGroup("Audio");
            }
            break;
        case "Video":
            if (this.crafty && this.crafty.nodeFilterState) {
                filters =
                    this.crafty.nodeFilterState.getFilterByGroup("Video");
            }
            break;
        case "General":
            if (this.crafty && this.crafty.nodeFilterState) {
                filters =
                    this.crafty.nodeFilterState.getFilterByGroup("General");
            }
            break;
        default:
            break;
    }
    for (const el of filters) {
        const badge = createEl("div", {
            attr: {
                class: "filter-menu-badge",
            },
        });
        const badge_span = createEl("span", {});
        badge_span.setText(el.title);
        badge.appendChild(badge_span);
        const badge_click_cb = () => {
            if (badge.classList.contains("badge-active")) {
                if (this.crafty && this.crafty.nodeFilterState) {
                    this.crafty.nodeFilterState.removeFilter(el.title);
                }
                badge.classList.remove("badge-active");
            }
            else {
                if (this.crafty && this.crafty.nodeFilterState) {
                    this.crafty.nodeFilterState.addFilter(el.title);
                }
                badge.classList.add("badge-active");
            }
        };
        badge.addEventListener("click", badge_click_cb);
        this.filter_menu_badge_lister_cb.push(() => {
            badge.removeEventListener("click", badge_click_cb);
        });
        container.appendChild(badge);
    }
    return container;
}, _DOMHandler_saveTitle = function _DOMHandler_saveTitle(element, input) {
    return __awaiter(this, void 0, void 0, function* () {
        const display = _a.getTitleDisplay();
        element.classList.add("hidden");
        display.classList.remove("hidden");
        if (!this.crafty || !this.crafty.selectedNode || !this.textArea)
            return;
        const node = this.crafty.selectedNode;
        const file = this.crafty.currentFile;
        const vault = this.crafty.vault;
        node.title = input.value;
        yield FileHandler.updateCanvasNode(node, file, vault);
    });
};
DOMHandler.selection_listeners_cb = [];
DOMHandler.nodes_click_lister_cb = [];
DOMHandler.title_edit_lister_cb = [];
DOMHandler.searchbar_lister_cb = [];
DOMHandler.sort_menu_lister_cb = [];
DOMHandler.filter_menu_badge_lister_cb = [];
DOMHandler.last_node_id = "";
DOMHandler.titleInput = null;
DOMHandler.titleDisplay = null;
DOMHandler.textArea = null;
DOMHandler.save_state = null;
DOMHandler.search_bar = null;
DOMHandler.nodes_container = null;
DOMHandler.filters_container = null;
DOMHandler.filters_display = null;
DOMHandler.sort_button = null;
DOMHandler.filter_button = null;
DOMHandler.sort_menu = null;
DOMHandler.filter_menu = null;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFuZGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhhbmRsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFHN0MsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFFN0MsTUFBTSxPQUFPLFVBQVU7SUFzRXRCLE1BQU0sQ0FBTyxhQUFhLENBQUMsS0FBMEI7O1lBQ3BELE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFbkQsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSTtnQkFBRSxPQUFPO1lBQ25DLHVCQUFBLEVBQVUsK0NBQXlCLE1BQW5DLEVBQVUsQ0FBMkIsQ0FBQztZQUN0QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFYixLQUFLLE1BQU0sSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUMxQixNQUFNLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLElBQUksQ0FBQyxRQUFRO29CQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzNDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUU7b0JBQzdCLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSztvQkFDaEIsSUFBSSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7aUJBQzlCLENBQUMsQ0FBQztnQkFFSCxNQUFNLGFBQWEsR0FBRyxDQUFDLEtBQVksRUFBRSxFQUFFO29CQUN0QyxZQUFZO29CQUNaLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3hCLENBQUMsQ0FBQztnQkFDRixLQUFLLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxD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Q0FBc0I7QUFDekMsc0NBQTJCLEdBQW1CLEVBQUUsQUFBckIsQ0FBc0I7QUFDakQsdUJBQVksR0FBRyxFQUFFLEFBQUwsQ0FBTTtBQUNsQixxQkFBVSxHQUEwQixJQUFJLEFBQTlCLENBQStCO0FBQ3pDLHVCQUFZLEdBQTBCLElBQUksQUFBOUIsQ0FBK0I7QUFDM0MsbUJBQVEsR0FBK0IsSUFBSSxBQUFuQyxDQUFvQztBQUM1QyxxQkFBVSxHQUEyQixJQUFJLEFBQS9CLENBQWdDO0FBQzFDLHFCQUFVLEdBQTRCLElBQUksQUFBaEMsQ0FBaUM7QUFDM0MsMEJBQWUsR0FBMEIsSUFBSSxBQUE5QixDQUErQjtBQUM5Qyw0QkFBaUIsR0FBMEIsSUFBSSxBQUE5QixDQUErQjtBQUNoRCwwQkFBZSxHQUEwQixJQUFJLEFBQTlCLENBQStCO0FBQzlDLHNCQUFXLEdBQXNCLElBQUksQUFBMUIsQ0FBMkI7QUFDdEMsd0JBQWEsR0FBc0IsSUFBSSxBQUExQixDQUEyQjtBQUN4QyxvQkFBUyxHQUFrQixJQUFJLEFBQXRCLENBQXVCO0FBQ2hDLHNCQUFXLEdBQWtCLElBQUksQUFBdEIsQ0FBdUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTbERyb3Bkb3duLCBTbE1lbnUgfSBmcm9tIFwiQHNob2VsYWNlLXN0eWxlL3Nob2VsYWNlXCI7XG5pbXBvcnQgeyBGaWxlSGFuZGxlciB9IGZyb20gXCJpby9maWxlSGFuZGxlclwiO1xuaW1wb3J0IENyYWZ0eSBmcm9tIFwibWFpblwiO1xuaW1wb3J0IHsgQ3JhZnR5Tm9kZSwgRklMRV9UWVBFLCBOb2RlRmlsdGVyIH0gZnJvbSBcIm5vZGVzL25vZGVzXCI7XG5pbXBvcnQgeyBkZWJvdW5jZSwgc2V0SWNvbiB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgRE9NSGFuZGxlciB7XG5cdHByaXZhdGUgc3RhdGljIHNlbGVjdGlvbl9saXN0ZW5lcnNfY2I6ICgoKSA9PiB2b2lkKVtdID0gW107XG5cdHByaXZhdGUgc3RhdGljIG5vZGVzX2NsaWNrX2xpc3Rlcl9jYjogKCgpID0+IHZvaWQpW10gPSBbXTtcblx0cHJpdmF0ZSBzdGF0aWMgdGl0bGVfZWRpdF9saXN0ZXJfY2I6ICgoKSA9PiB2b2lkKVtdID0gW107XG5cdHByaXZhdGUgc3RhdGljIHNlYXJjaGJhcl9saXN0ZXJfY2I6ICgoKSA9PiB2b2lkKVtdID0gW107XG5cdHByaXZhdGUgc3RhdGljIHNvcnRfbWVudV9saXN0ZXJfY2I6ICgoKSA9PiB2b2lkKVtdID0gW107XG5cdHByaXZhdGUgc3RhdGljIGZpbHRlcl9tZW51X2JhZGdlX2xpc3Rlcl9jYjogKCgpID0+IHZvaWQpW10gPSBbXTtcblx0cHJpdmF0ZSBzdGF0aWMgbGFzdF9ub2RlX2lkID0gXCJcIjtcblx0cHJpdmF0ZSBzdGF0aWMgdGl0bGVJbnB1dDogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBzdGF0aWMgdGl0bGVEaXNwbGF5OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHN0YXRpYyB0ZXh0QXJlYTogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHN0YXRpYyBzYXZlX3N0YXRlOiBIVE1MU3BhbkVsZW1lbnQgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBzdGF0aWMgc2VhcmNoX2JhcjogSFRNTElucHV0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHN0YXRpYyBub2Rlc19jb250YWluZXI6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgc3RhdGljIGZpbHRlcnNfY29udGFpbmVyOiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHN0YXRpYyBmaWx0ZXJzX2Rpc3BsYXk6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgc3RhdGljIHNvcnRfYnV0dG9uOiBTbERyb3Bkb3duIHwgbnVsbCA9IG51bGw7XG5cdHByaXZhdGUgc3RhdGljIGZpbHRlcl9idXR0b246IFNsRHJvcGRvd24gfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBzdGF0aWMgc29ydF9tZW51OiBTbE1lbnUgfCBudWxsID0gbnVsbDtcblx0cHJpdmF0ZSBzdGF0aWMgZmlsdGVyX21lbnU6IFNsTWVudSB8IG51bGwgPSBudWxsO1xuXHRwcml2YXRlIHN0YXRpYyBjcmFmdHk6IENyYWZ0eSB8IG51bGw7XG5cblx0c3RhdGljICNmcmVlU2VsZWN0aW9uTGlzdGVuZXJzKCkge1xuXHRcdGxldCBjYWxsYmFjayA9IHRoaXMuc2VsZWN0aW9uX2xpc3RlbmVyc19jYi5wb3AoKTtcblx0XHR3aGlsZSAoY2FsbGJhY2spIHtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHRjYWxsYmFjayA9IHRoaXMuc2VsZWN0aW9uX2xpc3RlbmVyc19jYi5wb3AoKTtcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgI2ZyZWVOb2Rlc0NsaWNrTGlzdGVuZXJzKCkge1xuXHRcdGxldCBjYWxsYmFjayA9IHRoaXMubm9kZXNfY2xpY2tfbGlzdGVyX2NiLnBvcCgpO1xuXHRcdHdoaWxlIChjYWxsYmFjaykge1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdGNhbGxiYWNrID0gdGhpcy5ub2Rlc19jbGlja19saXN0ZXJfY2IucG9wKCk7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljICNmcmVlVGl0bGVFZGl0TGlzdGVuZXJzKCkge1xuXHRcdGxldCBjYWxsYmFjayA9IHRoaXMudGl0bGVfZWRpdF9saXN0ZXJfY2IucG9wKCk7XG5cdFx0d2hpbGUgKGNhbGxiYWNrKSB7XG5cdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0Y2FsbGJhY2sgPSB0aGlzLnRpdGxlX2VkaXRfbGlzdGVyX2NiLnBvcCgpO1xuXHRcdH1cblx0fVxuXG5cdHN0YXRpYyAjZnJlZVNlYXJjaEJhckxpc3RlbmVycygpIHtcblx0XHRsZXQgY2FsbGJhY2sgPSB0aGlzLnNlYXJjaGJhcl9saXN0ZXJfY2IucG9wKCk7XG5cdFx0d2hpbGUgKGNhbGxiYWNrKSB7XG5cdFx0XHRjYWxsYmFjaygpO1xuXHRcdFx0Y2FsbGJhY2sgPSB0aGlzLnNlYXJjaGJhcl9saXN0ZXJfY2IucG9wKCk7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljICNmcmVlU29ydE1lbnVMaXN0ZW5lcnMoKSB7XG5cdFx0bGV0IGNhbGxiYWNrID0gdGhpcy5zb3J0X21lbnVfbGlzdGVyX2NiLnBvcCgpO1xuXHRcdHdoaWxlIChjYWxsYmFjaykge1xuXHRcdFx0Y2FsbGJhY2soKTtcblx0XHRcdGNhbGxiYWNrID0gdGhpcy5zb3J0X21lbnVfbGlzdGVyX2NiLnBvcCgpO1xuXHRcdH1cblx0fVxuXG5cdHN0YXRpYyAjZnJlZUZpbHRlck1lbnVCYWRnZUxpc3RlbmVycygpIHtcblx0XHRsZXQgY2FsbGJhY2sgPSB0aGlzLmZpbHRlcl9tZW51X2JhZGdlX2xpc3Rlcl9jYi5wb3AoKTtcblx0XHR3aGlsZSAoY2FsbGJhY2spIHtcblx0XHRcdGNhbGxiYWNrKCk7XG5cdFx0XHRjYWxsYmFjayA9IHRoaXMuZmlsdGVyX21lbnVfYmFkZ2VfbGlzdGVyX2NiLnBvcCgpO1xuXHRcdH1cblx0fVxuXG5cdHN0YXRpYyBhc3luYyBwb3B1bGF0ZU5vZGVzKG5vZGVzOiBDcmFmdHlOb2RlW10gfCBudWxsKSB7XG5cdFx0Y29uc3QgYm9keSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIubm9kZXMtYm9keVwiKTtcblxuXHRcdGlmIChub2RlcyA9PSBudWxsIHx8ICFib2R5KSByZXR1cm47XG5cdFx0RE9NSGFuZGxlci4jZnJlZU5vZGVzQ2xpY2tMaXN0ZW5lcnMoKTtcblx0XHRib2R5LmVtcHR5KCk7XG5cblx0XHRmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcblx0XHRcdGNvbnN0IGNscyA9IFtcIm5vZGUtZWxlbWVudFwiXTtcblx0XHRcdGlmIChub2RlLnNlbGVjdGVkKSBjbHMucHVzaChcIm5vZGUtYWN0aXZlXCIpO1xuXHRcdFx0Y29uc3QgY2hpbGQgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdHRleHQ6IG5vZGUudGl0bGUsXG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IGNscy5qb2luKFwiIFwiKSB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGNsaWNrQ2FsbGJhY2sgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG5cdFx0XHRcdC8vQHRzLWlnbm9yZVxuXHRcdFx0XHRub2RlLmNvbnRhaW5lci5jbGljaygpO1xuXHRcdFx0fTtcblx0XHRcdGNoaWxkLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbGlja0NhbGxiYWNrKTtcblxuXHRcdFx0dGhpcy5ub2Rlc19jbGlja19saXN0ZXJfY2IucHVzaCgoKSA9PiB7XG5cdFx0XHRcdGNoaWxkLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBjbGlja0NhbGxiYWNrKTtcblx0XHRcdH0pO1xuXG5cdFx0XHRib2R5LmFwcGVuZENoaWxkKGNoaWxkKTtcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgc2hvd1NlbGVjdGVkTm9kZSgpIHtcblx0XHRpZiAoIXRoaXMuY3JhZnR5KSByZXR1cm47XG5cdFx0Y29uc3Qgbm9kZSA9IHRoaXMuY3JhZnR5LnNlbGVjdGVkTm9kZTtcblx0XHRpZiAoIW5vZGUgfHwgdGhpcy5sYXN0X25vZGVfaWQgPT0gbm9kZS5pZCkgcmV0dXJuO1xuXHRcdHRoaXMuI2ZyZWVTZWxlY3Rpb25MaXN0ZW5lcnMoKTtcblx0XHRjb25zdCB0aXRsZV9jb250YWluZXIgPSB0aGlzLmdldFRpdGxlRGlzcGxheSgpO1xuXHRcdGNvbnN0IHRpdGxlID0gdGl0bGVfY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoXCJzcGFuXCIpO1xuXG5cdFx0Y29uc3QgdGV4dF9hcmVhID0gdGhpcy5nZXRUZXh0QXJlYSgpO1xuXHRcdGNvbnN0IHNhdmVfc3RhdGUgPSB0aGlzLmdldFNhdmVTdGF0ZSgpO1xuXG5cdFx0dGV4dF9hcmVhLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cdFx0c2F2ZV9zdGF0ZS5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuXG5cdFx0aWYgKCF0aXRsZSkgcmV0dXJuO1xuXG5cdFx0Ly8gaW5pdGlhbCBzdGF0ZVxuXG5cdFx0dGl0bGVfY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cdFx0dGl0bGUuc2V0VGV4dChub2RlLnRpdGxlKTtcblx0XHR0aGlzLnVwZGF0ZVRleHRBcmVhKG5vZGUuZGVzY3JpcHRpb24gfHwgXCJcIik7XG5cdH1cblxuXHRzdGF0aWMgYXN5bmMgc2hvd0VtcHR5RWRpdCgpIHtcblx0XHR0aGlzLiNmcmVlU2VsZWN0aW9uTGlzdGVuZXJzKCk7XG5cblx0XHRjb25zdCB0ZXh0X2FyZWEgPSB0aGlzLmdldFRleHRBcmVhKCk7XG5cdFx0Y29uc3Qgc2F2ZV9zdGF0ZSA9IHRoaXMuZ2V0U2F2ZVN0YXRlKCk7XG5cblx0XHR0ZXh0X2FyZWEuY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcblx0XHRzYXZlX3N0YXRlLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG5cblx0XHRET01IYW5kbGVyLmhpZGVUaXRsZSgpO1xuXHR9XG5cblx0c3RhdGljIGFzeW5jIHNob3dFbXB0eU5vZGVzKCkge1xuXHRcdGNvbnN0IHNlYXJjaF9iYXIgPSB0aGlzLmdldFNlYXJjaEJhcigpO1xuXHRcdGNvbnN0IG5vZGVzX2NvbnRhaW5lciA9IHRoaXMuZ2V0Tm9kZXNDb250YWluZXIoKTtcblx0XHRjb25zdCBzb3J0X2J1dHRvbiA9IHRoaXMuZ2V0U29ydEJ1dHRvbigpO1xuXHRcdGNvbnN0IGZpbHRlcl9idXR0b24gPSB0aGlzLmdldEZpbHRlcnNCdXR0b24oKTtcblx0XHRzZWFyY2hfYmFyLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG5cdFx0bm9kZXNfY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG5cdFx0c29ydF9idXR0b24uY2xhc3NMaXN0LmFkZChcImhpZGRlblwiKTtcblx0XHRmaWx0ZXJfYnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG5cdH1cblxuXHRzdGF0aWMgYXN5bmMgc2hvd05vZGVzKCkge1xuXHRcdGNvbnN0IHNlYXJjaF9iYXIgPSB0aGlzLmdldFNlYXJjaEJhcigpO1xuXHRcdGNvbnN0IG5vZGVzX2NvbnRhaW5lciA9IHRoaXMuZ2V0Tm9kZXNDb250YWluZXIoKTtcblx0XHRjb25zdCBzb3J0X2J1dHRvbiA9IHRoaXMuZ2V0U29ydEJ1dHRvbigpO1xuXHRcdGNvbnN0IGZpbHRlcl9idXR0b24gPSB0aGlzLmdldEZpbHRlcnNCdXR0b24oKTtcblx0XHRzZWFyY2hfYmFyLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cdFx0bm9kZXNfY29udGFpbmVyLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cdFx0c29ydF9idXR0b24uY2xhc3NMaXN0LnJlbW92ZShcImhpZGRlblwiKTtcblx0XHRmaWx0ZXJfYnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRkZW5cIik7XG5cdH1cblxuXHRzdGF0aWMgaGlkZVRpdGxlKCkge1xuXHRcdGNvbnN0IHRpdGxlX2Rpc3BsYXkgPSB0aGlzLmdldFRpdGxlRGlzcGxheSgpO1xuXHRcdGNvbnN0IHRpdGxlX2lucHV0ID0gdGhpcy5nZXRUaXRsZUlucHV0KCk7XG5cdFx0dGl0bGVfZGlzcGxheS5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuXHRcdHRpdGxlX2lucHV0LmNsYXNzTGlzdC5hZGQoXCJoaWRkZW5cIik7XG5cdH1cblxuXHRzdGF0aWMgZ2V0VGl0bGVEaXNwbGF5KCkge1xuXHRcdGlmICghdGhpcy50aXRsZURpc3BsYXkpIHtcblx0XHRcdGNvbnN0IGVsZW1lbnQgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwidGl0bGUtZWRpdC1kaXZcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGVsZW1lbnQuY3JlYXRlRWwoXCJzcGFuXCIsIHtcblx0XHRcdFx0YXR0cjogeyBjbGFzczogXCJ0aXRsZVwiIH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgaWNvbl9jb250YWluZXIgPSBlbGVtZW50LmNyZWF0ZUVsKFwic3BhblwiLCB7XG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwiZWRpdC1pY29uXCIgfSxcblx0XHRcdH0pO1xuXG5cdFx0XHRzZXRJY29uKGljb25fY29udGFpbmVyLCBcInBlbmNpbFwiKTtcblxuXHRcdFx0Y29uc3QgaWNvbl9jbGlja19jYiA9ICgpID0+IHtcblx0XHRcdFx0Y29uc3QgaW5wdXQgPSBET01IYW5kbGVyLmdldFRpdGxlSW5wdXQoKTtcblx0XHRcdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuXHRcdFx0XHRpbnB1dC5jbGFzc0xpc3QucmVtb3ZlKFwiaGlkZGVuXCIpO1xuXHRcdFx0XHRpbnB1dC5xdWVyeVNlbGVjdG9yKFwiaW5wdXRcIik7XG5cdFx0XHRcdGNvbnN0IGlubmVyX2lucHV0ID0gaW5wdXQucXVlcnlTZWxlY3RvcihcImlucHV0XCIpO1xuXHRcdFx0XHRpZiAoIWlubmVyX2lucHV0KSByZXR1cm47XG5cdFx0XHRcdGNvbnN0IHNwYW46IEhUTUxTcGFuRWxlbWVudCA9IGVsZW1lbnQucXVlcnlTZWxlY3Rvcihcblx0XHRcdFx0XHRcInNwYW5cIlxuXHRcdFx0XHQpIGFzIEhUTUxTcGFuRWxlbWVudDtcblxuXHRcdFx0XHRpbm5lcl9pbnB1dC52YWx1ZSA9IHNwYW4udGV4dENvbnRlbnQgfHwgXCJcIjtcblx0XHRcdFx0aW5uZXJfaW5wdXQuZm9jdXMoKTtcblx0XHRcdH07XG5cdFx0XHRpY29uX2NvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgaWNvbl9jbGlja19jYik7XG5cblx0XHRcdHRoaXMudGl0bGVfZWRpdF9saXN0ZXJfY2IucHVzaCgoKSA9PiB7XG5cdFx0XHRcdGljb25fY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBpY29uX2NsaWNrX2NiKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLnRpdGxlRGlzcGxheSA9IGVsZW1lbnQ7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnRpdGxlRGlzcGxheTtcblx0fVxuXG5cdHN0YXRpYyBnZXRTYXZlU3RhdGUoKSB7XG5cdFx0aWYgKCF0aGlzLnNhdmVfc3RhdGUpIHtcblx0XHRcdGNvbnN0IHNhdmVfc3RhdGUgPSBjcmVhdGVFbChcInNwYW5cIiwge1xuXHRcdFx0XHR0ZXh0OiBcIlNhdmVkXCIsXG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwic2F2ZV9zdGF0ZVwiIH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy5zYXZlX3N0YXRlID0gc2F2ZV9zdGF0ZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuc2F2ZV9zdGF0ZTtcblx0fVxuXG5cdHN0YXRpYyB1cGRhdGVUZXh0QXJlYSh2YWx1ZTogc3RyaW5nKSB7XG5cdFx0aWYgKCF0aGlzLmNyYWZ0eSB8fCAhdGhpcy5jcmFmdHkubm9kZVN0YXRlKSByZXR1cm47XG5cdFx0aWYgKHRoaXMuY3JhZnR5Lm5vZGVTdGF0ZS5pc05vZGVTYW1lKSByZXR1cm47XG5cdFx0Y29uc3QgdGV4dF9hcmVhID0gdGhpcy5nZXRUZXh0QXJlYSgpO1xuXHRcdHRleHRfYXJlYS52YWx1ZSA9IHZhbHVlO1xuXHR9XG5cblx0c3RhdGljIGdldFRleHRBcmVhKCkge1xuXHRcdGlmICghdGhpcy50ZXh0QXJlYSkge1xuXHRcdFx0Y29uc3QgZWxlbWVudCA9IGNyZWF0ZUVsKFwidGV4dGFyZWFcIiwge1xuXHRcdFx0XHRhdHRyOiB7IGNsYXNzOiBcImRlc2NyaXB0aW9uLWlucHV0XCIgfSxcblxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMudGV4dEFyZWEgPSBlbGVtZW50O1xuXHRcdH1cblxuXHRcdHRoaXMuI2ZyZWVTZWxlY3Rpb25MaXN0ZW5lcnMoKTtcblx0XHR0aGlzLnRleHRBcmVhLnNwZWxsY2hlY2sgPSB0aGlzLmNyYWZ0eT8uc2V0dGluZ3MuZWRpdG9yX3NwZWxsX2NoZWNrX2VuYWJsZWQgPz8gZmFsc2U7XG5cblx0XHRjb25zdCBpbnB1dENoYW5nZUNhbGxiYWNrID0gZGVib3VuY2UoXG5cdFx0XHRhc3luYyAodCkgPT4ge1xuXHRcdFx0XHRpZiAoIXRoaXMuY3JhZnR5IHx8ICF0aGlzLmNyYWZ0eS5zZWxlY3RlZE5vZGUgfHwgIXRoaXMudGV4dEFyZWEpXG5cdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdGNvbnN0IG5vZGUgPSB0aGlzLmNyYWZ0eS5zZWxlY3RlZE5vZGU7XG5cdFx0XHRcdGNvbnN0IGZpbGUgPSB0aGlzLmNyYWZ0eS5jdXJyZW50RmlsZTtcblx0XHRcdFx0Y29uc3QgdmF1bHQgPSB0aGlzLmNyYWZ0eS52YXVsdDtcblx0XHRcdFx0Y29uc3Qgc2F2ZV9zdGF0ZSA9IERPTUhhbmRsZXIuZ2V0U2F2ZVN0YXRlKCk7XG5cdFx0XHRcdHNhdmVfc3RhdGUuc2V0VGV4dChcIlNhdmluZy4uLlwiKTtcblx0XHRcdFx0bm9kZS5kZXNjcmlwdGlvbiA9IHRoaXMudGV4dEFyZWEudmFsdWU7XG5cdFx0XHRcdGF3YWl0IEZpbGVIYW5kbGVyLnVwZGF0ZUNhbnZhc05vZGUobm9kZSwgZmlsZSwgdmF1bHQpO1xuXHRcdFx0XHRzZXRUaW1lb3V0KCgpID0+IHtcblx0XHRcdFx0XHRzYXZlX3N0YXRlLnNldFRleHQoXCJTYXZlZFwiKTtcblx0XHRcdFx0fSwgMjAwKTtcblx0XHRcdH0sXG5cdFx0XHQxMDAwLFxuXHRcdFx0dHJ1ZVxuXHRcdCk7XG5cblx0XHR0aGlzLnRleHRBcmVhLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBpbnB1dENoYW5nZUNhbGxiYWNrKTtcblx0XHR0aGlzLnNlbGVjdGlvbl9saXN0ZW5lcnNfY2IucHVzaCgoKSA9PiB7XG5cdFx0XHRpZiAoIXRoaXMudGV4dEFyZWEpIHJldHVybjtcblx0XHRcdHRoaXMudGV4dEFyZWEucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImlucHV0XCIsIGlucHV0Q2hhbmdlQ2FsbGJhY2spO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzLnRleHRBcmVhO1xuXHR9XG5cblx0c3RhdGljIGdldFNlYXJjaEJhcigpIHtcblx0XHRpZiAoIXRoaXMuc2VhcmNoX2Jhcikge1xuXHRcdFx0Y29uc3Qgc2VhcmNoX2JhciA9IGNyZWF0ZUVsKFwiaW5wdXRcIiwge1xuXHRcdFx0XHRhdHRyOiB7IGNsYXNzOiBcInNlYXJjaEJhci1pbnB1dFwiIH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0c2VhcmNoX2Jhci5wbGFjZWhvbGRlciA9IFwiU2VhcmNoXCI7XG5cdFx0XHRjb25zdCBzZWFyY2hfY2hhbmdlX2NiID0gZGVib3VuY2UoKCkgPT4ge1xuXHRcdFx0XHRpZiAoIXRoaXMuY3JhZnR5IHx8ICF0aGlzLmNyYWZ0eS5ub2RlU3RhdGUpIHJldHVybjtcblx0XHRcdFx0Y29uc3Qgbm9kZV9zdGF0ZSA9IHRoaXMuY3JhZnR5Lm5vZGVTdGF0ZTtcblx0XHRcdFx0bm9kZV9zdGF0ZS5zZXRTZWFyY2hXb3JkKHNlYXJjaF9iYXIudmFsdWUpO1xuXHRcdFx0fSwgMTAwMCk7XG5cdFx0XHRzZWFyY2hfYmFyLmFkZEV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBzZWFyY2hfY2hhbmdlX2NiKTtcblxuXHRcdFx0dGhpcy5zZWFyY2hiYXJfbGlzdGVyX2NiLnB1c2goKCkgPT4ge1xuXHRcdFx0XHRzZWFyY2hfYmFyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJpbnB1dFwiLCBzZWFyY2hfY2hhbmdlX2NiKTtcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5zZWFyY2hfYmFyID0gc2VhcmNoX2Jhcjtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5zZWFyY2hfYmFyO1xuXHR9XG5cblx0c3RhdGljICN0b2dnbGVTb3J0TWVudSgpIHtcblx0XHRjb25zdCBzb3J0X2J1dHRvbiA9IHRoaXMuZ2V0U29ydEJ1dHRvbigpO1xuXHRcdGNvbnN0IGF0dHJpYnV0ZXNfbmFtZSA9IHNvcnRfYnV0dG9uLmdldEF0dHJpYnV0ZU5hbWVzKCk7XG5cdFx0aWYgKGF0dHJpYnV0ZXNfbmFtZS5pbmNsdWRlcyhcIm9wZW5cIikpXG5cdFx0XHRzb3J0X2J1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoXCJvcGVuXCIpO1xuXHRcdGVsc2Ugc29ydF9idXR0b24uc2V0QXR0cihcIm9wZW5cIiwgdHJ1ZSk7XG5cdH1cblxuXHRzdGF0aWMgI3NvcnRJdGVtVGVtcGxhdGUoXG5cdFx0dGl0bGU6IHN0cmluZyxcblx0XHRncm91cGU6IHN0cmluZyxcblx0XHRjaGVja19tYXJrZXI6IHN0cmluZyxcblx0XHRjYWxsYmFjazogKCkgPT4gdm9pZFxuXHQpIHtcblx0XHRjb25zdCBjb250YWluZXIgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRhdHRyOiB7IGNsYXNzOiBgc29ydC1pdGVtIGAgfSxcblx0XHR9KTtcblxuXHRcdGNvbnN0IGl0ZW0gPSBjcmVhdGVFbChcImRpdlwiLCB7fSk7XG5cdFx0aXRlbS5zZXRUZXh0KHRpdGxlKTtcblx0XHRjb25zdCBjaGVja19sb2dvID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0YXR0cjogeyBjbGFzczogYCR7Z3JvdXBlfSBzb3J0LWNoZWNrICR7Y2hlY2tfbWFya2VyfWAgfSxcblx0XHR9KTtcblx0XHRzZXRJY29uKGNoZWNrX2xvZ28sIFwiY2hlY2tcIik7XG5cblx0XHRjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblx0XHR0aGlzLnNvcnRfbWVudV9saXN0ZXJfY2IucHVzaCgoKSA9PiB7XG5cdFx0XHRjb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIGNhbGxiYWNrKTtcblx0XHR9KTtcblxuXHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChjaGVja19sb2dvKTtcblx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQoaXRlbSk7XG5cdFx0cmV0dXJuIGNvbnRhaW5lcjtcblx0fVxuXG5cdHN0YXRpYyBnZXRTb3J0TWVudSgpIHtcblx0XHRpZiAoIXRoaXMuc29ydF9tZW51KSB7XG5cdFx0XHRjb25zdCBtZW51ID0gY3JlYXRlRWwoXCJzbC1tZW51XCIsIHtcblx0XHRcdFx0YXR0cjogeyBjbGFzczogXCJzb3J0LW1lbnVcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHNlbGVjdE5hbWUgPSAoKSA9PiB7XG5cdFx0XHRcdGlmICghdGhpcy5jcmFmdHkgfHwgIXRoaXMuY3JhZnR5Lm5vZGVTdGF0ZSkgcmV0dXJuO1xuXHRcdFx0XHR0aGlzLmNyYWZ0eS5ub2RlU3RhdGUuc29ydEJ5KFwibmFtZVwiKTtcblx0XHRcdFx0dGhpcy4jdG9nZ2xlU29ydE1lbnUoKTtcblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IHNlbGVjdENyZWF0ZWQgPSAoKSA9PiB7XG5cdFx0XHRcdGlmICghdGhpcy5jcmFmdHkgfHwgIXRoaXMuY3JhZnR5Lm5vZGVTdGF0ZSkgcmV0dXJuO1xuXHRcdFx0XHR0aGlzLmNyYWZ0eS5ub2RlU3RhdGUuc29ydEJ5KFwiY3JlYXRlZF9hdFwiKTtcblx0XHRcdFx0dGhpcy4jdG9nZ2xlU29ydE1lbnUoKTtcblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IHNlbGVjdExhc3RNb2RpZmllZCA9ICgpID0+IHtcblx0XHRcdFx0aWYgKCF0aGlzLmNyYWZ0eSB8fCAhdGhpcy5jcmFmdHkubm9kZVN0YXRlKSByZXR1cm47XG5cdFx0XHRcdHRoaXMuY3JhZnR5Lm5vZGVTdGF0ZS5zb3J0QnkoXCJsYXN0X21vZGlmaWVkXCIpO1xuXHRcdFx0XHR0aGlzLiN0b2dnbGVTb3J0TWVudSgpO1xuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3Qgc2VsZWN0QXNjZW5kaW5nID0gKCkgPT4ge1xuXHRcdFx0XHRpZiAoIXRoaXMuY3JhZnR5IHx8ICF0aGlzLmNyYWZ0eS5ub2RlU3RhdGUpIHJldHVybjtcblx0XHRcdFx0dGhpcy5jcmFmdHkubm9kZVN0YXRlLm9yZGVyKFwiYXNjXCIpO1xuXHRcdFx0XHR0aGlzLiN0b2dnbGVTb3J0TWVudSgpO1xuXHRcdFx0fTtcblxuXHRcdFx0Y29uc3Qgc2VsZWN0RGVzY2VuZGluZyA9ICgpID0+IHtcblx0XHRcdFx0aWYgKCF0aGlzLmNyYWZ0eSB8fCAhdGhpcy5jcmFmdHkubm9kZVN0YXRlKSByZXR1cm47XG5cdFx0XHRcdHRoaXMuY3JhZnR5Lm5vZGVTdGF0ZS5vcmRlcihcImRlc1wiKTtcblx0XHRcdFx0dGhpcy4jdG9nZ2xlU29ydE1lbnUoKTtcblx0XHRcdH07XG5cblx0XHRcdGNvbnN0IHBpY2tfbmFtZSA9IHRoaXMuI3NvcnRJdGVtVGVtcGxhdGUoXG5cdFx0XHRcdFwiTmFtZVwiLFxuXHRcdFx0XHRcImcxXCIsXG5cdFx0XHRcdFwicy1uYW1lXCIsXG5cdFx0XHRcdHNlbGVjdE5hbWVcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBwaWNrX2NyZWF0ZWQgPSB0aGlzLiNzb3J0SXRlbVRlbXBsYXRlKFxuXHRcdFx0XHRcIkNyZWF0ZWRfQXRcIixcblx0XHRcdFx0XCJnMVwiLFxuXHRcdFx0XHRcInMtY3JlYXRlZFwiLFxuXHRcdFx0XHRzZWxlY3RDcmVhdGVkXG5cdFx0XHQpO1xuXG5cdFx0XHRjb25zdCBwaWNrX2xhc3QgPSB0aGlzLiNzb3J0SXRlbVRlbXBsYXRlKFxuXHRcdFx0XHRcIkxhc3RfTW9kaWZpZWRcIixcblx0XHRcdFx0XCJnMVwiLFxuXHRcdFx0XHRcInMtbGFzdFwiLFxuXHRcdFx0XHRzZWxlY3RMYXN0TW9kaWZpZWRcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBwaWNrX2FzYyA9IHRoaXMuI3NvcnRJdGVtVGVtcGxhdGUoXG5cdFx0XHRcdFwiQXNjZW5kaW5nXCIsXG5cdFx0XHRcdFwiZzJcIixcblx0XHRcdFx0XCJzLWFzY1wiLFxuXHRcdFx0XHRzZWxlY3RBc2NlbmRpbmdcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBwaWNrX2Rlc2MgPSB0aGlzLiNzb3J0SXRlbVRlbXBsYXRlKFxuXHRcdFx0XHRcIkRlc2NlbmRpbmdcIixcblx0XHRcdFx0XCJnMlwiLFxuXHRcdFx0XHRcInMtZGVzY1wiLFxuXHRcdFx0XHRzZWxlY3REZXNjZW5kaW5nXG5cdFx0XHQpO1xuXG5cdFx0XHRjb25zdCBkaXZpZGVyID0gY3JlYXRlRWwoXCJzbC1kaXZpZGVyXCIsIHt9KTtcblxuXHRcdFx0bWVudS5hcHBlbmRDaGlsZChwaWNrX25hbWUpO1xuXHRcdFx0bWVudS5hcHBlbmRDaGlsZChwaWNrX2NyZWF0ZWQpO1xuXHRcdFx0bWVudS5hcHBlbmRDaGlsZChwaWNrX2xhc3QpO1xuXHRcdFx0bWVudS5hcHBlbmRDaGlsZChkaXZpZGVyKTtcblx0XHRcdG1lbnUuYXBwZW5kQ2hpbGQocGlja19hc2MpO1xuXHRcdFx0bWVudS5hcHBlbmRDaGlsZChwaWNrX2Rlc2MpO1xuXG5cdFx0XHR0aGlzLnNvcnRfbWVudSA9IG1lbnU7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnNvcnRfbWVudTtcblx0fVxuXG5cdHN0YXRpYyBnZXRTb3J0QnV0dG9uKCkge1xuXHRcdGlmICghdGhpcy5zb3J0X2J1dHRvbikge1xuXHRcdFx0Y29uc3Qgc29ydF9idXR0b24gPSBjcmVhdGVFbChcInNsLWRyb3Bkb3duXCIsIHtcblx0XHRcdFx0YXR0cjoge1xuXHRcdFx0XHRcdGNsYXNzOiBcInNvcnQtYnV0dG9uLWNvbnRhaW5lclwiLFxuXHRcdFx0XHRcdGRpc3RhbmNlOiBcIi00MFwiLFxuXHRcdFx0XHRcdHNraWRkaW5nOiBcIi0xMFwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGJ1dHRvbiA9IGNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcblx0XHRcdFx0YXR0cjogeyBjbGFzczogXCJzb3J0LWJ1dHRvblwiLCBzbG90OiBcInRyaWdnZXJcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IHRleHQgPSBjcmVhdGVFbChcInNwYW5cIiwge1xuXHRcdFx0XHRhdHRyOiB7IGNsYXNzOiBcInNvcnQtYnV0dG9uLWxhcmdlIHNiLXRleHRcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGxvZ28gPSBjcmVhdGVFbChcImRpdlwiLCB7fSk7XG5cblx0XHRcdHNldEljb24obG9nbywgXCJhcnJvdy1kb3duLXVwXCIpO1xuXG5cdFx0XHRidXR0b24uYXBwZW5kQ2hpbGQobG9nbyk7XG5cdFx0XHRidXR0b24uYXBwZW5kQ2hpbGQodGV4dCk7XG5cblx0XHRcdHNvcnRfYnV0dG9uLmFwcGVuZENoaWxkKGJ1dHRvbik7XG5cblx0XHRcdHNvcnRfYnV0dG9uLmFwcGVuZENoaWxkKHRoaXMuZ2V0U29ydE1lbnUoKSk7XG5cblx0XHRcdHRoaXMuc29ydF9idXR0b24gPSBzb3J0X2J1dHRvbjtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcy5zb3J0X2J1dHRvbjtcblx0fVxuXG5cdHN0YXRpYyBnZXROb2Rlc0NvbnRhaW5lcigpIHtcblx0XHRpZiAoIXRoaXMubm9kZXNfY29udGFpbmVyKSB7XG5cdFx0XHRjb25zdCBub2Rlc19jb250YWluZXIgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwibm9kZXMtY29udGFpbmVyXCIgfSxcblx0XHRcdH0pO1xuXHRcdFx0bm9kZXNfY29udGFpbmVyLmNyZWF0ZUVsKFwiZGl2XCIsIHtcblx0XHRcdFx0YXR0cjogeyBjbGFzczogXCJub2Rlcy1ib2R5XCIgfSxcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5ub2Rlc19jb250YWluZXIgPSBub2Rlc19jb250YWluZXI7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLm5vZGVzX2NvbnRhaW5lcjtcblx0fVxuXG5cdHN0YXRpYyAjZ2V0RmlsdGVyU2VjdGlvbihcblx0XHRncm91cDogXCJEb2N1bWVudFwiIHwgXCJWaWRlb1wiIHwgXCJBdWRpb1wiIHwgXCJJbWFnZVwiIHwgXCJHZW5lcmFsXCJcblx0KSB7XG5cdFx0Y29uc3QgY29udGFpbmVyID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0YXR0cjoge1xuXHRcdFx0XHRjbGFzczogXCJmaWx0ZXItbWVudS1iYWRnZS1jb250YWluZXJcIixcblx0XHRcdH0sXG5cdFx0fSk7XG5cdFx0bGV0IGZpbHRlcnM6IE5vZGVGaWx0ZXJbXSA9IFtdO1xuXHRcdHN3aXRjaCAoZ3JvdXApIHtcblx0XHRcdGNhc2UgXCJEb2N1bWVudFwiOlxuXHRcdFx0XHRpZiAodGhpcy5jcmFmdHkgJiYgdGhpcy5jcmFmdHkubm9kZUZpbHRlclN0YXRlKSB7XG5cdFx0XHRcdFx0ZmlsdGVycyA9XG5cdFx0XHRcdFx0XHR0aGlzLmNyYWZ0eS5ub2RlRmlsdGVyU3RhdGUuZ2V0RmlsdGVyQnlHcm91cChcblx0XHRcdFx0XHRcdFx0XCJEb2N1bWVudFwiXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcIkltYWdlXCI6XG5cdFx0XHRcdGlmICh0aGlzLmNyYWZ0eSAmJiB0aGlzLmNyYWZ0eS5ub2RlRmlsdGVyU3RhdGUpIHtcblx0XHRcdFx0XHRmaWx0ZXJzID1cblx0XHRcdFx0XHRcdHRoaXMuY3JhZnR5Lm5vZGVGaWx0ZXJTdGF0ZS5nZXRGaWx0ZXJCeUdyb3VwKFwiSW1hZ2VcIik7XG5cdFx0XHRcdH1cblx0XHRcdFx0YnJlYWs7XG5cblx0XHRcdGNhc2UgXCJBdWRpb1wiOlxuXHRcdFx0XHRpZiAodGhpcy5jcmFmdHkgJiYgdGhpcy5jcmFmdHkubm9kZUZpbHRlclN0YXRlKSB7XG5cdFx0XHRcdFx0ZmlsdGVycyA9XG5cdFx0XHRcdFx0XHR0aGlzLmNyYWZ0eS5ub2RlRmlsdGVyU3RhdGUuZ2V0RmlsdGVyQnlHcm91cChcIkF1ZGlvXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRjYXNlIFwiVmlkZW9cIjpcblx0XHRcdFx0aWYgKHRoaXMuY3JhZnR5ICYmIHRoaXMuY3JhZnR5Lm5vZGVGaWx0ZXJTdGF0ZSkge1xuXHRcdFx0XHRcdGZpbHRlcnMgPVxuXHRcdFx0XHRcdFx0dGhpcy5jcmFmdHkubm9kZUZpbHRlclN0YXRlLmdldEZpbHRlckJ5R3JvdXAoXCJWaWRlb1wiKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRicmVhaztcblxuXHRcdFx0Y2FzZSBcIkdlbmVyYWxcIjpcblx0XHRcdFx0aWYgKHRoaXMuY3JhZnR5ICYmIHRoaXMuY3JhZnR5Lm5vZGVGaWx0ZXJTdGF0ZSkge1xuXHRcdFx0XHRcdGZpbHRlcnMgPVxuXHRcdFx0XHRcdFx0dGhpcy5jcmFmdHkubm9kZUZpbHRlclN0YXRlLmdldEZpbHRlckJ5R3JvdXAoXCJHZW5lcmFsXCIpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGJyZWFrO1xuXG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cblx0XHRmb3IgKGNvbnN0IGVsIG9mIGZpbHRlcnMpIHtcblx0XHRcdGNvbnN0IGJhZGdlID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVyLW1lbnUtYmFkZ2VcIixcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXHRcdFx0Y29uc3QgYmFkZ2Vfc3BhbiA9IGNyZWF0ZUVsKFwic3BhblwiLCB7fSk7XG5cdFx0XHRiYWRnZV9zcGFuLnNldFRleHQoZWwudGl0bGUpO1xuXHRcdFx0YmFkZ2UuYXBwZW5kQ2hpbGQoYmFkZ2Vfc3Bhbik7XG5cblx0XHRcdGNvbnN0IGJhZGdlX2NsaWNrX2NiID0gKCkgPT4ge1xuXHRcdFx0XHRpZiAoYmFkZ2UuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYmFkZ2UtYWN0aXZlXCIpKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuY3JhZnR5ICYmIHRoaXMuY3JhZnR5Lm5vZGVGaWx0ZXJTdGF0ZSkge1xuXHRcdFx0XHRcdFx0dGhpcy5jcmFmdHkubm9kZUZpbHRlclN0YXRlLnJlbW92ZUZpbHRlcihcblx0XHRcdFx0XHRcdFx0ZWwudGl0bGUgYXMgRklMRV9UWVBFXG5cdFx0XHRcdFx0XHQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRiYWRnZS5jbGFzc0xpc3QucmVtb3ZlKFwiYmFkZ2UtYWN0aXZlXCIpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmICh0aGlzLmNyYWZ0eSAmJiB0aGlzLmNyYWZ0eS5ub2RlRmlsdGVyU3RhdGUpIHtcblx0XHRcdFx0XHRcdHRoaXMuY3JhZnR5Lm5vZGVGaWx0ZXJTdGF0ZS5hZGRGaWx0ZXIoXG5cdFx0XHRcdFx0XHRcdGVsLnRpdGxlIGFzIEZJTEVfVFlQRVxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YmFkZ2UuY2xhc3NMaXN0LmFkZChcImJhZGdlLWFjdGl2ZVwiKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdGJhZGdlLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCBiYWRnZV9jbGlja19jYik7XG5cblx0XHRcdHRoaXMuZmlsdGVyX21lbnVfYmFkZ2VfbGlzdGVyX2NiLnB1c2goKCkgPT4ge1xuXHRcdFx0XHRiYWRnZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgYmFkZ2VfY2xpY2tfY2IpO1xuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnRhaW5lci5hcHBlbmRDaGlsZChiYWRnZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbnRhaW5lcjtcblx0fVxuXG5cdHN0YXRpYyBnZXRGaWx0ZXJNZW51KCkge1xuXHRcdGlmICghdGhpcy5maWx0ZXJfbWVudSkge1xuXHRcdFx0dGhpcy4jZnJlZUZpbHRlck1lbnVCYWRnZUxpc3RlbmVycygpO1xuXHRcdFx0Y29uc3QgZmlsdGVyX21lbnUgPSBjcmVhdGVFbChcInNsLW1lbnVcIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVyLW1lbnVcIixcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXG5cdFx0XHQvL0RvY3VtZW50XG5cdFx0XHRjb25zdCBnZW5lcmFsID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVyLW1lbnUtc2VjdGlvblwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCBnZW5lcmFsX3RpdGxlID0gY3JlYXRlRWwoXCJzcGFuXCIsIHt9KTtcblx0XHRcdGdlbmVyYWxfdGl0bGUuc2V0VGV4dChcIkdlbmVyYWxcIik7XG5cdFx0XHRnZW5lcmFsLmFwcGVuZENoaWxkKGdlbmVyYWxfdGl0bGUpO1xuXHRcdFx0Z2VuZXJhbC5hcHBlbmRDaGlsZCh0aGlzLiNnZXRGaWx0ZXJTZWN0aW9uKFwiR2VuZXJhbFwiKSk7XG5cblx0XHRcdC8vRG9jdW1lbnRcblx0XHRcdGNvbnN0IGRvY3VtZW50ID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVyLW1lbnUtc2VjdGlvblwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCBkb2N1bWVudF90aXRsZSA9IGNyZWF0ZUVsKFwic3BhblwiLCB7fSk7XG5cdFx0XHRkb2N1bWVudF90aXRsZS5zZXRUZXh0KFwiRG9jdW1lbnRzXCIpO1xuXHRcdFx0ZG9jdW1lbnQuYXBwZW5kQ2hpbGQoZG9jdW1lbnRfdGl0bGUpO1xuXHRcdFx0ZG9jdW1lbnQuYXBwZW5kQ2hpbGQodGhpcy4jZ2V0RmlsdGVyU2VjdGlvbihcIkRvY3VtZW50XCIpKTtcblxuXHRcdFx0Ly9JbWFnZVxuXHRcdFx0Y29uc3QgaW1hZ2UgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdGF0dHI6IHtcblx0XHRcdFx0XHRjbGFzczogXCJmaWx0ZXItbWVudS1zZWN0aW9uXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9KTtcblx0XHRcdGNvbnN0IGltYWdlX3RpdGxlID0gY3JlYXRlRWwoXCJzcGFuXCIsIHt9KTtcblx0XHRcdGltYWdlX3RpdGxlLnNldFRleHQoXCJJbWFnZVwiKTtcblx0XHRcdGltYWdlLmFwcGVuZENoaWxkKGltYWdlX3RpdGxlKTtcblx0XHRcdGltYWdlLmFwcGVuZENoaWxkKHRoaXMuI2dldEZpbHRlclNlY3Rpb24oXCJJbWFnZVwiKSk7XG5cblx0XHRcdC8vQXVkaW9cblx0XHRcdGNvbnN0IGF1ZGlvID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVyLW1lbnUtc2VjdGlvblwiLFxuXHRcdFx0XHR9LFxuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCBhdWRpb190aXRsZSA9IGNyZWF0ZUVsKFwic3BhblwiLCB7fSk7XG5cdFx0XHRhdWRpb190aXRsZS5zZXRUZXh0KFwiQXVkaW9cIik7XG5cdFx0XHRhdWRpby5hcHBlbmRDaGlsZChhdWRpb190aXRsZSk7XG5cdFx0XHRhdWRpby5hcHBlbmRDaGlsZCh0aGlzLiNnZXRGaWx0ZXJTZWN0aW9uKFwiQXVkaW9cIikpO1xuXG5cdFx0XHQvL1ZpZGVvXG5cdFx0XHRjb25zdCB2aWRlbyA9IGNyZWF0ZUVsKFwiZGl2XCIsIHtcblx0XHRcdFx0YXR0cjoge1xuXHRcdFx0XHRcdGNsYXNzOiBcImZpbHRlci1tZW51LXNlY3Rpb25cIixcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXHRcdFx0Y29uc3QgdmlkZW9fdGl0bGUgPSBjcmVhdGVFbChcInNwYW5cIiwge30pO1xuXHRcdFx0dmlkZW9fdGl0bGUuc2V0VGV4dChcIlZpZGVvXCIpO1xuXHRcdFx0dmlkZW8uYXBwZW5kQ2hpbGQodmlkZW9fdGl0bGUpO1xuXHRcdFx0dmlkZW8uYXBwZW5kQ2hpbGQodGhpcy4jZ2V0RmlsdGVyU2VjdGlvbihcIkltYWdlXCIpKTtcblxuXHRcdFx0ZmlsdGVyX21lbnUuYXBwZW5kQ2hpbGQoZ2VuZXJhbCk7XG5cdFx0XHRmaWx0ZXJfbWVudS5hcHBlbmRDaGlsZChkb2N1bWVudCk7XG5cdFx0XHRmaWx0ZXJfbWVudS5hcHBlbmRDaGlsZChpbWFnZSk7XG5cdFx0XHRmaWx0ZXJfbWVudS5hcHBlbmRDaGlsZChhdWRpbyk7XG5cdFx0XHRmaWx0ZXJfbWVudS5hcHBlbmRDaGlsZCh2aWRlbyk7XG5cblx0XHRcdHRoaXMuZmlsdGVyX21lbnUgPSBmaWx0ZXJfbWVudTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVyX21lbnU7XG5cdH1cblxuXHRzdGF0aWMgZ2V0RmlsdGVyc0J1dHRvbigpIHtcblx0XHRpZiAoIXRoaXMuZmlsdGVyX2J1dHRvbikge1xuXHRcdFx0Y29uc3QgZmlsdGVyX2J1dHRvbiA9IGNyZWF0ZUVsKFwic2wtZHJvcGRvd25cIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiXCIsXG5cdFx0XHRcdFx0ZGlzdGFuY2U6IFwiLTQwXCIsXG5cdFx0XHRcdFx0c2tpZGRpbmc6IFwiLTEwXCIsXG5cdFx0XHRcdH0sXG5cdFx0XHR9KTtcblxuXHRcdFx0Y29uc3QgZXhwYW5kX2J1dHRvbiA9IGNyZWF0ZUVsKFwiYnV0dG9uXCIsIHtcblx0XHRcdFx0YXR0cjogeyBjbGFzczogXCJmaWx0ZXJzLWJ1dHRvblwiLCBzbG90OiBcInRyaWdnZXJcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGxvZ29fY29udGFpbmVyID0gY3JlYXRlRWwoXCJkaXZcIiwge30pO1xuXHRcdFx0c2V0SWNvbihsb2dvX2NvbnRhaW5lciwgXCJwbHVzXCIpO1xuXHRcdFx0Y29uc3QgYnV0dG9uX3RleHQgPSBjcmVhdGVFbChcInNwYW5cIik7XG5cdFx0XHRidXR0b25fdGV4dC5zZXRUZXh0KFwiRmlsdGVyXCIpO1xuXG5cdFx0XHRleHBhbmRfYnV0dG9uLmFwcGVuZENoaWxkKGxvZ29fY29udGFpbmVyKTtcblx0XHRcdGV4cGFuZF9idXR0b24uYXBwZW5kQ2hpbGQoYnV0dG9uX3RleHQpO1xuXG5cdFx0XHRmaWx0ZXJfYnV0dG9uLmFwcGVuZENoaWxkKGV4cGFuZF9idXR0b24pO1xuXG5cdFx0XHRmaWx0ZXJfYnV0dG9uLmFwcGVuZENoaWxkKHRoaXMuZ2V0RmlsdGVyTWVudSgpKTtcblxuXHRcdFx0dGhpcy5maWx0ZXJfYnV0dG9uID0gZmlsdGVyX2J1dHRvbjtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVyX2J1dHRvbjtcblx0fVxuXG5cdHN0YXRpYyBnZXRGaWx0ZXJzRGlzcGxheSgpIHtcblx0XHRpZiAoIXRoaXMuZmlsdGVyc19kaXNwbGF5KSB7XG5cdFx0XHRjb25zdCBmaWx0ZXJzX2Rpc3BsYXkgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwiZmlsdGVyc19kaXNwbGF5XCIgfSxcblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgZmlsdGVyczogTm9kZUZpbHRlcltdID0gW107XG5cblx0XHRcdGlmICh0aGlzLmNyYWZ0eSAmJiB0aGlzLmNyYWZ0eS5ub2RlRmlsdGVyU3RhdGUpIHtcblx0XHRcdFx0ZmlsdGVycyA9IHRoaXMuY3JhZnR5Lm5vZGVGaWx0ZXJTdGF0ZS5hbGxGaWx0ZXJzO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKGNvbnN0IGVsIG9mIGZpbHRlcnMpIHtcblx0XHRcdFx0Y29uc3QgYmFkZ2UgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdFx0YXR0cjoge1xuXHRcdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVyLW1lbnUtYmFkZ2UtZGlzcGxheVwiLFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRjb25zdCBiYWRnZV9zcGFuID0gY3JlYXRlRWwoXCJzcGFuXCIsIHt9KTtcblx0XHRcdFx0YmFkZ2Vfc3Bhbi5zZXRUZXh0KGVsLnRpdGxlKTtcblx0XHRcdFx0YmFkZ2UuYXBwZW5kQ2hpbGQoYmFkZ2Vfc3Bhbik7XG5cblx0XHRcdFx0aWYgKGVsLmlzQWN0aXZlKSBiYWRnZS5jbGFzc0xpc3QuYWRkKFwiYmFkZ2UtZGlzcGxheS1hY3RpdmVcIik7XG5cblx0XHRcdFx0ZmlsdGVyc19kaXNwbGF5LmFwcGVuZENoaWxkKGJhZGdlKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5maWx0ZXJzX2Rpc3BsYXkgPSBmaWx0ZXJzX2Rpc3BsYXk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmZpbHRlcnNfZGlzcGxheTtcblx0fVxuXG5cdHN0YXRpYyBnZXRGaWx0ZXJzQ29udGFpbmVyKCkge1xuXHRcdGlmICghdGhpcy5maWx0ZXJzX2NvbnRhaW5lcikge1xuXHRcdFx0Y29uc3QgY29udGFpbmVyID0gY3JlYXRlRWwoXCJkaXZcIiwge1xuXHRcdFx0XHRhdHRyOiB7XG5cdFx0XHRcdFx0Y2xhc3M6IFwiZmlsdGVycy1jb250YWluZXJcIixcblx0XHRcdFx0fSxcblx0XHRcdH0pO1xuXHRcdFx0Y29udGFpbmVyLmFwcGVuZENoaWxkKHRoaXMuZ2V0RmlsdGVyc0Rpc3BsYXkoKSk7XG5cdFx0XHRjb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5nZXRGaWx0ZXJzQnV0dG9uKCkpO1xuXG5cdFx0XHR0aGlzLmZpbHRlcnNfY29udGFpbmVyID0gY29udGFpbmVyO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5maWx0ZXJzX2NvbnRhaW5lcjtcblx0fVxuXG5cdHN0YXRpYyBzZXRDcmFmdHlJbnN0YW5jZShjcmFmdHk6IENyYWZ0eSkge1xuXHRcdHRoaXMuY3JhZnR5ID0gY3JhZnR5O1xuXHR9XG5cblx0c3RhdGljIGdldFRpdGxlSW5wdXQoKSB7XG5cdFx0aWYgKCF0aGlzLnRpdGxlSW5wdXQpIHtcblx0XHRcdGNvbnN0IGVsZW1lbnQgPSBjcmVhdGVFbChcImRpdlwiLCB7XG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwidGl0bGUtZWRpdC1kaXYgaGlkZGVuXCIgfSxcblx0XHRcdH0pO1xuXG5cdFx0XHRjb25zdCBpbnB1dCA9IGVsZW1lbnQuY3JlYXRlRWwoXCJpbnB1dFwiLCB7XG5cdFx0XHRcdGF0dHI6IHsgY2xhc3M6IFwidGl0bGUtaW5wdXRcIiB9LFxuXHRcdFx0fSk7XG5cblx0XHRcdGNvbnN0IGlucHV0X2ZvY3VzX2xvc3RfY2IgPSBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdHRoaXMuI3NhdmVUaXRsZShlbGVtZW50LCBpbnB1dCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRjb25zdCBpbnB1dF9lbnRlcl9jYiA9IGFzeW5jIChldjogS2V5Ym9hcmRFdmVudCkgPT4ge1xuXHRcdFx0XHRpZiAoZXYua2V5ID09IFwiRW50ZXJcIikge1xuXHRcdFx0XHRcdHRoaXMuI3NhdmVUaXRsZShlbGVtZW50LCBpbnB1dCk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJmb2N1c291dFwiLCBpbnB1dF9mb2N1c19sb3N0X2NiKTtcblxuXHRcdFx0aW5wdXQuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgaW5wdXRfZW50ZXJfY2IpO1xuXG5cdFx0XHR0aGlzLnRpdGxlX2VkaXRfbGlzdGVyX2NiLnB1c2goKCkgPT4ge1xuXHRcdFx0XHRpbnB1dC5yZW1vdmVFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBpbnB1dF9lbnRlcl9jYik7XG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy50aXRsZV9lZGl0X2xpc3Rlcl9jYi5wdXNoKCgpID0+IHtcblx0XHRcdFx0aW5wdXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImZvY3Vzb3V0XCIsIGlucHV0X2ZvY3VzX2xvc3RfY2IpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMudGl0bGVJbnB1dCA9IGVsZW1lbnQ7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnRpdGxlSW5wdXQ7XG5cdH1cblx0c3RhdGljIGFzeW5jICNzYXZlVGl0bGUoZWxlbWVudDogSFRNTERpdkVsZW1lbnQsIGlucHV0OiBIVE1MSW5wdXRFbGVtZW50KSB7XG5cdFx0Y29uc3QgZGlzcGxheSA9IERPTUhhbmRsZXIuZ2V0VGl0bGVEaXNwbGF5KCk7XG5cdFx0ZWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiaGlkZGVuXCIpO1xuXHRcdGRpc3BsYXkuY2xhc3NMaXN0LnJlbW92ZShcImhpZGRlblwiKTtcblx0XHRpZiAoIXRoaXMuY3JhZnR5IHx8ICF0aGlzLmNyYWZ0eS5zZWxlY3RlZE5vZGUgfHwgIXRoaXMudGV4dEFyZWEpIHJldHVybjtcblx0XHRjb25zdCBub2RlID0gdGhpcy5jcmFmdHkuc2VsZWN0ZWROb2RlO1xuXHRcdGNvbnN0IGZpbGUgPSB0aGlzLmNyYWZ0eS5jdXJyZW50RmlsZTtcblx0XHRjb25zdCB2YXVsdCA9IHRoaXMuY3JhZnR5LnZhdWx0O1xuXHRcdG5vZGUudGl0bGUgPSBpbnB1dC52YWx1ZTtcblx0XHRhd2FpdCBGaWxlSGFuZGxlci51cGRhdGVDYW52YXNOb2RlKG5vZGUsIGZpbGUsIHZhdWx0KTtcblx0fVxuXG5cdHN0YXRpYyBmcmVlKCkge1xuXHRcdHRoaXMuI2ZyZWVOb2Rlc0NsaWNrTGlzdGVuZXJzKCk7XG5cdFx0dGhpcy4jZnJlZVNlbGVjdGlvbkxpc3RlbmVycygpO1xuXHRcdHRoaXMuI2ZyZWVUaXRsZUVkaXRMaXN0ZW5lcnMoKTtcblx0XHR0aGlzLiNmcmVlU2VhcmNoQmFyTGlzdGVuZXJzKCk7XG5cdFx0dGhpcy4jZnJlZVNvcnRNZW51TGlzdGVuZXJzKCk7XG5cdFx0dGhpcy4jZnJlZUZpbHRlck1lbnVCYWRnZUxpc3RlbmVycygpO1xuXHR9XG59XG4iXX0=