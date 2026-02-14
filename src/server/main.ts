import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";
import open from "open";

export async function runServer({
	host,
	port,
	mode,
	dist,
}: {
	//
	dist: string;
	host: string;
	port: string;
	mode: "production" | "development";
}) {
	const app = express();
	const server = createServer(app);

	app.use(express.static("../../dist"));

	const io = new Server(server); // Attach Socket.IO to the HTTP server

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
	});

	console.log(`Server is: http://${host}:${port}`);

	server.listen(port, host as any, () => {});

	if (mode === "production") {
		ViteExpress.config({
			mode: mode,
		});
		ViteExpress.bind(app, server, () => {
			open(`http://${host}:${port}`);
		});
	}
}
