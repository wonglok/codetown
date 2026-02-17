import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { CorePaths } from "./workpath";
import { mkdir } from "fs/promises";

// import { spawn } from "node:child_process";
// import { JSONFilePreset } from "lowdb/node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runServer({ host, port, mode }: any) {
	const app = express();
	const server = createServer(app);

	const io = new Server(server); // Attach Socket.IO to the HTTP server

	await Promise.all(
		Object.values(CorePaths).map((pth) => {
			return mkdir(dirname(pth), { recursive: true });
		}),
	);

	const { getToolsRouter } = await import("../router/tools");

	const tools = await getToolsRouter();

	app.use("/api/tools", tools.router);

	if (mode === "production") {
		app.use("/", express.static(join(__dirname, "../../../dist"))); // 'public' is folder name
	}

	io.of("/chat").on("connection", (socket) => {
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
	});

	if (mode === "development") {
		ViteExpress.config({
			mode: "development",
		});
		ViteExpress.bind(app, server, () => {
			console.log(
				`=============\nVite is online at: http://${host}:${port}\n=============`,
			);
		});
	} else {
		console.log(
			`=============\nServer is online at: http://${host}:${port}\n=============`,
		);
	}

	server.listen(port, host, () => {});
}

//
//
//
