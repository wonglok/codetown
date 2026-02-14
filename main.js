import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";

export async function runServer({
	host,
	port,
	mode
}) {
	const app = express();
	const server = createServer(app);

	app.use(express.static('./dist'));

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

	server.listen(port, host, () => { });

	if (mode === "development") {
		ViteExpress.config({
			mode: "development",
		});
		ViteExpress.bind(app, server, () => { });
	}
}

