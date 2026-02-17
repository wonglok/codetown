import { io } from "socket.io-client";

export const getGenericSocket = ({ namespace = "/chat" }) => {
	return io(namespace, {
		transports: ["websocket"],
	});
};

export const getChatSocket = () =>
	io("/chat", {
		transports: ["websocket"],
	});
