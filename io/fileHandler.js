import { __awaiter } from "tslib";
export class FileHandler {
    static updateCanvasNode(node, file, vault) {
        return __awaiter(this, void 0, void 0, function* () {
            const content = yield vault.read(file);
            try {
                const parsed_data = JSON.parse(content);
                for (const elem of parsed_data.nodes) {
                    if (elem.id == node.id) {
                        delete elem.description;
                        delete elem.title;
                        if (node.description && node.description != "") {
                            elem.description = node.description;
                        }
                        if (node.title && node.title != "") {
                            elem.title = node.title;
                        }
                        break;
                    }
                }
                yield vault.modify(file, JSON.stringify(parsed_data));
            }
            catch (error) {
                console.error(error);
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZUhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmaWxlSGFuZGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBR0EsTUFBTSxPQUFPLFdBQVc7SUFDdkIsTUFBTSxDQUFPLGdCQUFnQixDQUFDLElBQWdCLEVBQUUsSUFBVyxFQUFFLEtBQVk7O1lBQ3hFLE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxJQUFJLENBQUM7Z0JBQ0osTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEMsS0FBSyxNQUFNLElBQUksSUFBSSxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7b0JBQ3RDLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7d0JBQ3hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQzt3QkFDeEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDO3dCQUNsQixJQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxFQUFFLEVBQUUsQ0FBQzs0QkFDaEQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO3dCQUNyQyxDQUFDO3dCQUVELElBQUksSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsRUFBRSxDQUFDOzRCQUNwQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7d0JBQ3pCLENBQUM7d0JBQ0QsTUFBTTtvQkFDUCxDQUFDO2dCQUNGLENBQUM7Z0JBQ0QsTUFBTSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7WUFDdkQsQ0FBQztZQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7Z0JBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdEIsQ0FBQztRQUNGLENBQUM7S0FBQTtDQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3JhZnR5Tm9kZSB9IGZyb20gXCJub2Rlcy9ub2Rlc1wiO1xuaW1wb3J0IHsgVEZpbGUsIFZhdWx0IH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmV4cG9ydCBjbGFzcyBGaWxlSGFuZGxlciB7XG5cdHN0YXRpYyBhc3luYyB1cGRhdGVDYW52YXNOb2RlKG5vZGU6IENyYWZ0eU5vZGUsIGZpbGU6IFRGaWxlLCB2YXVsdDogVmF1bHQpIHtcblx0XHRjb25zdCBjb250ZW50ID0gYXdhaXQgdmF1bHQucmVhZChmaWxlKTtcblx0XHR0cnkge1xuXHRcdFx0Y29uc3QgcGFyc2VkX2RhdGEgPSBKU09OLnBhcnNlKGNvbnRlbnQpO1xuXHRcdFx0Zm9yIChjb25zdCBlbGVtIG9mIHBhcnNlZF9kYXRhLm5vZGVzKSB7XG5cdFx0XHRcdGlmIChlbGVtLmlkID09IG5vZGUuaWQpIHtcblx0XHRcdFx0XHRkZWxldGUgZWxlbS5kZXNjcmlwdGlvbjtcblx0XHRcdFx0XHRkZWxldGUgZWxlbS50aXRsZTtcblx0XHRcdFx0XHRpZiAobm9kZS5kZXNjcmlwdGlvbiAmJiBub2RlLmRlc2NyaXB0aW9uICE9IFwiXCIpIHtcblx0XHRcdFx0XHRcdGVsZW0uZGVzY3JpcHRpb24gPSBub2RlLmRlc2NyaXB0aW9uO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChub2RlLnRpdGxlICYmIG5vZGUudGl0bGUgIT0gXCJcIikge1xuXHRcdFx0XHRcdFx0ZWxlbS50aXRsZSA9IG5vZGUudGl0bGU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRhd2FpdCB2YXVsdC5tb2RpZnkoZmlsZSwgSlNPTi5zdHJpbmdpZnkocGFyc2VkX2RhdGEpKTtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0fVxuXHR9XG59XG4iXX0=