import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";
import open from "open";
import { join } from "path";

export async function runServer({
	host,
	port,
	mode,
}: {
	//
	host: string;
	port: number;
	mode: "production" | "development";
}) {
	const app = express();
	const server = createServer(app);

	app.use(express.static(join(__dirname, "../../dist")));

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

	server.listen(port, host, () => {});

	ViteExpress.config({
		mode: mode || "production",
	});
	ViteExpress.bind(app, server, () => {
		open(`http://${host}:${port}`);
	});
}
