#!/usr/bin/env node

// import 'tsx'
import meow from "meow";
import express from "express";
import ViteExpress from "vite-express";
import { createServer } from "http";
import { Server } from "socket.io";


import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


const cli = meow(`
Usage
	$ codetown [input]

Options
	--port  web port  [Default: 8077]
	--host  host  [Default: localhost]

Examples
	$ codetown
	$ codetown --port 8080 // custom port
	$ codetown --host 0.0.0.0 --port 8080 // custom host to local share and use port 8080
`,
	{
		importMeta: import.meta,
		flags: {
			port: {
				type: "string",
				default: "8077",
			},
			host: {
				type: "string",
				default: "localhost",
			},
		},
	},
);

async function runServer({
	host,
	port,
	mode
}) {
	const app = express();
	const server = createServer(app);

	const io = new Server(server); // Attach Socket.IO to the HTTP server

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	app.use('/', express.static(join(__dirname, 'public'))); // 'public' is folder name
	app.use('/', express.static(join(__dirname, 'dist'))); // 'public' is folder name

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

	console.log(`=============\nServer is online at: http://${host}:${port}\n=============`);

	server.listen(port, host, () => { });

	if (mode === 'development') {
		ViteExpress.bind(app, server, () => {
		});
	}
}

runServer({
	port: `${cli.flags.port || 8077}`,
	host: `${cli.flags.host || 'localhost'}`,
	mode: process.env.NODE_ENV === 'development' ? "development" : "production",
});


//