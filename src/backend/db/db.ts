import { JSONFileSyncPreset } from "lowdb/node";
import { join } from "path";

export const getSettings = ({
	currentWorkingDir,
}: {
	currentWorkingDir: string;
}) => {
	//

	//
	const settings = JSONFileSyncPreset(
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

	return { settings };
};
