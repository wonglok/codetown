import express from "express";
import ViteExpress from "vite-express";

const app = express();

app.get("/hello", (_, res) => {
	res.send("Hello Vite + React + TypeScript!");
});

export function runServer(
	port = 8077,
	{
		currentFolder,
		currentFile,
		mode,
	}: {
		//
		mode: "production" | "development";
		currentFile: string;
		currentFolder: string;
	},
) {
	//
	if (process.env.NODE_ENV === "development") {
		console.log("currentFolder", currentFolder);
		console.log("currentFile", currentFile);
	}

	ViteExpress.config({
		mode: mode || "production",
	});

	ViteExpress.listen(app, port, () =>
		console.log(`Server is listening on port http://0.0.0.0:${port}...`),
	);
}
