import type { DefaultEventsMap, Socket } from "socket.io";
import { io } from "socket.io-client";
import { create } from "zustand";

export const useClaude = create<any>((set, get) => {
	const socket = io("/code", {
		transports: ["websocket", "polling"],
	});

	return {
		socket,
	};
});
