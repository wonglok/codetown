import { useEffect, useState } from "react";
import { getGenericSocket } from "../../client/clients/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
	const [socket, setSocket] = useState<boolean | Socket>(false);
	useEffect(() => {
		const socket = getGenericSocket({ namespace: `/claude` });

		socket.on("ready", () => {
			setSocket(socket);
		});

		socket.on("greet", (args) => {
			console.log(args);
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	return {
		socket,
	};
}

//

//

//

//
