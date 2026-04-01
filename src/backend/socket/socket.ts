import { exec } from "child_process";
import type { Socket, Server } from "socket.io";
// import { runDemoLoop } from "../lab/learn-loop-openai";

// console.log(process.pid);

export const setupSocket = ({ io }: { io: Server }) => {
	// runDemoLoop();

	io.of("/code").on("connection", (socket) => {
		//

		console.log("a web client connected", socket.id);

		socket.on("greet", (arg) => {
			console.log(arg);
		});
		socket.emit("greet", { hello: socket.id });

		socket.on("disconnect", (reason) => {
			console.log(`Socket disconnected: ${reason}`);
		});

		socket.on("ai-tool", async (rootEvent) => {
			console.log(rootEvent);

			//
			//
			//
		});
	});
};
