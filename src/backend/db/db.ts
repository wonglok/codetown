import { CorePaths } from "../core/workpath";

// @ts-ignore
import dbLocal from "db-local";

const { Schema } = new dbLocal({ path: CorePaths.databases });

export const getID = () =>
	`_${Math.random().toString(36).slice(2, 9)}${Math.random().toString(36).slice(2, 9)}`;

export const Tools = Schema("Tools", {
	_id: { type: String, required: true },
	displayName: { type: String, default: "Qwen Code" },
	toolname: { type: String, default: "qwen" },
	cmd: { type: Array, default: ["qwen"] },
});

export const Avatar = Schema("Avatar", {
	_id: { type: String, required: true },
	name: { type: String, default: "Person" },
	avatarType: { type: String, default: "guy" },
	toolType: { type: String, default: "qwen" },
	position: { type: Array, default: [0, 0, 0] },
	scale: { type: Array, default: [1, 1, 1] },
	quaternion: { type: Array, default: [0, 0, 0, 1] },
});

export const TaskType = Schema("TaskType", {
	_id: { type: String, required: true },
	name: { type: String, default: "Task" },
});

export const TaskItem = Schema("TaskItem", {
	_id: { type: String, required: true },
	type: { type: String, default: "type" },
	prompt: { type: String, default: "" },
	result: { type: String, default: "" },
	error: { type: String, default: "" },
});
