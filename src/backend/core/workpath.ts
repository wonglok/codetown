import { join } from "path";

export const currentWorkingDir = process.cwd();

export const CorePaths = {
	databases: join(currentWorkingDir, ".codetown", "databases.json"),
	memoryContext: join(currentWorkingDir, ".codetown", "memoryContext.txt"),
};
