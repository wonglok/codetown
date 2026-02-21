import React, { useState, useEffect, useCallback } from "react";

// --- Types ---

interface Model {
	id: string;
	name: string;
	type: "chat-model" | "util-model" | "image-embedding" | string;
	status: "idle" | "downloading" | "downloaded" | "loading" | "loaded";
	progress?: number; // 0-100
	size?: string;
}

// --- Mock API Service ---

const mockFetchModels = async (): Promise<Model[]> => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([
				{
					id: "1",
					name: "nvidia/nemotron-3-nano",
					type: "chat-model",
					status: "loaded",
					size: "4GB",
				},
				{
					id: "2",
					name: "openai/gpt-oss-20b",
					type: "util-model",
					status: "downloading",
					progress: 45,
					size: "12GB",
				},
				{
					id: "3",
					name: "qwen/qwen3-vl-embedding-2b",
					type: "image-embedding",
					status: "downloaded",
					size: "2GB",
				},
				{
					id: "4",
					name: "meta/llama-3-8b",
					type: "chat-model",
					status: "loading",
					progress: 80,
					size: "5GB",
				},
				{
					id: "5",
					name: "mistral/mistral-7b",
					type: "chat-model",
					status: "idle",
					size: "4.5GB",
				},
			]);
		}, 800);
	});
};

const mockDownloadModel = async (modelId: string): Promise<void> => {
	console.log(`Downloading model ${modelId}...`);
	return new Promise((resolve) => setTimeout(resolve, 1000));
};

const mockLoadModel = async (modelId: string): Promise<void> => {
	console.log(`Loading model ${modelId} into RAM...`);
	return new Promise((resolve) => setTimeout(resolve, 1000));
};

// --- Components ---

const CircularProgress = ({
	progress,
	status,
	size = 48,
}: {
	progress: number;
	status: Model["status"];
	size?: number;
}) => {
	const strokeWidth = 4;
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (progress / 100) * circumference;

	const getIcon = () => {
		switch (status) {
			case "downloading":
				return (
					<svg
						className="w-5 h-5 text-blue-500 animate-bounce"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8"
						/>
					</svg>
				);
			case "downloaded":
				return (
					<svg
						className="w-5 h-5 text-emerald-500"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
						/>
					</svg>
				);
			case "loading":
				return (
					<svg
						className="w-5 h-5 text-amber-500 animate-spin"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
				);
			case "loaded":
				return (
					<svg
						className="w-5 h-5 text-green-600"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={3}
							d="M5 13l4 4L19 7"
						/>
					</svg>
				);
			default:
				return (
					<svg
						className="w-5 h-5 text-gray-400"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13 10V3L4 14h7v7l9-11h-7z"
						/>
					</svg>
				);
		}
	};

	return (
		<div
			className="relative flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			{/* Background circle */}
			<svg className="transform -rotate-90 w-full h-full">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
					fill="transparent"
					className="text-gray-200"
				/>
				{/* Progress circle */}
				{(status === "downloading" || status === "loading") && (
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="currentColor"
						strokeWidth={strokeWidth}
						fill="transparent"
						strokeDasharray={circumference}
						strokeDashoffset={offset}
						strokeLinecap="round"
						className={`transition-all duration-500 ease-out ${
							status === "downloading"
								? "text-blue-500"
								: "text-amber-500"
						}`}
					/>
				)}
				{/* Completed circle for downloaded/loaded states */}
				{(status === "downloaded" || status === "loaded") && (
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke="currentColor"
						strokeWidth={strokeWidth}
						fill="transparent"
						className={`${
							status === "loaded"
								? "text-green-500"
								: "text-emerald-500"
						}`}
					/>
				)}
			</svg>
			{/* Center icon */}
			<div className="absolute inset-0 flex items-center justify-center">
				{getIcon()}
			</div>
		</div>
	);
};

const ModelCard = ({
	model,
	onDownload,
	onLoad,
}: {
	model: Model;
	onDownload: (id: string) => void;
	onLoad: (id: string) => void;
}) => {
	const getStatusText = () => {
		switch (model.status) {
			case "downloading":
				return `Downloading... ${model.progress}%`;
			case "downloaded":
				return "On Disk";
			case "loading":
				return `Loading to RAM... ${model.progress}%`;
			case "loaded":
				return "Active in RAM";
			default:
				return "Available";
		}
	};

	const getStatusColor = () => {
		switch (model.status) {
			case "downloading":
				return "text-blue-600";
			case "downloaded":
				return "text-emerald-600";
			case "loading":
				return "text-amber-600";
			case "loaded":
				return "text-green-700";
			default:
				return "text-gray-500";
		}
	};

	const getTypeIcon = (type: string) => {
		switch (type) {
			case "chat-model":
				return "💬";
			case "util-model":
				return "🛠️";
			case "image-embedding":
				return "🖼️";
			default:
				return "🤖";
		}
	};

	return (
		<div className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 ease-out transform hover:-translate-y-1">
			{/* Glow effect for loaded models */}
			{model.status === "loaded" && (
				<div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
			)}

			<div className="relative flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						<span className="text-2xl">
							{getTypeIcon(model.type)}
						</span>
						<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
							{model.type}
						</span>
					</div>

					<h3 className="text-lg font-bold text-gray-900 mb-1 font-mono tracking-tight">
						{model.name}
					</h3>

					{model.size && (
						<p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
							<svg
								className="w-4 h-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
								/>
							</svg>
							{model.size}
						</p>
					)}

					<div className="flex items-center gap-2">
						<span
							className={`text-sm font-semibold ${getStatusColor()}`}
						>
							{getStatusText()}
						</span>
					</div>
				</div>

				<div className="flex flex-col items-center gap-3 ml-4">
					<CircularProgress
						progress={model.progress || 0}
						status={model.status}
						size={56}
					/>

					{/* Action buttons */}
					<div className="flex flex-col gap-2 w-full">
						{model.status === "idle" && (
							<button
								onClick={() => onDownload(model.id)}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transform"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								Download
							</button>
						)}

						{model.status === "downloaded" && (
							<button
								onClick={() => onLoad(model.id)}
								className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transform"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 10V3L4 14h7v7l9-11h-7z"
									/>
								</svg>
								Load
							</button>
						)}

						{model.status === "loaded" && (
							<button
								disabled
								className="px-4 py-2 bg-green-100 text-green-700 text-sm font-medium rounded-lg cursor-default flex items-center justify-center gap-2"
							>
								<svg
									className="w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
								Active
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Progress bar for downloading/loading */}
			{(model.status === "downloading" || model.status === "loading") && (
				<div className="mt-4">
					<div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
						<div
							className={`h-full rounded-full transition-all duration-500 ease-out ${
								model.status === "downloading"
									? "bg-blue-500"
									: "bg-amber-500"
							}`}
							style={{ width: `${model.progress}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

const Header = () => (
	<header className="mb-8">
		<div className="flex items-center gap-3 mb-2">
			<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
				<svg
					className="w-6 h-6 text-white"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			</div>
			<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
				LMStudio Model Manager
			</h1>
		</div>
		<p className="text-gray-600 ml-13 pl-13">
			Monitor and manage your AI models across storage and memory
		</p>
	</header>
);

const StatsBar = ({ models }: { models: Model[] }) => {
	const loaded = models.filter((m) => m.status === "loaded").length;
	const downloading = models.filter((m) => m.status === "downloading").length;
	const total = models.length;

	return (
		<div className="grid grid-cols-3 gap-4 mb-8">
			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
				<div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
					<span className="text-xl">📦</span>
				</div>
				<div>
					<p className="text-2xl font-bold text-gray-900">{total}</p>
					<p className="text-sm text-gray-500">Total Models</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
				<div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
					<span className="text-xl">⬇️</span>
				</div>
				<div>
					<p className="text-2xl font-bold text-gray-900">
						{downloading}
					</p>
					<p className="text-sm text-gray-500">Downloading</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
				<div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
					<span className="text-xl">⚡</span>
				</div>
				<div>
					<p className="text-2xl font-bold text-gray-900">{loaded}</p>
					<p className="text-sm text-gray-500">Active in RAM</p>
				</div>
			</div>
		</div>
	);
};

// --- Main App Component ---

export function LMStudioModelManager() {
	const [models, setModels] = useState<Model[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchModels = useCallback(async () => {
		try {
			setLoading(true);
			const data = await mockFetchModels();
			setModels(data);
			setError(null);
		} catch (err) {
			setError("Failed to fetch models from LMStudio");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchModels();
		// Poll every 5 seconds
		const interval = setInterval(fetchModels, 5000);
		return () => clearInterval(interval);
	}, [fetchModels]);

	const handleDownload = async (modelId: string) => {
		await mockDownloadModel(modelId);
		// Optimistic update
		setModels((prev) =>
			prev.map((m) =>
				m.id === modelId
					? { ...m, status: "downloading", progress: 0 }
					: m,
			),
		);
	};

	const handleLoad = async (modelId: string) => {
		await mockLoadModel(modelId);
		// Optimistic update
		setModels((prev) =>
			prev.map((m) =>
				m.id === modelId ? { ...m, status: "loading", progress: 0 } : m,
			),
		);
	};

	if (loading && models.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
					<p className="text-gray-600 font-medium">
						Connecting to LMStudio...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="max-w-4xl mx-auto">
				<Header />
				<StatsBar models={models} />

				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
						<svg
							className="w-5 h-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						{error}
					</div>
				)}

				<div className="space-y-4">
					{models.map((model, index) => (
						<div
							key={model.id}
							className="animate-fade-in"
							style={{
								animationDelay: `${index * 100}ms`,
								animationFillMode: "both",
							}}
						>
							<ModelCard
								model={model}
								onDownload={handleDownload}
								onLoad={handleLoad}
							/>
						</div>
					))}
				</div>

				<div className="mt-8 text-center text-sm text-gray-400">
					Connected to LMStudio API • Auto-refreshing every 5s
				</div>
			</div>

			<style>{`
				@keyframes fade-in {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-fade-in {
					animation: fade-in 0.5s ease-out;
				}
			`}</style>
		</div>
	);
}
