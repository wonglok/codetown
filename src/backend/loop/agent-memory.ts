import * as fs from "fs/promises";
import * as path from "path";
import { currentWorkingDir } from "../core/workpath";

export class AgentMemory {
	private filePath: string;
	public content: string = "";

	constructor(fileName: string = "MEMORY.md") {
		// Resolve the path to the local directory where the CLI is running
		this.filePath = path.resolve(currentWorkingDir, fileName);
		this.content = "";
	}

	/**
	 * 1. PERSISTENCE: The "Living Document"
	 * Loads the memory from the markdown file on startup.
	 * If it doesn't exist, it creates a base template.
	 */
	public async initialize(): Promise<void> {
		try {
			this.content = await fs.readFile(this.filePath, "utf-8");
			console.log(
				`[Memory] Loaded existing memory from ${this.filePath}`,
			);
		} catch (error: any) {
			if (error.code === "ENOENT") {
				// File doesn't exist yet, create the baseline MEMORY.md
				this.content = `# Agent Core Memory\n\n*This is a living document containing learned facts, user preferences, and world state.*\n\n## Core Facts\n\n## User Preferences\n`;
				await this.saveToFile();
				console.log(
					`[Memory] Created new living document at ${this.filePath}`,
				);
			} else {
				console.error(`[Memory] Error reading memory file:`, error);
			}
		}
	}

	/**
	 * Helper to retrieve the current memory string.
	 * You will inject this directly into your Agent's System Prompt.
	 */
	public getMemoryContext(): string {
		return this.content;
	}

	/**
	 * Saves the current RAM state of the memory to the disk.
	 */
	private async saveToFile(): Promise<void> {
		await fs.writeFile(this.filePath, this.content, "utf-8");
	}

	/**
	 * 2. SELF-EDITING: The "Write-Back" Pattern
	 * This is the method you expose to your LLM as a Tool/Function Call (`update_memory`).
	 * The agent decides what to write and where.
	 */
	public async updateMemoryTool(
		action: "append" | "replace",
		text: string,
	): Promise<string> {
		try {
			if (action === "append") {
				const timestamp = new Date().toISOString().split("T")[0];
				this.content += `\n- [${timestamp}] ${text}`;
			} else if (action === "replace") {
				// Agent rewrites the whole file (useful for condensing/compressing)
				this.content = text;
			}

			// Immediately persist to disk
			await this.saveToFile();

			// Return a success message back to the Agent so it knows the tool worked
			return `System: Memory successfully updated and saved to MEMORY.md.`;
		} catch (error: any) {
			return `System Error: Failed to update memory: ${error.message}`;
		}
	}

	/**
	 * Summarise the memory
	 */
	private async summariseMemory(): Promise<void> {
		//
		//
	}
}
