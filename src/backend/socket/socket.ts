import { spawn } from "node:child_process";
import type { Socket } from "socket.io";

export const setupSocket = ({ socket }: { socket: Socket }) => {
	// socket.on("ai-tool", (rootEvent) => {
	// 	//
	// 	const child = spawn("npx", [rootEvent.tool, rootEvent.prompt]);
	// 	// Listen for stdout data events
	// 	child.stdout.on("data", (data) => {
	// 		console.log(`stdout: ${data.toString()}`);
	// 		socket.emit("ai-tool-data", {
	// 			session: rootEvent.sessionID,
	// 			text: data.toString(),
	// 		});
	// 	});
	// 	// Listen for stderr data events
	// 	child.stderr.on("data", (data) => {
	// 		console.error(`stderr: ${data.toString()}`);
	// 		socket.emit("ai-tool-error", {
	// 			session: rootEvent.sessionID,
	// 			text: data.toString(),
	// 		});
	// 	});
	// 	// Listen for the process closing event
	// 	child.on("close", (code) => {
	// 		console.log(`child process exited with code ${code}`);
	// 		socket.emit("ai-tool-close", {
	// 			session: rootEvent.sessionID,
	// 			text: `${code}`,
	// 		});
	// 	});
	// 	// Listen for the process error event (e.g., if the command is not found)
	// 	child.on("error", (err) => {
	// 		console.error("Failed to start child process:", err);
	// 	});
	// 	//
	// });
};
