import "./App.css";

import { useEffect, useState } from "react";

import reactLogo from "./assets/react.svg";

import { getSocket } from "./socket/socket";
import { GamePage } from "../components/3d/World/GamePage";

function App() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const socket = getSocket();

		socket.on("greet", (args) => {
			console.log(args);
		});

		socket.emit("greet", "yo");

		return () => {
			socket.disconnect();
		};
	}, []);

	return (
		<div className="w-full h-full">
			<GamePage></GamePage>
		</div>
	);
}

export default App;
