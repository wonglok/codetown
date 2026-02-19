// 1. Define Core Types
type Role = "user" | "assistant" | "system" | "tool";

interface Message {
	role: Role;
	content: string;
	toolCalls?: ToolCall[];
	toolCallId?: string;
}

interface ToolCall {
	id: string;
	name: string;
	args: Record<string, any>;
}

// OpenClaw "Skills" are essentially tools the agent can call
interface Skill {
	name: string;
	description: string;
	requiresApproval: boolean; // Security guardrail for dangerous tasks
	execute: (args: Record<string, any>) => Promise<string>;
}

export class OpenClawAgent {
	private workspacePath: string;
	private skills: Map<string, Skill>;
	private maxIterations: number;

	constructor(workspacePath: string, maxIterations = 10) {
		this.workspacePath = workspacePath;
		this.skills = new Map();
		this.maxIterations = maxIterations;
	}

	/**
	 * Register a new capability (e.g., FileSystemRead, ShellExecute)
	 */
	registerSkill(skill: Skill) {
		this.skills.set(skill.name, skill);
	}

	/**
	 * The core autonomous loop triggered by an event (e.g., a DM or a Heartbeat.md check)
	 */
	async processTrigger(eventContent: string): Promise<string> {
		// 1. Load state (OpenClaw uses local Markdown/YAML for memory)
		const history = await this.loadMemory();

		// 2. Add the new event to the context
		history.push({ role: "user", content: eventContent });

		let iteration = 0;
		let isComplete = false;
		let finalResponse = "";

		// 3. The Agentic Loop
		while (iteration < this.maxIterations && !isComplete) {
			iteration++;
			console.log(`\n--- Agent Loop Iteration ${iteration} ---`);

			// A. Call the LLM with current history and available skills
			const response = await this.callLLM(
				history,
				Array.from(this.skills.values()),
			);
			history.push(response);

			// B. Evaluate if the LLM decided to use tools or talk to the user
			if (response.toolCalls && response.toolCalls.length > 0) {
				// Execute each requested tool
				for (const toolCall of response.toolCalls) {
					console.log(`🛠️ LLM requested tool: ${toolCall.name}`);
					const skill = this.skills.get(toolCall.name);
					let toolResult = "";

					if (!skill) {
						toolResult = `System Error: Skill '${toolCall.name}' not found.`;
					} else {
						// C. Security Check: Block dangerous actions unless explicitly approved
						let isApproved = true;
						if (skill.requiresApproval) {
							isApproved =
								await this.requestHumanApproval(toolCall);
						}

						if (!isApproved) {
							toolResult =
								"System Notification: Execution denied by user.";
						} else {
							try {
								// Execute the actual skill
								toolResult = await skill.execute(toolCall.args);
							} catch (error: any) {
								toolResult = `Skill Error: ${error.message}`;
							}
						}
					}

					// D. Append the observation (tool result) back into the context
					// The loop will cycle again so the LLM can read this result
					history.push({
						role: "tool",
						toolCallId: toolCall.id,
						content: toolResult,
					});
				}
			} else {
				// E. No tools requested means the LLM has reached a final conclusion
				finalResponse = response.content;
				isComplete = true;
			}
		}

		if (!isComplete) {
			finalResponse =
				"System Error: Task aborted. Maximum iterations reached to prevent infinite loops.";
		}

		// 4. Save the updated conversation back to the local filesystem
		await this.saveMemory(history);
		return finalResponse;
	}

	// --- Mocks for External Dependencies ---

	private async callLLM(
		history: Message[],
		skills: Skill[],
	): Promise<Message> {
		// In reality, you'd format the `skills` into OpenAI/Anthropic tool schemas
		// and make an API call to the model here.
		throw new Error(
			"Not implemented: Connect to Claude, DeepSeek, or OpenAI API.",
		);
	}

	private async loadMemory(): Promise<Message[]> {
		// OpenClaw parses `~/.openclaw` and local markdown context
		return [];
	}

	private async saveMemory(history: Message[]): Promise<void> {
		// Write the history back out to `workspacePath`
	}

	private async requestHumanApproval(toolCall: ToolCall): Promise<boolean> {
		// In OpenClaw, this sends a pending interactive message to Telegram/Discord
		console.warn(
			`⚠️ ACTION REQUIRED: Approve execution of ${toolCall.name}?`,
		);
		return true;
	}
}
