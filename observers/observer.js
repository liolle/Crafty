var _AttributeObserver_instances, _AttributeObserver_callback, _AttributeObserver_addObservableElement, _NodesState_instances, _NodesState_swapIdx, _NodesState_indexNodes, _NodesState_clearRelNodes, _NodesState_sort, _NodesState_order, _NodesState_getFilterSpec, _NodesState_PopulateRelNodes, _NodesState_update, _NodesState_findFirstNode;
import { __classPrivateFieldGet } from "tslib";
import { DOMHandler } from "dom/handler";
import { FILE_FORMAT, NodeComparator, NodeFilter, NodesExplorer, } from "nodes/nodes";
import { AudioSpecification, ExpressionSpecification, ImageSpecification, VideoSpecification, } from "specification";
// TYPE //
export class Observer {
}
export class Navigator {
}
export class Subject {
}
export class NodeObserver {
    constructor(callback) {
        this.callback = callback;
    }
    update(nodes) {
        this.callback(nodes);
    }
}
export class NodeFilterObserver {
    constructor(callback) {
        this.callback = callback;
    }
    update(filters) {
        this.callback(filters);
    }
}
// TYPE //
export class AttributeObserver {
    constructor() {
        _AttributeObserver_instances.add(this);
        this.config = { attributes: true, attributeFilter: ["class"] };
    }
    observe(leaf, node_state) {
        if (!leaf)
            return;
        if (this.observer)
            this.disconnect();
        this.observer = new MutationObserver((mutation) => {
            __classPrivateFieldGet(this, _AttributeObserver_instances, "m", _AttributeObserver_callback).call(this, leaf, node_state);
        });
        __classPrivateFieldGet(this, _AttributeObserver_instances, "m", _AttributeObserver_addObservableElement).call(this, leaf);
    }
    disconnect() {
        if (this.observer)
            this.observer.disconnect();
        this.observer = null;
    }
}
_AttributeObserver_instances = new WeakSet(), _AttributeObserver_callback = function _AttributeObserver_callback(leaf, node_state) {
    const view_state = leaf.getViewState();
    if (view_state.type != "canvas")
        return;
    const selection = Array.from(
    //@ts-ignore
    leaf.view.canvas.selection, 
    //@ts-ignore
    (val) => val.id);
    node_state.selectNodes(selection);
}, _AttributeObserver_addObservableElement = function _AttributeObserver_addObservableElement(leaf) {
    const view_state = leaf.getViewState();
    if (view_state.type != "canvas")
        return;
    const nodes = Array.from(
    //@ts-ignore
    leaf.view.canvas.nodes, 
    //@ts-ignore
    ([id, value]) => ({
        id,
        container: value.nodeEl,
        data: value.unknownData,
    }));
    if (this.observer) {
        for (const node of nodes) {
            this.observer.observe(node.container, this.config);
        }
    }
};
/**
 *
 */
export class NodesState {
    constructor() {
        _NodesState_instances.add(this);
        this.observers = [];
        this.node_map = new Map();
        this.rel_node_map = new Map();
        this.node_arr = [];
        this.rel_node_arr = [];
        this.selected = [];
        this.currentID = "";
        this.lastID = "";
        this.node_explorer = new NodesExplorer();
        this.currentSearch = "";
        this.sort_by = "name";
        this.node_order = "asc";
        this.filters = [];
    }
    registerObserver(observer) {
        this.observers.push(observer);
    }
    removeObserver(observer) {
        this.observers = this.observers.filter((val) => val != observer);
    }
    notifyObserver() {
        for (const obs of this.observers) {
            obs.update(this.nodes);
        }
    }
    add(nodes) {
        for (const node of nodes) {
            if (this.node_map.size == 0)
                this.firstID = node.id;
            if (this.selected.includes(node.id))
                node.selected = true;
            this.node_map.set(node.id, this.node_arr.length);
            this.node_arr.push(node);
            this.node_explorer.add(node);
        }
        this.firstID = "";
        if (nodes.length > 0)
            this.firstID = this.node_arr[0].id;
        this.notifyObserver();
    }
    remove(id_list) {
        for (const id of id_list) {
            if (this.node_map.has(id)) {
                //@ts-ignore
                __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_swapIdx).call(this, this.node_map.get(id), this.node_arr.length - 1);
                const node = this.node_arr.pop();
                if (node)
                    this.node_explorer.remove(node);
                this.node_map.delete(id);
                //@ts-ignore
                __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_swapIdx).call(this, this.node_map.get(id), this.node_arr.length - 1);
            }
        }
        this.notifyObserver();
    }
    replace(nodes) {
        while (this.node_arr.length > 0)
            this.node_arr.pop();
        this.node_map.clear();
        this.node_explorer.clear();
        this.add(nodes);
    }
    selectNodes(id_list) {
        const n = id_list.length;
        this.selected = id_list;
        if (n == 0) {
            this.currentID = "";
        }
        else {
            this.lastID = this.currentID;
            this.currentID = id_list[0];
        }
        for (const node of this.node_arr)
            node.selected = false;
        for (const id of id_list) {
            const node_idx = this.node_map.get(id);
            if (node_idx == undefined)
                continue;
            this.node_arr[node_idx].selected = true;
        }
        this.notifyObserver();
    }
    order(order) {
        if (this.node_order != order) {
            this.node_order = order;
            this.notifyObserver();
        }
    }
    sortBy(sort_by) {
        if (this.sort_by != sort_by) {
            this.sort_by = sort_by;
            this.notifyObserver();
        }
    }
    setFilters(filters) {
        this.filters = filters;
        this.notifyObserver();
    }
    setSearchWord(word) {
        this.currentSearch = word;
        this.notifyObserver();
    }
    // Navigator
    current(id) {
        this.currentID = id;
        const idx = this.node_map.get(id);
        if (idx === undefined)
            return;
        const next_node = this.node_arr[idx];
        if (!next_node.container)
            return;
        next_node.container.click();
    }
    next() {
        const idx = this.rel_node_map.get(this.currentID);
        if (idx === undefined) {
            const next_node = __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_findFirstNode).call(this);
            if (!next_node || !next_node.container)
                return;
            next_node.container.click();
            return;
        }
        const next_idx = (idx + 1) % this.rel_node_arr.length;
        const next_node = this.rel_node_arr[next_idx];
        if (!next_node.container)
            return;
        next_node.container.click();
    }
    previous() {
        const idx = this.rel_node_map.get(this.currentID);
        if (idx === undefined) {
            const next_node = __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_findFirstNode).call(this);
            if (!next_node || !next_node.container)
                return;
            next_node.container.click();
            return;
        }
        const prev_idx = idx - 1 < 0 ? this.rel_node_arr.length - 1 : idx - 1;
        const next_node = this.rel_node_arr[prev_idx];
        if (!next_node.container)
            return;
        next_node.container.click();
    }
    get nodes() {
        __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_update).call(this);
        return this.rel_node_arr;
    }
    get allNodes() {
        return this.node_arr;
    }
    get selectedNode() {
        const idx = this.node_map.get(this.currentID);
        if (idx == undefined)
            return null;
        return this.node_arr[idx];
    }
    get isNodeSame() {
        if (this.currentID == "" || this.lastID == "")
            return false;
        return this.currentID == this.lastID;
    }
}
_NodesState_instances = new WeakSet(), _NodesState_swapIdx = function _NodesState_swapIdx(left, right) {
    const node1 = this.node_arr[left];
    const node2 = this.node_arr[right];
    this.node_map.set(node1.id, right);
    this.node_map.set(node2.id, left);
    [this.node_arr[left], this.node_arr[right]] = [
        this.node_arr[right],
        this.node_arr[left],
    ];
}, _NodesState_indexNodes = function _NodesState_indexNodes() {
    this.rel_node_map.clear();
    const n = this.rel_node_arr.length;
    for (let i = 0; i < n; i++)
        this.rel_node_map.set(this.rel_node_arr[i].id, i);
}, _NodesState_clearRelNodes = function _NodesState_clearRelNodes() {
    while (this.rel_node_arr.length > 0)
        this.rel_node_arr.pop();
}, _NodesState_sort = function _NodesState_sort() {
    const sort_button = DOMHandler.getSortButton();
    const text = sort_button.querySelector(".sb-text");
    const sort_menu = DOMHandler.getSortMenu();
    const sort_name = sort_menu.querySelector(".s-name");
    const sort_created = sort_menu.querySelector(".s-created");
    const sort_last = sort_menu.querySelector(".s-last");
    //@ts-ignore
    for (const node of [sort_name, sort_created, sort_last]) {
        if (!node)
            continue;
        node.classList.remove("check-active");
    }
    switch (this.sort_by) {
        case "name":
            this.rel_node_arr.sort(NodeComparator.SORT_BY_NAME);
            if (text)
                text.setText("Name");
            if (sort_name)
                sort_name.classList.add("check-active");
            break;
        case "created_at":
            this.rel_node_arr.sort(NodeComparator.SORT_BY_CREATED_AT);
            if (text)
                text.setText("Created_at");
            if (sort_created)
                sort_created.classList.add("check-active");
            break;
        case "last_modified":
            this.rel_node_arr.sort(NodeComparator.SORT_BY_LAST_MODIFIED);
            if (text)
                text.setText("Last_modified");
            if (sort_last)
                sort_last.classList.add("check-active");
            break;
        default:
            this.rel_node_arr.sort(NodeComparator.SORT_BY_NAME);
            break;
    }
}, _NodesState_order = function _NodesState_order() {
    const sort_menu = DOMHandler.getSortMenu();
    const sort_asc = sort_menu.querySelector(".s-asc");
    const sort_desc = sort_menu.querySelector(".s-desc");
    //@ts-ignore
    for (const node of [sort_asc, sort_desc]) {
        if (!node)
            continue;
        node.classList.remove("check-active");
    }
    if (this.node_order == "des") {
        this.rel_node_arr.reverse();
        if (sort_desc)
            sort_desc.classList.add("check-active");
    }
    else {
        if (sort_asc)
            sort_asc.classList.add("check-active");
    }
}, _NodesState_getFilterSpec = function _NodesState_getFilterSpec() {
    if (this.filters.length == 0)
        return new ExpressionSpecification(() => true);
    let specification = new ExpressionSpecification(() => false);
    for (const filter of this.filters) {
        if (filter.type == "audio") {
            specification = specification.or(new AudioSpecification());
        }
        else if (filter.type == "video") {
            specification = specification.or(new VideoSpecification());
        }
        else if (filter.type == "image") {
            specification = specification.or(new ImageSpecification());
        }
        else {
            const or_specification = new ExpressionSpecification((candidate) => {
                if (candidate.type == "file")
                    return candidate.extension == filter.type;
                else
                    return candidate.type == filter.type;
            });
            specification = specification.or(or_specification);
        }
    }
    return specification;
}, _NodesState_PopulateRelNodes = function _NodesState_PopulateRelNodes(nodes) {
    __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_clearRelNodes).call(this);
    const spec = __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_getFilterSpec).call(this);
    for (const node of nodes) {
        if (spec.isSatisfied(node))
            this.rel_node_arr.push(node);
    }
    __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_sort).call(this);
    __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_order).call(this);
    __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_indexNodes).call(this);
}, _NodesState_update = function _NodesState_update() {
    if (this.currentSearch == "")
        __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_PopulateRelNodes).call(this, this.node_arr);
    else {
        __classPrivateFieldGet(this, _NodesState_instances, "m", _NodesState_PopulateRelNodes).call(this, 
        // this.node_explorer.findSimilar(this.currentSearch, 4)
        this.node_explorer.prefixSearch(this.currentSearch));
    }
}, _NodesState_findFirstNode = function _NodesState_findFirstNode() {
    const id = this.rel_node_arr[0].id;
    this.currentID = id || "";
    const idx = this.rel_node_map.get(id);
    if (idx == undefined)
        return null;
    const next_node = this.rel_node_arr[idx];
    if (!next_node.container)
        return null;
    return next_node;
};
export class NodesFilterState {
    constructor() {
        this.observers = [];
        this.filter_index = new Map();
        this.filter_list = [];
        let idx = 0;
        for (const group in FILE_FORMAT) {
            //@ts-ignore
            for (const type in FILE_FORMAT[group]) {
                const t = type;
                this.filter_list.push(new NodeFilter(group, t));
                this.filter_index.set(t, idx++);
            }
        }
    }
    registerObserver(observer) {
        this.observers.push(observer);
    }
    removeObserver(observer) {
        this.observers = this.observers.filter((val) => val != observer);
    }
    notifyObserver() {
        for (const obs of this.observers) {
            obs.update(this.filter_list);
        }
    }
    addFilter(filter) {
        const idx = this.filter_index.get(filter);
        if (!idx)
            return;
        if (this.filter_list[idx].isActive)
            return;
        this.filter_list[idx].enable();
        this.notifyObserver();
    }
    removeFilter(filter) {
        const idx = this.filter_index.get(filter);
        if (!idx)
            return;
        if (!this.filter_list[idx].isActive)
            return;
        this.filter_list[idx].disable();
        this.notifyObserver();
    }
    getFilterByGroup(group) {
        return this.filter_list.filter((val) => val.group == group);
    }
    get activeFilters() {
        return this.filter_list.filter((val) => val.isActive);
    }
    get allFilters() {
        return this.filter_list;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JzZXJ2ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJvYnNlcnZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDekMsT0FBTyxFQUdOLFdBQVcsRUFJWCxjQUFjLEVBQ2QsVUFBVSxFQUNWLGFBQWEsR0FDYixNQUFNLGFBQWEsQ0FBQztBQUVyQixPQUFPLEVBQ04sa0JBQWtCLEVBQ2xCLHVCQUF1QixFQUN2QixrQkFBa0IsRUFFbEIsa0JBQWtCLEdBQ2xCLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLFVBQVU7QUFFVixNQUFNLE9BQWdCLFFBQVE7Q0FFN0I7QUFFRCxNQUFNLE9BQWdCLFNBQVM7Q0FJOUI7QUFFRCxNQUFNLE9BQWdCLE9BQU87Q0FJNUI7QUFFRCxNQUFNLE9BQU8sWUFBWTtJQUV4QixZQUFZLFFBQXVDO1FBQ2xELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO0lBQzFCLENBQUM7SUFDRCxNQUFNLENBQUMsS0FBbUI7UUFDekIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QixDQUFDO0NBQ0Q7QUFFRCxNQUFNLE9BQU8sa0JBQWtCO0lBRTlCLFlBQVksUUFBeUM7UUFDcEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDMUIsQ0FBQztJQUNELE1BQU0sQ0FBQyxPQUFxQjtRQUMzQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3hCLENBQUM7Q0FDRDtBQUVELFVBQVU7QUFFVixNQUFNLE9BQU8saUJBQWlCO0lBQTlCOztRQUVTLFdBQU0sR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQWtEbkUsQ0FBQztJQWhEQSxPQUFPLENBQUMsSUFBMEIsRUFBRSxVQUFzQjtRQUN6RCxJQUFJLENBQUMsSUFBSTtZQUFFLE9B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QUFDO0lBRUQsZ0JBQWdCLENBQUMsS0FBYTtRQUM3QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxDQUFDO0lBQzdELENBQUM7SUFFRCxJQUFJLGFBQWE7UUFDaEIsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFFRCxJQUFJLFVBQVU7UUFDYixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDekIsQ0FBQztDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRE9NSGFuZGxlciB9IGZyb20gXCJkb20vaGFuZGxlclwiO1xuaW1wb3J0IHtcblx0Q1JBRlRZX05PREVfU09SVF9UWVBFLFxuXHRDcmFmdHlOb2RlLFxuXHRGSUxFX0ZPUk1BVCxcblx0RklMRV9UWVBFLFxuXHROT0RFX09SREVSLFxuXHROT0RFX1RZUEUsXG5cdE5vZGVDb21wYXJhdG9yLFxuXHROb2RlRmlsdGVyLFxuXHROb2Rlc0V4cGxvcmVyLFxufSBmcm9tIFwibm9kZXMvbm9kZXNcIjtcbmltcG9ydCB7IFdvcmtzcGFjZUxlYWYgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7XG5cdEF1ZGlvU3BlY2lmaWNhdGlvbixcblx0RXhwcmVzc2lvblNwZWNpZmljYXRpb24sXG5cdEltYWdlU3BlY2lmaWNhdGlvbixcblx0U3BlY2lmaWNhdGlvbixcblx0VmlkZW9TcGVjaWZpY2F0aW9uLFxufSBmcm9tIFwic3BlY2lmaWNhdGlvblwiO1xuLy8gVFlQRSAvL1xuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgT2JzZXJ2ZXIge1xuXHR1cGRhdGU6ICguLi5hcmdzOiBhbnlbXSkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5hdmlnYXRvcjxUPiB7XG5cdGN1cnJlbnQ6IChlbGVtOiBUKSA9PiB2b2lkO1xuXHRuZXh0OiAoKSA9PiB2b2lkO1xuXHRwcmV2aW91czogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFN1YmplY3Qge1xuXHRyZWdpc3Rlck9ic2VydmVyOiAob2JzZXJ2ZXI6IE9ic2VydmVyKSA9PiB2b2lkO1xuXHRyZW1vdmVPYnNlcnZlcjogKG9ic2VydmVyOiBPYnNlcnZlcikgPT4gdm9pZDtcblx0bm90aWZ5T2JzZXJ2ZXI6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlT2JzZXJ2ZXIgaW1wbGVtZW50cyBPYnNlcnZlciB7XG5cdGNhbGxiYWNrOiAobm9kZXM6IENyYWZ0eU5vZGVbXSkgPT4gdm9pZDtcblx0Y29uc3RydWN0b3IoY2FsbGJhY2s6IChub2RlczogQ3JhZnR5Tm9kZVtdKSA9PiB2b2lkKSB7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXHR9XG5cdHVwZGF0ZShub2RlczogQ3JhZnR5Tm9kZVtdKSB7XG5cdFx0dGhpcy5jYWxsYmFjayhub2Rlcyk7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVGaWx0ZXJPYnNlcnZlciBpbXBsZW1lbnRzIE9ic2VydmVyIHtcblx0Y2FsbGJhY2s6IChmaWx0ZXJzOiBOb2RlRmlsdGVyW10pID0+IHZvaWQ7XG5cdGNvbnN0cnVjdG9yKGNhbGxiYWNrOiAoZmlsdGVyczogTm9kZUZpbHRlcltdKSA9PiB2b2lkKSB7XG5cdFx0dGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuXHR9XG5cdHVwZGF0ZShmaWx0ZXJzOiBOb2RlRmlsdGVyW10pIHtcblx0XHR0aGlzLmNhbGxiYWNrKGZpbHRlcnMpO1xuXHR9XG59XG5cbi8vIFRZUEUgLy9cblxuZXhwb3J0IGNsYXNzIEF0dHJpYnV0ZU9ic2VydmVyIHtcblx0cHJpdmF0ZSBvYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGw7XG5cdHByaXZhdGUgY29uZmlnID0geyBhdHRyaWJ1dGVzOiB0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6IFtcImNsYXNzXCJdIH07XG5cblx0b2JzZXJ2ZShsZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCwgbm9kZV9zdGF0ZTogTm9kZXNTdGF0ZSkge1xuXHRcdGlmICghbGVhZikgcmV0dXJuO1xuXHRcdGlmICh0aGlzLm9ic2VydmVyKSB0aGlzLmRpc2Nvbm5lY3QoKTtcblx0XHR0aGlzLm9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9uKSA9PiB7XG5cdFx0XHR0aGlzLiNjYWxsYmFjayhsZWFmLCBub2RlX3N0YXRlKTtcblx0XHR9KTtcblxuXHRcdHRoaXMuI2FkZE9ic2VydmFibGVFbGVtZW50KGxlYWYpO1xuXHR9XG5cblx0I2NhbGxiYWNrKGxlYWY6IFdvcmtzcGFjZUxlYWYsIG5vZGVfc3RhdGU6IE5vZGVzU3RhdGUpIHtcblx0XHRjb25zdCB2aWV3X3N0YXRlID0gbGVhZi5nZXRWaWV3U3RhdGUoKTtcblx0XHRpZiAodmlld19zdGF0ZS50eXBlICE9IFwiY2FudmFzXCIpIHJldHVybjtcblx0XHRjb25zdCBzZWxlY3Rpb24gPSBBcnJheS5mcm9tKFxuXHRcdFx0Ly9AdHMtaWdub3JlXG5cdFx0XHRsZWFmLnZpZXcuY2FudmFzLnNlbGVjdGlvbixcblx0XHRcdC8vQHRzLWlnbm9yZVxuXHRcdFx0KHZhbCkgPT4gdmFsLmlkXG5cdFx0KTtcblxuXHRcdG5vZGVfc3RhdGUuc2VsZWN0Tm9kZXMoc2VsZWN0aW9uKTtcblx0fVxuXG5cdCNhZGRPYnNlcnZhYmxlRWxlbWVudChsZWFmOiBXb3Jrc3BhY2VMZWFmKSB7XG5cdFx0Y29uc3Qgdmlld19zdGF0ZSA9IGxlYWYuZ2V0Vmlld1N0YXRlKCk7XG5cdFx0aWYgKHZpZXdfc3RhdGUudHlwZSAhPSBcImNhbnZhc1wiKSByZXR1cm47XG5cdFx0Y29uc3Qgbm9kZXMgPSBBcnJheS5mcm9tKFxuXHRcdFx0Ly9AdHMtaWdub3JlXG5cdFx0XHRsZWFmLnZpZXcuY2FudmFzLm5vZGVzLFxuXHRcdFx0Ly9AdHMtaWdub3JlXG5cdFx0XHQoW2lkLCB2YWx1ZV0pID0+ICh7XG5cdFx0XHRcdGlkLFxuXHRcdFx0XHRjb250YWluZXI6IHZhbHVlLm5vZGVFbCxcblx0XHRcdFx0ZGF0YTogdmFsdWUudW5rbm93bkRhdGEsXG5cdFx0XHR9KVxuXHRcdCk7XG5cblx0XHRpZiAodGhpcy5vYnNlcnZlcikge1xuXHRcdFx0Zm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG5cdFx0XHRcdHRoaXMub2JzZXJ2ZXIub2JzZXJ2ZShub2RlLmNvbnRhaW5lciwgdGhpcy5jb25maWcpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGRpc2Nvbm5lY3QoKSB7XG5cdFx0aWYgKHRoaXMub2JzZXJ2ZXIpIHRoaXMub2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuXHRcdHRoaXMub2JzZXJ2ZXIgPSBudWxsO1xuXHR9XG59XG5cbi8qKlxuICpcbiAqL1xuZXhwb3J0IGNsYXNzIE5vZGVzU3RhdGUgaW1wbGVtZW50cyBTdWJqZWN0LCBOYXZpZ2F0b3I8c3RyaW5nPiB7XG5cdHByaXZhdGUgb2JzZXJ2ZXJzOiBOb2RlT2JzZXJ2ZXJbXSA9IFtdO1xuXG5cdHByaXZhdGUgbm9kZV9tYXA6IE1hcDxzdHJpbmcsIG51bWJlcj4gPSBuZXcgTWFwKCk7XG5cdHByaXZhdGUgcmVsX25vZGVfbWFwOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXHRwcml2YXRlIG5vZGVfYXJyOiBDcmFmdHlOb2RlW10gPSBbXTtcblx0cHJpdmF0ZSByZWxfbm9kZV9hcnI6IENyYWZ0eU5vZGVbXSA9IFtdO1xuXHRwcml2YXRlIHNlbGVjdGVkOiBzdHJpbmdbXSA9IFtdO1xuXHRwcml2YXRlIGZpcnN0SUQ6IHN0cmluZztcblx0cHJpdmF0ZSBjdXJyZW50SUQgPSBcIlwiO1xuXHRwcml2YXRlIGxhc3RJRCA9IFwiXCI7XG5cdHByaXZhdGUgbm9kZV9leHBsb3JlciA9IG5ldyBOb2Rlc0V4cGxvcmVyKCk7XG5cdHByaXZhdGUgY3VycmVudFNlYXJjaCA9IFwiXCI7XG5cdHByaXZhdGUgc29ydF9ieTogQ1JBRlRZX05PREVfU09SVF9UWVBFID0gXCJuYW1lXCI7XG5cdHByaXZhdGUgbm9kZV9vcmRlcjogTk9ERV9PUkRFUiA9IFwiYXNjXCI7XG5cdHByaXZhdGUgZmlsdGVyczogTm9kZUZpbHRlcltdID0gW107XG5cblx0cmVnaXN0ZXJPYnNlcnZlcihvYnNlcnZlcjogTm9kZU9ic2VydmVyKSB7XG5cdFx0dGhpcy5vYnNlcnZlcnMucHVzaChvYnNlcnZlcik7XG5cdH1cblx0cmVtb3ZlT2JzZXJ2ZXIob2JzZXJ2ZXI6IE5vZGVPYnNlcnZlcikge1xuXHRcdHRoaXMub2JzZXJ2ZXJzID0gdGhpcy5vYnNlcnZlcnMuZmlsdGVyKCh2YWwpID0+IHZhbCAhPSBvYnNlcnZlcik7XG5cdH1cblx0bm90aWZ5T2JzZXJ2ZXIoKSB7XG5cdFx0Zm9yIChjb25zdCBvYnMgb2YgdGhpcy5vYnNlcnZlcnMpIHtcblx0XHRcdG9icy51cGRhdGUodGhpcy5ub2Rlcyk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gTGlzdFxuXHQjc3dhcElkeChsZWZ0OiBudW1iZXIsIHJpZ2h0OiBudW1iZXIpIHtcblx0XHRjb25zdCBub2RlMSA9IHRoaXMubm9kZV9hcnJbbGVmdF07XG5cdFx0Y29uc3Qgbm9kZTIgPSB0aGlzLm5vZGVfYXJyW3JpZ2h0XTtcblxuXHRcdHRoaXMubm9kZV9tYXAuc2V0KG5vZGUxLmlkLCByaWdodCk7XG5cdFx0dGhpcy5ub2RlX21hcC5zZXQobm9kZTIuaWQsIGxlZnQpO1xuXG5cdFx0W3RoaXMubm9kZV9hcnJbbGVmdF0sIHRoaXMubm9kZV9hcnJbcmlnaHRdXSA9IFtcblx0XHRcdHRoaXMubm9kZV9hcnJbcmlnaHRdLFxuXHRcdFx0dGhpcy5ub2RlX2FycltsZWZ0XSxcblx0XHRdO1xuXHR9XG5cblx0I2luZGV4Tm9kZXMoKSB7XG5cdFx0dGhpcy5yZWxfbm9kZV9tYXAuY2xlYXIoKTtcblx0XHRjb25zdCBuID0gdGhpcy5yZWxfbm9kZV9hcnIubGVuZ3RoO1xuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKVxuXHRcdFx0dGhpcy5yZWxfbm9kZV9tYXAuc2V0KHRoaXMucmVsX25vZGVfYXJyW2ldLmlkLCBpKTtcblx0fVxuXG5cdCNjbGVhclJlbE5vZGVzKCkge1xuXHRcdHdoaWxlICh0aGlzLnJlbF9ub2RlX2Fyci5sZW5ndGggPiAwKSB0aGlzLnJlbF9ub2RlX2Fyci5wb3AoKTtcblx0fVxuXG5cdCNzb3J0KCkge1xuXHRcdGNvbnN0IHNvcnRfYnV0dG9uID0gRE9NSGFuZGxlci5nZXRTb3J0QnV0dG9uKCk7XG5cdFx0Y29uc3QgdGV4dCA9IHNvcnRfYnV0dG9uLnF1ZXJ5U2VsZWN0b3IoXCIuc2ItdGV4dFwiKSBhcyBIVE1MU3BhbkVsZW1lbnQ7XG5cdFx0Y29uc3Qgc29ydF9tZW51ID0gRE9NSGFuZGxlci5nZXRTb3J0TWVudSgpO1xuXHRcdGNvbnN0IHNvcnRfbmFtZSA9IHNvcnRfbWVudS5xdWVyeVNlbGVjdG9yKFwiLnMtbmFtZVwiKTtcblx0XHRjb25zdCBzb3J0X2NyZWF0ZWQgPSBzb3J0X21lbnUucXVlcnlTZWxlY3RvcihcIi5zLWNyZWF0ZWRcIik7XG5cdFx0Y29uc3Qgc29ydF9sYXN0ID0gc29ydF9tZW51LnF1ZXJ5U2VsZWN0b3IoXCIucy1sYXN0XCIpO1xuXHRcdC8vQHRzLWlnbm9yZVxuXHRcdGZvciAoY29uc3Qgbm9kZSBvZiBbc29ydF9uYW1lLCBzb3J0X2NyZWF0ZWQsIHNvcnRfbGFzdF0pIHtcblx0XHRcdGlmICghbm9kZSkgY29udGludWU7XG5cdFx0XHRub2RlLmNsYXNzTGlzdC5yZW1vdmUoXCJjaGVjay1hY3RpdmVcIik7XG5cdFx0fVxuXHRcdHN3aXRjaCAodGhpcy5zb3J0X2J5KSB7XG5cdFx0XHRjYXNlIFwibmFtZVwiOlxuXHRcdFx0XHR0aGlzLnJlbF9ub2RlX2Fyci5zb3J0KE5vZGVDb21wYXJhdG9yLlNPUlRfQllfTkFNRSk7XG5cdFx0XHRcdGlmICh0ZXh0KSB0ZXh0LnNldFRleHQoXCJOYW1lXCIpO1xuXHRcdFx0XHRpZiAoc29ydF9uYW1lKSBzb3J0X25hbWUuY2xhc3NMaXN0LmFkZChcImNoZWNrLWFjdGl2ZVwiKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiY3JlYXRlZF9hdFwiOlxuXHRcdFx0XHR0aGlzLnJlbF9ub2RlX2Fyci5zb3J0KE5vZGVDb21wYXJhdG9yLlNPUlRfQllfQ1JFQVRFRF9BVCk7XG5cdFx0XHRcdGlmICh0ZXh0KSB0ZXh0LnNldFRleHQoXCJDcmVhdGVkX2F0XCIpO1xuXHRcdFx0XHRpZiAoc29ydF9jcmVhdGVkKSBzb3J0X2NyZWF0ZWQuY2xhc3NMaXN0LmFkZChcImNoZWNrLWFjdGl2ZVwiKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwibGFzdF9tb2RpZmllZFwiOlxuXHRcdFx0XHR0aGlzLnJlbF9ub2RlX2Fyci5zb3J0KE5vZGVDb21wYXJhdG9yLlNPUlRfQllfTEFTVF9NT0RJRklFRCk7XG5cdFx0XHRcdGlmICh0ZXh0KSB0ZXh0LnNldFRleHQoXCJMYXN0X21vZGlmaWVkXCIpO1xuXHRcdFx0XHRpZiAoc29ydF9sYXN0KSBzb3J0X2xhc3QuY2xhc3NMaXN0LmFkZChcImNoZWNrLWFjdGl2ZVwiKTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aGlzLnJlbF9ub2RlX2Fyci5zb3J0KE5vZGVDb21wYXJhdG9yLlNPUlRfQllfTkFNRSk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdH1cblx0fVxuXG5cdCNvcmRlcigpIHtcblx0XHRjb25zdCBzb3J0X21lbnUgPSBET01IYW5kbGVyLmdldFNvcnRNZW51KCk7XG5cdFx0Y29uc3Qgc29ydF9hc2MgPSBzb3J0X21lbnUucXVlcnlTZWxlY3RvcihcIi5zLWFzY1wiKTtcblx0XHRjb25zdCBzb3J0X2Rlc2MgPSBzb3J0X21lbnUucXVlcnlTZWxlY3RvcihcIi5zLWRlc2NcIik7XG5cdFx0Ly9AdHMtaWdub3JlXG5cdFx0Zm9yIChjb25zdCBub2RlIG9mIFtzb3J0X2FzYywgc29ydF9kZXNjXSkge1xuXHRcdFx0aWYgKCFub2RlKSBjb250aW51ZTtcblx0XHRcdG5vZGUuY2xhc3NMaXN0LnJlbW92ZShcImNoZWNrLWFjdGl2ZVwiKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5ub2RlX29yZGVyID09IFwiZGVzXCIpIHtcblx0XHRcdHRoaXMucmVsX25vZGVfYXJyLnJldmVyc2UoKTtcblx0XHRcdGlmIChzb3J0X2Rlc2MpIHNvcnRfZGVzYy5jbGFzc0xpc3QuYWRkKFwiY2hlY2stYWN0aXZlXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoc29ydF9hc2MpIHNvcnRfYXNjLmNsYXNzTGlzdC5hZGQoXCJjaGVjay1hY3RpdmVcIik7XG5cdFx0fVxuXHR9XG5cblx0I2dldEZpbHRlclNwZWMoKSB7XG5cdFx0aWYgKHRoaXMuZmlsdGVycy5sZW5ndGggPT0gMClcblx0XHRcdHJldHVybiBuZXcgRXhwcmVzc2lvblNwZWNpZmljYXRpb248Q3JhZnR5Tm9kZT4oKCkgPT4gdHJ1ZSk7XG5cdFx0bGV0IHNwZWNpZmljYXRpb246IFNwZWNpZmljYXRpb248Q3JhZnR5Tm9kZT4gPVxuXHRcdFx0bmV3IEV4cHJlc3Npb25TcGVjaWZpY2F0aW9uPENyYWZ0eU5vZGU+KCgpID0+IGZhbHNlKTtcblxuXHRcdGZvciAoY29uc3QgZmlsdGVyIG9mIHRoaXMuZmlsdGVycykge1xuXHRcdFx0aWYgKGZpbHRlci50eXBlID09IFwiYXVkaW9cIikge1xuXHRcdFx0XHRzcGVjaWZpY2F0aW9uID0gc3BlY2lmaWNhdGlvbi5vcihcblx0XHRcdFx0XHRuZXcgQXVkaW9TcGVjaWZpY2F0aW9uPENyYWZ0eU5vZGU+KClcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSBpZiAoZmlsdGVyLnR5cGUgPT0gXCJ2aWRlb1wiKSB7XG5cdFx0XHRcdHNwZWNpZmljYXRpb24gPSBzcGVjaWZpY2F0aW9uLm9yKFxuXHRcdFx0XHRcdG5ldyBWaWRlb1NwZWNpZmljYXRpb248Q3JhZnR5Tm9kZT4oKVxuXHRcdFx0XHQpO1xuXHRcdFx0fSBlbHNlIGlmIChmaWx0ZXIudHlwZSA9PSBcImltYWdlXCIpIHtcblx0XHRcdFx0c3BlY2lmaWNhdGlvbiA9IHNwZWNpZmljYXRpb24ub3IoXG5cdFx0XHRcdFx0bmV3IEltYWdlU3BlY2lmaWNhdGlvbjxDcmFmdHlOb2RlPigpXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjb25zdCBvcl9zcGVjaWZpY2F0aW9uID1cblx0XHRcdFx0XHRuZXcgRXhwcmVzc2lvblNwZWNpZmljYXRpb248Q3JhZnR5Tm9kZT4oKGNhbmRpZGF0ZSkgPT4ge1xuXHRcdFx0XHRcdFx0aWYgKGNhbmRpZGF0ZS50eXBlID09IFwiZmlsZVwiKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gY2FuZGlkYXRlLmV4dGVuc2lvbiA9PSBmaWx0ZXIudHlwZTtcblx0XHRcdFx0XHRcdGVsc2UgcmV0dXJuIGNhbmRpZGF0ZS50eXBlID09IGZpbHRlci50eXBlO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRzcGVjaWZpY2F0aW9uID0gc3BlY2lmaWNhdGlvbi5vcihvcl9zcGVjaWZpY2F0aW9uKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gc3BlY2lmaWNhdGlvbjtcblx0fVxuXG5cdCNQb3B1bGF0ZVJlbE5vZGVzKG5vZGVzOiBDcmFmdHlOb2RlW10pIHtcblx0XHR0aGlzLiNjbGVhclJlbE5vZGVzKCk7XG5cdFx0Y29uc3Qgc3BlYyA9IHRoaXMuI2dldEZpbHRlclNwZWMoKTtcblx0XHRmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcblx0XHRcdGlmIChzcGVjLmlzU2F0aXNmaWVkKG5vZGUpKSB0aGlzLnJlbF9ub2RlX2Fyci5wdXNoKG5vZGUpO1xuXHRcdH1cblxuXHRcdHRoaXMuI3NvcnQoKTtcblx0XHR0aGlzLiNvcmRlcigpO1xuXHRcdHRoaXMuI2luZGV4Tm9kZXMoKTtcblx0fVxuXG5cdGFkZChub2RlczogQ3JhZnR5Tm9kZVtdKSB7XG5cdFx0Zm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG5cdFx0XHRpZiAodGhpcy5ub2RlX21hcC5zaXplID09IDApIHRoaXMuZmlyc3RJRCA9IG5vZGUuaWQ7XG5cdFx0XHRpZiAodGhpcy5zZWxlY3RlZC5pbmNsdWRlcyhub2RlLmlkKSkgbm9kZS5zZWxlY3RlZCA9IHRydWU7XG5cdFx0XHR0aGlzLm5vZGVfbWFwLnNldChub2RlLmlkLCB0aGlzLm5vZGVfYXJyLmxlbmd0aCk7XG5cdFx0XHR0aGlzLm5vZGVfYXJyLnB1c2gobm9kZSk7XG5cdFx0XHR0aGlzLm5vZGVfZXhwbG9yZXIuYWRkKG5vZGUpO1xuXHRcdH1cblx0XHR0aGlzLmZpcnN0SUQgPSBcIlwiO1xuXHRcdGlmIChub2Rlcy5sZW5ndGggPiAwKSB0aGlzLmZpcnN0SUQgPSB0aGlzLm5vZGVfYXJyWzBdLmlkO1xuXHRcdHRoaXMubm90aWZ5T2JzZXJ2ZXIoKTtcblx0fVxuXG5cdHJlbW92ZShpZF9saXN0OiBzdHJpbmdbXSkge1xuXHRcdGZvciAoY29uc3QgaWQgb2YgaWRfbGlzdCkge1xuXHRcdFx0aWYgKHRoaXMubm9kZV9tYXAuaGFzKGlkKSkge1xuXHRcdFx0XHQvL0B0cy1pZ25vcmVcblx0XHRcdFx0dGhpcy4jc3dhcElkeCh0aGlzLm5vZGVfbWFwLmdldChpZCksIHRoaXMubm9kZV9hcnIubGVuZ3RoIC0gMSk7XG5cdFx0XHRcdGNvbnN0IG5vZGUgPSB0aGlzLm5vZGVfYXJyLnBvcCgpO1xuXHRcdFx0XHRpZiAobm9kZSkgdGhpcy5ub2RlX2V4cGxvcmVyLnJlbW92ZShub2RlKTtcblx0XHRcdFx0dGhpcy5ub2RlX21hcC5kZWxldGUoaWQpO1xuXHRcdFx0XHQvL0B0cy1pZ25vcmVcblx0XHRcdFx0dGhpcy4jc3dhcElkeCh0aGlzLm5vZGVfbWFwLmdldChpZCksIHRoaXMubm9kZV9hcnIubGVuZ3RoIC0gMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5ub3RpZnlPYnNlcnZlcigpO1xuXHR9XG5cblx0cmVwbGFjZShub2RlczogQ3JhZnR5Tm9kZVtdKSB7XG5cdFx0d2hpbGUgKHRoaXMubm9kZV9hcnIubGVuZ3RoID4gMCkgdGhpcy5ub2RlX2Fyci5wb3AoKTtcblx0XHR0aGlzLm5vZGVfbWFwLmNsZWFyKCk7XG5cdFx0dGhpcy5ub2RlX2V4cGxvcmVyLmNsZWFyKCk7XG5cdFx0dGhpcy5hZGQobm9kZXMpO1xuXHR9XG5cblx0c2VsZWN0Tm9kZXMoaWRfbGlzdDogc3RyaW5nW10pIHtcblx0XHRjb25zdCBuID0gaWRfbGlzdC5sZW5ndGg7XG5cdFx0dGhpcy5zZWxlY3RlZCA9IGlkX2xpc3Q7XG5cdFx0aWYgKG4gPT0gMCkge1xuXHRcdFx0dGhpcy5jdXJyZW50SUQgPSBcIlwiO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmxhc3RJRCA9IHRoaXMuY3VycmVudElEO1xuXHRcdFx0dGhpcy5jdXJyZW50SUQgPSBpZF9saXN0WzBdO1xuXHRcdH1cblx0XHRmb3IgKGNvbnN0IG5vZGUgb2YgdGhpcy5ub2RlX2Fycikgbm9kZS5zZWxlY3RlZCA9IGZhbHNlO1xuXHRcdGZvciAoY29uc3QgaWQgb2YgaWRfbGlzdCkge1xuXHRcdFx0Y29uc3Qgbm9kZV9pZHggPSB0aGlzLm5vZGVfbWFwLmdldChpZCk7XG5cdFx0XHRpZiAobm9kZV9pZHggPT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblx0XHRcdHRoaXMubm9kZV9hcnJbbm9kZV9pZHhdLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHR9XG5cdFx0dGhpcy5ub3RpZnlPYnNlcnZlcigpO1xuXHR9XG5cblx0b3JkZXIob3JkZXI6IE5PREVfT1JERVIpIHtcblx0XHRpZiAodGhpcy5ub2RlX29yZGVyICE9IG9yZGVyKSB7XG5cdFx0XHR0aGlzLm5vZGVfb3JkZXIgPSBvcmRlcjtcblx0XHRcdHRoaXMubm90aWZ5T2JzZXJ2ZXIoKTtcblx0XHR9XG5cdH1cblxuXHRzb3J0Qnkoc29ydF9ieTogQ1JBRlRZX05PREVfU09SVF9UWVBFKSB7XG5cdFx0aWYgKHRoaXMuc29ydF9ieSAhPSBzb3J0X2J5KSB7XG5cdFx0XHR0aGlzLnNvcnRfYnkgPSBzb3J0X2J5O1xuXHRcdFx0dGhpcy5ub3RpZnlPYnNlcnZlcigpO1xuXHRcdH1cblx0fVxuXG5cdHNldEZpbHRlcnMoZmlsdGVyczogTm9kZUZpbHRlcltdKSB7XG5cdFx0dGhpcy5maWx0ZXJzID0gZmlsdGVycztcblx0XHR0aGlzLm5vdGlmeU9ic2VydmVyKCk7XG5cdH1cblxuXHQvLyBTZWFyY2hcblxuXHQjdXBkYXRlKCkge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRTZWFyY2ggPT0gXCJcIikgdGhpcy4jUG9wdWxhdGVSZWxOb2Rlcyh0aGlzLm5vZGVfYXJyKTtcblx0XHRlbHNlIHtcblx0XHRcdHRoaXMuI1BvcHVsYXRlUmVsTm9kZXMoXG5cdFx0XHRcdC8vIHRoaXMubm9kZV9leHBsb3Jlci5maW5kU2ltaWxhcih0aGlzLmN1cnJlbnRTZWFyY2gsIDQpXG5cdFx0XHRcdHRoaXMubm9kZV9leHBsb3Jlci5wcmVmaXhTZWFyY2godGhpcy5jdXJyZW50U2VhcmNoKVxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxuXHRzZXRTZWFyY2hXb3JkKHdvcmQ6IHN0cmluZykge1xuXHRcdHRoaXMuY3VycmVudFNlYXJjaCA9IHdvcmQ7XG5cdFx0dGhpcy5ub3RpZnlPYnNlcnZlcigpO1xuXHR9XG5cblx0Ly8gTmF2aWdhdG9yXG5cdGN1cnJlbnQoaWQ6IHN0cmluZykge1xuXHRcdHRoaXMuY3VycmVudElEID0gaWQ7XG5cdFx0Y29uc3QgaWR4ID0gdGhpcy5ub2RlX21hcC5nZXQoaWQpO1xuXHRcdGlmIChpZHggPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG5cdFx0Y29uc3QgbmV4dF9ub2RlID0gdGhpcy5ub2RlX2FycltpZHhdO1xuXHRcdGlmICghbmV4dF9ub2RlLmNvbnRhaW5lcikgcmV0dXJuO1xuXHRcdG5leHRfbm9kZS5jb250YWluZXIuY2xpY2soKTtcblx0fVxuXG5cdCNmaW5kRmlyc3ROb2RlKCkge1xuXHRcdGNvbnN0IGlkID0gdGhpcy5yZWxfbm9kZV9hcnJbMF0uaWQ7XG5cdFx0dGhpcy5jdXJyZW50SUQgPSBpZCB8fCBcIlwiO1xuXG5cdFx0Y29uc3QgaWR4ID0gdGhpcy5yZWxfbm9kZV9tYXAuZ2V0KGlkKTtcblx0XHRpZiAoaWR4ID09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XG5cblx0XHRjb25zdCBuZXh0X25vZGUgPSB0aGlzLnJlbF9ub2RlX2FycltpZHhdO1xuXHRcdGlmICghbmV4dF9ub2RlLmNvbnRhaW5lcikgcmV0dXJuIG51bGw7XG5cblx0XHRyZXR1cm4gbmV4dF9ub2RlO1xuXHR9XG5cblx0bmV4dCgpIHtcblx0XHRjb25zdCBpZHggPSB0aGlzLnJlbF9ub2RlX21hcC5nZXQodGhpcy5jdXJyZW50SUQpO1xuXG5cdFx0aWYgKGlkeCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjb25zdCBuZXh0X25vZGUgPSB0aGlzLiNmaW5kRmlyc3ROb2RlKCk7XG5cdFx0XHRpZiAoIW5leHRfbm9kZSB8fCAhbmV4dF9ub2RlLmNvbnRhaW5lcikgcmV0dXJuO1xuXHRcdFx0bmV4dF9ub2RlLmNvbnRhaW5lci5jbGljaygpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGNvbnN0IG5leHRfaWR4ID0gKGlkeCArIDEpICUgdGhpcy5yZWxfbm9kZV9hcnIubGVuZ3RoO1xuXHRcdGNvbnN0IG5leHRfbm9kZSA9IHRoaXMucmVsX25vZGVfYXJyW25leHRfaWR4XTtcblx0XHRpZiAoIW5leHRfbm9kZS5jb250YWluZXIpIHJldHVybjtcblx0XHRuZXh0X25vZGUuY29udGFpbmVyLmNsaWNrKCk7XG5cdH1cblx0cHJldmlvdXMoKSB7XG5cdFx0Y29uc3QgaWR4ID0gdGhpcy5yZWxfbm9kZV9tYXAuZ2V0KHRoaXMuY3VycmVudElEKTtcblxuXHRcdGlmIChpZHggPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y29uc3QgbmV4dF9ub2RlID0gdGhpcy4jZmluZEZpcnN0Tm9kZSgpO1xuXHRcdFx0aWYgKCFuZXh0X25vZGUgfHwgIW5leHRfbm9kZS5jb250YWluZXIpIHJldHVybjtcblx0XHRcdG5leHRfbm9kZS5jb250YWluZXIuY2xpY2soKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCBwcmV2X2lkeCA9IGlkeCAtIDEgPCAwID8gdGhpcy5yZWxfbm9kZV9hcnIubGVuZ3RoIC0gMSA6IGlkeCAtIDE7XG5cdFx0Y29uc3QgbmV4dF9ub2RlID0gdGhpcy5yZWxfbm9kZV9hcnJbcHJldl9pZHhdO1xuXHRcdGlmICghbmV4dF9ub2RlLmNvbnRhaW5lcikgcmV0dXJuO1xuXHRcdG5leHRfbm9kZS5jb250YWluZXIuY2xpY2soKTtcblx0fVxuXG5cdGdldCBub2RlcygpIHtcblx0XHR0aGlzLiN1cGRhdGUoKTtcblx0XHRyZXR1cm4gdGhpcy5yZWxfbm9kZV9hcnI7XG5cdH1cblxuXHRnZXQgYWxsTm9kZXMoKSB7XG5cdFx0cmV0dXJuIHRoaXMubm9kZV9hcnI7XG5cdH1cblxuXHRnZXQgc2VsZWN0ZWROb2RlKCkge1xuXHRcdGNvbnN0IGlkeCA9IHRoaXMubm9kZV9tYXAuZ2V0KHRoaXMuY3VycmVudElEKTtcblx0XHRpZiAoaWR4ID09IHVuZGVmaW5lZCkgcmV0dXJuIG51bGw7XG5cdFx0cmV0dXJuIHRoaXMubm9kZV9hcnJbaWR4XTtcblx0fVxuXG5cdGdldCBpc05vZGVTYW1lKCkge1xuXHRcdGlmICh0aGlzLmN1cnJlbnRJRCA9PSBcIlwiIHx8IHRoaXMubGFzdElEID09IFwiXCIpIHJldHVybiBmYWxzZTtcblx0XHRyZXR1cm4gdGhpcy5jdXJyZW50SUQgPT0gdGhpcy5sYXN0SUQ7XG5cdH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVzRmlsdGVyU3RhdGUgaW1wbGVtZW50cyBTdWJqZWN0IHtcblx0cHJpdmF0ZSBvYnNlcnZlcnM6IE5vZGVGaWx0ZXJPYnNlcnZlcltdID0gW107XG5cdHByaXZhdGUgZmlsdGVyX2luZGV4OiBNYXA8RklMRV9UWVBFIHwgTk9ERV9UWVBFLCBudW1iZXI+ID0gbmV3IE1hcCgpO1xuXHRwcml2YXRlIGZpbHRlcl9saXN0OiBOb2RlRmlsdGVyW10gPSBbXTtcblxuXHRjb25zdHJ1Y3RvcigpIHtcblx0XHRsZXQgaWR4ID0gMDtcblx0XHRmb3IgKGNvbnN0IGdyb3VwIGluIEZJTEVfRk9STUFUKSB7XG5cdFx0XHQvL0B0cy1pZ25vcmVcblx0XHRcdGZvciAoY29uc3QgdHlwZSBpbiBGSUxFX0ZPUk1BVFtncm91cF0pIHtcblx0XHRcdFx0Y29uc3QgdCA9IHR5cGUgYXMgRklMRV9UWVBFO1xuXHRcdFx0XHR0aGlzLmZpbHRlcl9saXN0LnB1c2gobmV3IE5vZGVGaWx0ZXIoZ3JvdXAsIHQpKTtcblx0XHRcdFx0dGhpcy5maWx0ZXJfaW5kZXguc2V0KHQsIGlkeCsrKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZWdpc3Rlck9ic2VydmVyKG9ic2VydmVyOiBOb2RlRmlsdGVyT2JzZXJ2ZXIpIHtcblx0XHR0aGlzLm9ic2VydmVycy5wdXNoKG9ic2VydmVyKTtcblx0fVxuXHRyZW1vdmVPYnNlcnZlcihvYnNlcnZlcjogTm9kZUZpbHRlck9ic2VydmVyKSB7XG5cdFx0dGhpcy5vYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVycy5maWx0ZXIoKHZhbCkgPT4gdmFsICE9IG9ic2VydmVyKTtcblx0fVxuXHRub3RpZnlPYnNlcnZlcigpIHtcblx0XHRmb3IgKGNvbnN0IG9icyBvZiB0aGlzLm9ic2VydmVycykge1xuXHRcdFx0b2JzLnVwZGF0ZSh0aGlzLmZpbHRlcl9saXN0KTtcblx0XHR9XG5cdH1cblxuXHRhZGRGaWx0ZXIoZmlsdGVyOiBGSUxFX1RZUEUpIHtcblx0XHRjb25zdCBpZHggPSB0aGlzLmZpbHRlcl9pbmRleC5nZXQoZmlsdGVyKTtcblx0XHRpZiAoIWlkeCkgcmV0dXJuO1xuXHRcdGlmICh0aGlzLmZpbHRlcl9saXN0W2lkeF0uaXNBY3RpdmUpIHJldHVybjtcblx0XHR0aGlzLmZpbHRlcl9saXN0W2lkeF0uZW5hYmxlKCk7XG5cdFx0dGhpcy5ub3RpZnlPYnNlcnZlcigpO1xuXHR9XG5cblx0cmVtb3ZlRmlsdGVyKGZpbHRlcjogRklMRV9UWVBFKSB7XG5cdFx0Y29uc3QgaWR4ID0gdGhpcy5maWx0ZXJfaW5kZXguZ2V0KGZpbHRlcik7XG5cdFx0aWYgKCFpZHgpIHJldHVybjtcblx0XHRpZiAoIXRoaXMuZmlsdGVyX2xpc3RbaWR4XS5pc0FjdGl2ZSkgcmV0dXJuO1xuXHRcdHRoaXMuZmlsdGVyX2xpc3RbaWR4XS5kaXNhYmxlKCk7XG5cdFx0dGhpcy5ub3RpZnlPYnNlcnZlcigpO1xuXHR9XG5cblx0Z2V0RmlsdGVyQnlHcm91cChncm91cDogc3RyaW5nKSB7XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVyX2xpc3QuZmlsdGVyKCh2YWwpID0+IHZhbC5ncm91cCA9PSBncm91cCk7XG5cdH1cblxuXHRnZXQgYWN0aXZlRmlsdGVycygpIHtcblx0XHRyZXR1cm4gdGhpcy5maWx0ZXJfbGlzdC5maWx0ZXIoKHZhbCkgPT4gdmFsLmlzQWN0aXZlKTtcblx0fVxuXG5cdGdldCBhbGxGaWx0ZXJzKCkge1xuXHRcdHJldHVybiB0aGlzLmZpbHRlcl9saXN0O1xuXHR9XG59XG4iXX0=