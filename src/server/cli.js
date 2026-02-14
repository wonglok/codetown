#!/usr/bin/env node

import 'tsx'
import meow from "meow";
import { dirname } from "path";

const cli = meow(
	`
Usage
	$ codetown [input]

Options
	--port  web port  [Default: 8077]
	--host  host  [Default: 127.0.0.1]

Examples
	$ codetown
	$ codetown --port 8080 // custom port
	$ codetown --host 0.0.0.0 --port 8080 // custom host to local share and use port 8080
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

// @ts-ignore
import('./main.ts').then(({ runServer }) => {
	runServer({
		port: cli.flags.port || 8077,
		host: `${cli.flags.host || '127.0.0.1'}`,
		mode: process.env.NODE_ENV === 'development' ? "development" : "production",
		currentFile,
		currentFolder
	});
})


//