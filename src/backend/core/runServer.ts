import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";

import { fileURLToPath } from "url";
import { dirname, join } from "path";

export async function runServer({ host, port, mode }: any) {
	const app = express();
	const server = createServer(app);

	const io = new Server(server); // Attach Socket.IO to the HTTP server

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	app.use("/", express.static(join(__dirname, "../../../public"))); // 'public' is folder name
	app.use("/", express.static(join(__dirname, "../../../dist"))); // 'public' is folder name

	app.get("/hello", (_, res) => {
		res.send("Hello Vite + React + TypeScript!");
	});

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
	});

	console.log(
		`=============\nServer is online at: http://${host}:${port}\n=============`,
	);

	server.listen(port, host, () => {});

	if (mode === "development") {
		ViteExpress.bind(app, server, () => {});
	}
}
