#!/usr/bin/env node

import 'tsx'
import meow from "meow";

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


import('./src/backend/core/runServer').then(({ runServer }) => {
	runServer({
		port: `${cli.flags.port || 8077}`,
		host: `${cli.flags.host || 'localhost'}`,
		mode: process.env.NODE_ENV === 'development' ? "development" : "production",
	});
})

//

//

//