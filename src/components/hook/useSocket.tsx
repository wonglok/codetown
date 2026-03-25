import { useEffect, useState } from "react";
import { getGenericSocket } from "../../client/clients/socket";
import type { Socket } from "socket.io-client";

export function useSocket() {
	const [status, setStatus] = useState("connecting");
	const [socket, setSocket] = useState<boolean | Socket>(false);
	useEffect(() => {
		const socket = getGenericSocket({ namespace: `/claude` });

		setSocket(socket);

		socket.on("ready", () => {
			setStatus("ready");
		});

		socket.on("greet", (args) => {
			console.log(args);
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	return {
		status,
		socket,
	};
}
