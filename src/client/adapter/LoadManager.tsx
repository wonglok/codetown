import React, { useState, useEffect } from "react";

type ModelInfo = {
	name: string;
	type: "chat-model" | "util-model" | "image-embedding";
	status: "downloading" | "downloaded" | "loaded";
};

const LoadManager: React.FC<{ model: ModelInfo }> = ({ model }) => {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => (prev + 1) % 100);
		}, 100);
		return () => clearInterval(interval);
	}, []);

	const getIcon = () => {
		switch (model.status) {
			case "downloading":
				return "🌥️";
			case "downloaded":
				return "💾";
			case "loaded":
				return "✅";
			default:
				return "⏳";
		}
	};

	return (
		<div className="load-manager">
			<div className="loader-circle">
				<div
					className="loader-fill"
					style={{ transform: `rotate(${progress}deg)` }}
				/>
				<div className="loader-icon">{getIcon()}</div>
			</div>
			<div className="loader-info">
				<strong>{model.name}</strong> ({model.type})
			</div>
		</div>
	);
};

export default LoadManager;
