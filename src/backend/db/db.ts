import { join } from "path";
import { JSONFileSyncPreset } from "lowdb/node";
import { currentWorkingDir } from "../core/workpath";

export const settings = JSONFileSyncPreset(
	join(currentWorkingDir, ".codetown", "settings.json"),
	{
		codingTools: [
			{
				//
				chose: false,
				displayName: "Qwen code",
				keyname: "qwen",
				cmd: ["qwen"],
			},
			{
				//
				chose: true,
				displayName: "Opencode",
				keyname: "opencode",
				cmd: ["opencode"],
			},
		],
	},
);
