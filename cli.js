#!/usr/bin/env node

import 'tsx'
import meow from "meow";
import { dirname } from "path";

const cli = meow(
	`
Usage
	$ codetown [input]

Options
	--port  web-server-port  [Default: 8077]

Examples
	$ codetown
	$ codetown --port 8080 // custom port
`,
	{
		importMeta: import.meta,
		flags: {
			port: {
				type: "number",
				default: 8077,
			},
		},
	},
);

const currentFile = import.meta.url;
const currentFolder = dirname(currentFile);

import('./src/server/main.ts').then(({ runServer }) => {
	runServer(cli.flags.port || 8077, {
		mode: process.env.NODE_ENV === 'development' ? "development" : "production",
		currentFile,
		currentFolder
	});
})


// console.log(unicornFun());
