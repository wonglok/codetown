import { useEffect, useState } from "react";
import { getGenericSocket } from "../clients/socket";
import type { Socket } from "socket.io-client";

export function useChatSocket() {
	const [state, setState] = useState("connecting");
	const [socket, setSocket] = useState<boolean | Socket>(false);
	useEffect(() => {
		const socket = getGenericSocket({ namespace: `/chat` });
		setSocket(socket);

		socket.on("connection", () => {
			setState("ready");
		});

		socket.on("greet", (args) => {
			console.log(args);
		});

		socket.emit("greet", "yoyo");

		return () => {
			socket.disconnect();
		};
	}, []);

	return {
		state,
		socket,
	};
}
