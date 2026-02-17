import { io } from "socket.io-client";

export const getChatSocket = () =>
	io("/chat", {
		transports: ["websocket"],
	});
