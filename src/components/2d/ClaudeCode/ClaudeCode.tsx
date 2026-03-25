import type { Socket } from "socket.io-client";
import { useSocket } from "../../hook/useSocket";
import { useClaude } from "./useClaude";

export function ClaudeCode() {
	const socket = useClaude((r) => r.socket) as Socket;
	return (
		<>
			<button
				className="p-3 bg-gray-200"
				onClick={() => {
					//
					socket.emit("ai-tool", { abc: 123 });
					console.log(123);
				}}
			>
				Run
			</button>
			{/*  */}
			{/*  */}
			{/*  */}
		</>
	);
}
