import { exec } from "child_process";
import OpenAI from "openai";
import { type ChatCompletionMessageParam } from "openai/resources/index.mjs";
// import { success, z } from 'zod'
import { scanFolder } from "./getSummary";
import { writeFile } from "fs/promises";
// import moment from 'moment'
// import { Stonebox } from '@plust/stonebox'
// import { execCommand } from './execCommand'

import { dirname, join } from "path";
import { makeDirectory } from "make-dir";
import { type EachBlock, InfoblockForamt, parseInfoblocks } from "./InfoBlocks";

export type CommandResult = {
	command: string;
	successful: boolean;
	result: string;
	timestamp: string;
};

export type OneStep = {
	// nextContextPrompt: EachBlock[]
	nextCheckup: EachBlock[];
	nextSteps: EachBlock[];
	codes: EachBlock[];
	logs: EachBlock[];
	stop: EachBlock[];

	commands: EachBlock[];
	commandResults: CommandResult[];
};

export async function writeCode({
	memory = [],
	plan,
	step,
	workspace,
	inbound,
	checkAborted,
	onEvent,
}: any) {
	//

	const openai = new OpenAI({
		baseURL: inbound.baseURL,
		apiKey: inbound.apiKey,
	});

	const prepareMessages = async (step: OneStep) => {
		const messages: ChatCompletionMessageParam[] = [];

		messages.push({
			role: "user",
			content: `
# System Prompt for the entire app:
${plan}

# Role Override:
You are a senior developer who writes code.

You are a AI Coder Agent with a loop. you work on coding tasks by looking the info of step before and defining the future step. 

Assume the context window is limtied to ${10000} Tokens, try to reduce unecessary tokens like code comments and make the thought concise yet accurate.  
Always treat the default current working directory as workspace or project folder
Never use emoji
`.trim(),
		});

		{
			messages.push({
				role: "user",
				content: `
# User original goal: (for reference, please refer to system prompt for execution plan)
${inbound.appUserPrompt}
        `,
			});
		}

		{
			messages.push({
				role: "user",
				content: `
# Instructions:
  - Must Verify the "Goal Verification Checklist", if goal is achieved, write a marker to end the process: (using  <infoblock type="goal-achieved">) 

  - Must understand what is going on by referencing to "What to do now" section, "What to check up now" section, "action logs" section, "terminal results" section and etc...
    - if there's "What to check up now" items
      -- if needed, do all the fixes
    - if there's "What to do now" section
      -- MUST USE <infoblock type="code"> to implement code but not using terminal
      -- if needed, schedule **10 or less** blocking terminal commands: (using  <infoblock type="terminal">), write 1 checkup list to verifty the terminal call execution is aligned with the plan: (using  <infoblock type="next-checkup">) 
      -- must write 1 next step for myself to read in the future: (using <infoblock type="next-step">) 
      -- must write 1 short action log for myself to read in the future:  (using <infoblock type="log">)
      -- If needed, write 1 context prompt for myself to read in the next step: (using <infoblock type="next-context-prompt">) 
  
${InfoblockForamt}
`,
			});
		}

		{
			// MUST WORK Within folder: "${workspace}/code"

			let files = await (await scanFolder(`${workspace}/code`)).trim();

			if (files) {
				messages.push({
					role: "user",
					content: `# File System Reference:
${files}
    `.trim(),
				});
			}
		}

		{
			let text = "# Command line results:\n";
			for (let one of step.commandResults) {
				let note = "";
				if (one.result.length >= 1000) {
					note = "[only first 1000 characters are loaded in result]";
				}
				let item = `
Time: ${one.timestamp || ""}
Command: ${one.command || ""} 
Result: ${one.successful ? `Successful` : `Failed`} ${note}
${one.result.slice(0, 1000) || ""} 
------
    `.trim();

				text += `${item}\n`;
			}

			if (text.trim()) {
				messages.push({
					role: "user",
					content: text,
				});
			}

			//
		}

		//     {
		//       let text = ''
		//       for (let one of step.nextContextPrompt) {
		//         let item = `
		// # Context Prompt for the current task:
		// ${one.content || ''}
		//     `.trim()

		//         text += `${item}\n`
		//       }

		//       if (text.trim()) {
		//         messages.push({
		//           role: 'user',
		//           content: text
		//         })
		//       }
		//     }

		{
			let text = "";
			for (let one of step.nextCheckup) {
				text = "# Step checkup list\n";
				let item = `
# What to check up now: 
${one.content || ""}
    `.trim();

				text += `${item}\n`;
			}

			if (text.trim()) {
				messages.push({
					role: "user",
					content: text,
				});
			}
		}

		{
			let text = "";
			if (step.nextSteps.length > 0) {
				text += "# Step checkup list\n";
			}
			for (let one of step.nextSteps) {
				let item = `
# What to do now in this step: 
${one.content || ""}
    `.trim();

				text += `${item}\n`;
			}

			if (text.trim()) {
				messages.push({
					role: "user",
					content: text,
				});
			}
		}

		{
			let text = "# Action Log\n";
			for (let one of memory) {
				// let date = new Date(one.timestamp)
				// let dateStr = moment(date).format('YYYY-MM-DD')
				// let timeStr = moment(date).format('HH-mm-ss-(A)')
				// let datestamp = `${dateStr}-${timeStr}`

				let item = `
LogID: ${one.idx} 
Action Log: ${one.content || ""}
------
    `.trim();

				text += `${item}\n`;
			}

			if (text.trim()) {
				messages.push({
					role: "user",
					content: text,
				});
			}
		}

		return messages;
	};

	let messages = await prepareMessages(step);

	if (messages instanceof Array) {
		onEvent({
			type: "messages",
			messages: messages,
		});
	}

	const controller = new AbortController();
	const signal = controller.signal;

	const intrv = setInterval(() => {
		if (!signal.aborted && checkAborted()) {
			clearInterval(intrv);
			controller.abort();
		}
	}, 1);

	const blocks: EachBlock[] = await openai.chat.completions
		.create(
			{
				model: inbound.model,
				messages: messages,
				// response_format: {
				//   type: 'json_schema',
				//   json_schema: {
				//     name: 'worktask',
				//     schema: WorkTask.toJSONSchema()
				//   }
				// },
				stream: true,
				stream_options: {
					include_usage: true,
				},
				reasoning_effort: "xhigh",
				temperature: 0.0,
			},
			{ signal },
		)
		.then(async (resp) => {
			let longContent = "";
			let thinking = "";
			let blocks = [];
			let counter = 0;
			let start = performance.now();
			for await (let event of resp) {
				let now = performance.now();
				counter++;

				let diff = counter / ((now - start) / 1000);
				console.log("tps", diff);

				let firstChoice = event?.choices[0];
				let delta = firstChoice?.delta as any;
				let reason = delta?.reasoning_content || "";
				let content = delta?.content || "";

				thinking += reason;
				longContent += content;

				onEvent({ type: "thinking", thinking: `${thinking}` });
				onEvent({ type: "stream", stream: `${longContent}` });
			}

			onEvent({ type: "thinking", thinking: `${thinking}` });
			onEvent({ type: "stream", stream: `${longContent}` });

			blocks = parseInfoblocks(`${longContent}`) || [];

			return blocks;
		})
		.catch((r) => {
			console.error(r);
			return null;
		});

	onEvent({
		type: "nProgressStart",
		nProgressStart: ``,
	});
	clearInterval(intrv);

	// console.log('blocks', blocks)

	// let nextContextPrompt = blocks.filter((r) => r.type === 'next-context-prompt')
	let nextSteps = blocks.filter((r) => r.type === "next-step");
	let nextCheckup = blocks.filter((r) => r.type === "next-checkup");
	let logs = blocks.filter((r) => r.type === "log");

	let codes = blocks.filter((r) => r.type === "code");
	let commands = blocks.filter((r) => r.type === "terminal");
	let stop = blocks.filter((r) => r.type === "goal-achieved");

	let output: OneStep = {
		nextCheckup: nextCheckup,
		nextSteps: nextSteps,
		codes: codes,
		commands: commands,
		stop: stop,
		logs: logs,
		// nextContextPrompt: nextContextPrompt,
		commandResults: [],
	};

	// console.log(JSON.stringify(output, null, '\t'))

	if (codes) {
		for await (let file of codes) {
			//
			let path = file.path;
			let content = file.content;

			if (path.includes(".lock")) {
				continue;
			}

			await makeDirectory(dirname(join(`${workspace}`, "code", path)));

			await writeFile(
				join(`${workspace}`, "code", path),
				content,
				"utf8",
			).catch((er) => {
				console.error(er);
			});
		}
	}

	if (commands) {
		for (let each of commands) {
			let commandPrefix = `cd ${JSON.stringify(join(`${workspace}`, "code"))};`;
			onEvent({
				type: "cmd_begin",
				cmd_begin: each.content,
			});

			console.log("call", each.content);

			let res: any = await new Promise(async (resolve) => {
				//
				return exec(
					`${commandPrefix} ${(each.content || "").trim()}`,
					{
						// cwd: `${workspace}/code`
					},
					(error, stdout, stderr) => {
						if (stderr) {
							console.error(`${stderr}`);
							return resolve({
								successful: false,
								result: `${stderr}`.replace(commandPrefix, ""),
							});
						}
						if (error) {
							console.log(error);
							return resolve({
								successful: false,
								result: `${error}`.replace(commandPrefix, ""),
							});
						}

						resolve({ successful: true, result: `${stdout}` });
					},
				);
			});

			console.log("result", res.result);

			onEvent({
				type: "cmd_end",
				cmd_end: each.content,
			});

			let commandResult: CommandResult = {
				command: each.content.replace(commandPrefix, ""),
				successful: res.successful,
				result: res.result.trim(),
				timestamp: new Date().toString(),
			};

			output.commandResults.push(commandResult);
		}
	}

	if (output.logs.length > 0) {
		memory.push({
			idx: memory.length,
			timestamp: new Date().toString(),
			content: output.logs.map((r) => r.content).join("\n"),
		});
	}

	onEvent({
		type: "nProgressEnd",
		nProgressEnd: ``,
	});

	return output;
}

//
