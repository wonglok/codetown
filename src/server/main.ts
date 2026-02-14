import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";
import open from "open";
import { join } from "path";

export async function runServer({
	host,
	port,
	currentFolder,
	currentFile,
	mode,
}: {
	//
	host: string;
	port: number;
	mode: "production" | "development";
	currentFile: string;
	currentFolder: string;
}) {
	//
	if (process.env.NODE_ENV === "development") {
		console.log("currentFolder", currentFolder);
		console.log("currentFile", currentFile);
	}

	ViteExpress.config({
		mode: mode || "production",
	});

	const app = express();

	app.use(express.static(join(process.cwd(), "./dist")));

	const server = createServer(app);

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

	ViteExpress.bind(app, server, () => {
		open(`http://${host}:${port}`);
	});
}
