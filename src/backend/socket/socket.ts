import { spawn } from "node:child_process";
import type { Socket, Server } from "socket.io";
import { runDemoLoop } from "../lab/learn-loop";

console.log(process.pid);

export const setupSocket = ({ io }: { io: Server }) => {
	//

	runDemoLoop();

	//

	io.of("/chat").on("connection", (socket) => {
		//

		console.log("a web client connected", socket.id);

		socket.on("greet", (arg) => {
			console.log(arg);
		});
		socket.emit("greet", { hello: socket.id });

		socket.on("disconnect", (reason) => {
			console.log(`Socket disconnected: ${reason}`);
		});

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
	});
};
