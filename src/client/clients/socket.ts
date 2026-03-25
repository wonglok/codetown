import { io } from "socket.io-client";

export const getGenericSocket = ({ namespace = "/chat" }) => {
	return io(namespace, {
		transports: ["websocket", "polling"],
	});
};

export const getChatSocket = () =>
	io("/chat", {
		transports: ["websocket"],
	});
