import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "node:child_process";
import { JSONFilePreset } from "lowdb/node";
import { getSettingsRouter } from "../router/settings";

export async function runServer({ host, port, mode }: any) {
	const app = express();
	const server = createServer(app);

	const io = new Server(server); // Attach Socket.IO to the HTTP server

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	const currentWorkingDir = process.cwd();

	const actors = await JSONFilePreset(
		join(currentWorkingDir, ".codetown", "ai-calls.json"),
		{ items: [] },
	);

	// app.use("/", express.static(join(__dirname, "../../../public"))); // 'public' is folder name

	const settings = await getSettingsRouter();

	app.use("/settings", settings.router);

	if (mode === "production") {
		app.use("/", express.static(join(__dirname, "../../../dist"))); // 'public' is folder name
	}

	io.on("connection", (socket) => {
		console.log("a web client connected", socket.id);

		socket.on("greet", (arg) => {
			console.log(arg);
		});
		socket.emit("greet", { hello: socket.id });

		socket.on("disconnect", (reason) => {
			console.log(`Socket disconnected: ${reason}`);
		});
		//
		//
		//
		//

		//
		//
		//
		socket.on("ai-tool", (rootEvent) => {
			//
			const child = spawn("npx", [rootEvent.tool, rootEvent.prompt]);

			// Listen for stdout data events
			child.stdout.on("data", (data) => {
				console.log(`stdout: ${data.toString()}`);

				socket.emit("ai-tool-data", {
					session: rootEvent.sessionID,
					text: data.toString(),
				});
			});

			// Listen for stderr data events
			child.stderr.on("data", (data) => {
				console.error(`stderr: ${data.toString()}`);

				socket.emit("ai-tool-error", {
					session: rootEvent.sessionID,
					text: data.toString(),
				});
			});

			// Listen for the process closing event
			child.on("close", (code) => {
				console.log(`child process exited with code ${code}`);

				socket.emit("ai-tool-close", {
					session: rootEvent.sessionID,
					text: `${code}`,
				});
			});

			// Listen for the process error event (e.g., if the command is not found)
			child.on("error", (err) => {
				console.error("Failed to start child process:", err);
			});

			//
		});
		//
	});

	console.log(
		`=============\nServer is online at: http://${host}:${port}\n=============`,
	);

	server.listen(port, host, () => {});

	if (mode === "development") {
		ViteExpress.config({
			mode: "development",
		});
		ViteExpress.bind(app, server, () => {
			console.log("running vite now");
		});
	}
}
