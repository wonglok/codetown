import React, { useState, useEffect, useCallback } from "react";
import { LMStudioClient } from "@lmstudio/sdk";

// --- Types ---

type ModelType = "llm" | "embedding" | "vlm";
type ModelStatus = "not-downloaded" | "downloaded" | "loading" | "loaded";

interface ModelInfo {
	id: string;
	key: string;
	displayName: string;
	type: ModelType;
	architecture: string;
	format: string;
	sizeBytes: number;
	paramsString?: string;
	status: ModelStatus;
	progress?: number; // For loading progress simulation
	instanceId?: string;
	vision?: boolean;
	trainedForToolUse?: boolean;
}

// --- Helper Functions ---

const formatBytes = (bytes: number): string => {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const getTypeIcon = (type: ModelType, vision?: boolean): string => {
	if (vision) return "🖼️";
	switch (type) {
		case "llm":
			return "💬";
		case "embedding":
			return "📊";
		case "vlm":
			return "👁️";
		default:
			return "🤖";
	}
};

const getTypeLabel = (type: ModelType): string => {
	switch (type) {
		case "llm":
			return "Chat Model";
		case "embedding":
			return "Embedding";
		case "vlm":
			return "Vision Model";
		default:
			return type;
	}
};

// --- Components ---

const CircularStatusIndicator = ({
	status,
	progress = 0,
	size = 56,
}: {
	status: ModelStatus;
	progress?: number;
	size?: number;
}) => {
	const strokeWidth = 4;
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (progress / 100) * circumference;

	const getIcon = () => {
		switch (status) {
			case "not-downloaded":
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
				return null;
		}
	};

	const getStrokeColor = () => {
		switch (status) {
			case "not-downloaded":
				return "text-gray-300";
			case "downloaded":
				return "text-emerald-500";
			case "loading":
				return "text-amber-500";
			case "loaded":
				return "text-green-500";
			default:
				return "text-gray-300";
		}
	};

	return (
		<div
			className="relative flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg className="transform -rotate-90 w-full h-full">
				{/* Background circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
					fill="transparent"
					className="text-gray-200"
				/>
				{/* Progress/Status circle */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke="currentColor"
					strokeWidth={strokeWidth}
					fill="transparent"
					strokeDasharray={circumference}
					strokeDashoffset={status === "loading" ? offset : 0}
					strokeLinecap="round"
					className={`transition-all duration-500 ease-out ${getStrokeColor()}`}
				/>
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
	onLoad,
	onUnload,
	isProcessing,
}: {
	model: ModelInfo;
	onLoad: (key: string) => void;
	onUnload: (key: string) => void;
	isProcessing: boolean;
}) => {
	const getStatusText = () => {
		switch (model.status) {
			case "not-downloaded":
				return "Not Downloaded";
			case "downloaded":
				return "On Disk";
			case "loading":
				return `Loading... ${model.progress}%`;
			case "loaded":
				return "Active in RAM";
			default:
				return "Unknown";
		}
	};

	const getStatusColor = () => {
		switch (model.status) {
			case "not-downloaded":
				return "text-gray-500";
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

	const handleAction = () => {
		if (model.status === "downloaded") {
			onLoad(model.key);
		} else if (model.status === "loaded") {
			onUnload(model.key);
		}
	};

	return (
		<div
			className={`group relative bg-white rounded-2xl border p-6 transition-all duration-300 ease-out transform hover:-translate-y-1 hover:shadow-xl ${
				model.status === "loaded"
					? "border-green-400 shadow-green-100"
					: model.status === "loading"
						? "border-amber-300 shadow-amber-50"
						: "border-gray-200 hover:border-blue-300"
			}`}
		>
			{/* Glow effect for loaded models */}
			{model.status === "loaded" && (
				<div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
			)}

			<div className="relative flex items-start justify-between">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-2">
						<span
							className="text-2xl"
							role="img"
							aria-label={model.type}
						>
							{getTypeIcon(model.type, model.vision)}
						</span>
						<span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
							{getTypeLabel(model.type)}
						</span>
						{model.trainedForToolUse && (
							<span
								className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
								title="Trained for tool use"
							>
								🛠️ Tools
							</span>
						)}
					</div>

					<h3
						className="text-lg font-bold text-gray-900 mb-1 font-mono tracking-tight truncate"
						title={model.key}
					>
						{model.displayName || model.key}
					</h3>

					<p className="text-xs text-gray-500 mb-3 font-mono truncate">
						{model.key}
					</p>

					<div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
						<span
							className="flex items-center gap-1"
							title="Model size"
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
									d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
								/>
							</svg>
							{formatBytes(model.sizeBytes)}
						</span>
						{model.paramsString && (
							<span
								className="flex items-center gap-1"
								title="Parameters"
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
										d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
									/>
								</svg>
								{model.paramsString}
							</span>
						)}
						<span
							className="flex items-center gap-1"
							title="Format"
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
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							{model.format?.toUpperCase()}
						</span>
					</div>

					<div className="flex items-center gap-2">
						<span
							className={`text-sm font-semibold ${getStatusColor()}`}
						>
							{getStatusText()}
						</span>
						{model.status === "loading" && (
							<span className="flex h-2 w-2 relative">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
							</span>
						)}
						{model.status === "loaded" && (
							<span className="flex h-2 w-2 relative">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
							</span>
						)}
					</div>
				</div>

				<div className="flex flex-col items-center gap-3 ml-4">
					<CircularStatusIndicator
						status={model.status}
						progress={model.progress}
						size={56}
					/>

					{/* Action buttons */}
					<div className="flex flex-col gap-2 w-32">
						{model.status === "downloaded" && (
							<button
								onClick={handleAction}
								disabled={isProcessing}
								className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transform disabled:transform-none"
							>
								{isProcessing ? (
									<svg
										className="animate-spin h-4 w-4"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
											fill="none"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								) : (
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
								)}
								Load
							</button>
						)}

						{model.status === "loaded" && (
							<button
								onClick={handleAction}
								disabled={isProcessing}
								className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 transform disabled:transform-none"
							>
								{isProcessing ? (
									<svg
										className="animate-spin h-4 w-4"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
											fill="none"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
								) : (
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
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								)}
								Unload
							</button>
						)}

						{model.status === "not-downloaded" && (
							<button
								disabled
								className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
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
								Get Model
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Progress bar for loading */}
			{model.status === "loading" && (
				<div className="mt-4">
					<div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full rounded-full bg-amber-500 transition-all duration-300 ease-out"
							style={{ width: `${model.progress}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

const Header = ({
	connectionStatus,
}: {
	connectionStatus: "connecting" | "connected" | "error";
}) => (
	<header className="mb-8">
		<div className="flex items-center justify-between">
			<div className="flex items-center gap-3">
				<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
					<svg
						className="w-7 h-7 text-white"
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
				<div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
						LMStudio Model Manager
					</h1>
					<p className="text-gray-600 text-sm mt-1">
						Real-time model status monitoring via SDK
					</p>
				</div>
			</div>

			<div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border shadow-sm">
				<div
					className={`w-2.5 h-2.5 rounded-full ${
						connectionStatus === "connected"
							? "bg-green-500 animate-pulse"
							: connectionStatus === "connecting"
								? "bg-amber-500 animate-pulse"
								: "bg-red-500"
					}`}
				/>
				<span
					className={`text-sm font-medium ${
						connectionStatus === "connected"
							? "text-green-700"
							: connectionStatus === "connecting"
								? "text-amber-700"
								: "text-red-700"
					}`}
				>
					{connectionStatus === "connected"
						? "Connected"
						: connectionStatus === "connecting"
							? "Connecting..."
							: "Connection Error"}
				</span>
			</div>
		</div>
	</header>
);

const StatsBar = ({ models }: { models: ModelInfo[] }) => {
	const loaded = models.filter((m) => m.status === "loaded").length;
	const loading = models.filter((m) => m.status === "loading").length;
	const downloaded = models.filter((m) => m.status === "downloaded").length;
	const total = models.length;

	return (
		<div className="grid grid-cols-4 gap-4 mb-8">
			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
				<div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl">
					📦
				</div>
				<div>
					<p className="text-2xl font-bold text-gray-900">{total}</p>
					<p className="text-sm text-gray-500">Total Models</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
				<div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-xl">
					💾
				</div>
				<div>
					<p className="text-2xl font-bold text-gray-900">
						{downloaded}
					</p>
					<p className="text-sm text-gray-500">On Disk</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
				<div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-xl">
					⏳
				</div>
				<div>
					<p className="text-2xl font-bold text-gray-900">
						{loading}
					</p>
					<p className="text-sm text-gray-500">Loading</p>
				</div>
			</div>

			<div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
				<div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-xl">
					⚡
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

export function LMStudioModelManagerTwo() {
	const [client, setClient] = useState<LMStudioClient | null>(null);
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "error"
	>("connecting");
	const [processingModels, setProcessingModels] = useState<Set<string>>(
		new Set(),
	);
	const [error, setError] = useState<string | null>(null);

	// Initialize LMStudio client
	useEffect(() => {
		const initClient = async () => {
			try {
				const lmClient = new LMStudioClient({
					baseUrl: "ws://localhost:1234",
				});
				setClient(lmClient);
				setConnectionStatus("connected");
			} catch (err) {
				console.error("Failed to initialize LMStudio client:", err);
				setConnectionStatus("error");
				setError(
					"Failed to connect to LMStudio. Make sure LMStudio is running.",
				);
			}
		};
		initClient();
	}, []);

	// Fetch models status
	const fetchModels = useCallback(async () => {
		if (!client) return;

		try {
			// Get downloaded models from system
			const localModels = await client.system.listDownloadedModels();

			// Get loaded LLMs
			const loadedLlms = await client.llm.listLoaded();
			const loadedLlmKeys = new Set(loadedLlms.map((m) => m.identifier));

			// Get loaded Embedding models
			const loadedEmbeddings = await client.embedding.listLoaded();
			const loadedEmbeddingKeys = new Set(
				loadedEmbeddings.map((m) => m.identifier),
			);

			// Combine and map to our ModelInfo format
			const modelInfos: ModelInfo[] = localModels.map(
				(localModel: any) => {
					const isLlm = localModel.type === "llm";
					const isEmbedding = localModel.type === "embedding";

					let status: ModelStatus = "downloaded";
					let instanceId: string | undefined;

					// Check if loaded
					if (isLlm && loadedLlmKeys.has(localModel.modelKey)) {
						status = "loaded";
						const loaded = loadedLlms.find(
							(m) => m.identifier === localModel.modelKey,
						);
						instanceId = loaded?.instanceReference;
					} else if (
						isEmbedding &&
						loadedEmbeddingKeys.has(localModel.modelKey)
					) {
						status = "loaded";
						const loaded = loadedEmbeddings.find(
							(m) => m.identifier === localModel.modelKey,
						);
						instanceId = loaded?.instanceReference;
					}

					return {
						id: localModel.modelKey,
						key: localModel.modelKey,
						displayName: localModel.displayName,
						type: localModel.type,
						architecture: localModel.architecture,
						format: localModel.format,
						sizeBytes: localModel.sizeBytes,
						paramsString: localModel.paramsString,
						status: status,
						vision: localModel.vision,
						trainedForToolUse: localModel.trainedForToolUse,
						instanceId,
					};
				},
			);

			// Sort: loaded first, then loading, then downloaded
			modelInfos.sort((a, b) => {
				const order = {
					loaded: 0,
					loading: 1,
					downloaded: 2,
					"not-downloaded": 3,
				};
				return order[a.status] - order[b.status];
			});

			setModels(modelInfos);
			setError(null);
		} catch (err) {
			console.error("Error fetching models:", err);
			setConnectionStatus("error");
			setError("Failed to fetch models from LMStudio");
		} finally {
			setLoading(false);
		}
	}, [client]);

	// Poll for updates
	useEffect(() => {
		if (!client) return;

		fetchModels();
		const interval = setInterval(fetchModels, 3000); // Poll every 3 seconds

		return () => clearInterval(interval);
	}, [client, fetchModels]);

	const handleLoad = async (modelKey: string) => {
		if (!client) return;

		setProcessingModels((prev) => new Set(prev).add(modelKey));

		// Optimistic update with loading state
		setModels((prev) =>
			prev.map((m) =>
				m.key === modelKey
					? { ...m, status: "loading", progress: 0 }
					: m,
			),
		);

		try {
			// Simulate progress updates
			const progressInterval = setInterval(() => {
				setModels((prev) =>
					prev.map((m) =>
						m.key === modelKey && m.status === "loading"
							? {
									...m,
									progress: Math.min(
										(m.progress || 0) + 10,
										90,
									),
								}
							: m,
					),
				);
			}, 200);

			// Load the model using SDK
			if (modelKey.includes("embedding")) {
				await client.embedding.model(modelKey);
			} else {
				await client.llm.model(modelKey);
			}

			clearInterval(progressInterval);

			// Set to loaded
			setModels((prev) =>
				prev.map((m) =>
					m.key === modelKey
						? { ...m, status: "loaded", progress: 100 }
						: m,
				),
			);

			// Refresh to get accurate state
			setTimeout(fetchModels, 500);
		} catch (err) {
			console.error("Failed to load model:", err);
			setModels((prev) =>
				prev.map((m) =>
					m.key === modelKey
						? { ...m, status: "downloaded", progress: undefined }
						: m,
				),
			);
			setError(`Failed to load model ${modelKey}`);
		} finally {
			setProcessingModels((prev) => {
				const next = new Set(prev);
				next.delete(modelKey);
				return next;
			});
		}
	};

	const handleUnload = async (modelKey: string) => {
		if (!client) return;

		setProcessingModels((prev) => new Set(prev).add(modelKey));

		try {
			// Find the model instance and unload it
			const model = models.find((m) => m.key === modelKey);
			if (model?.instanceId) {
				// Get the loaded model handle and unload it
				if (model.type === "embedding") {
					const loadedModels = await client.embedding.listLoaded();
					const target = loadedModels.find(
						(m) => m.instanceReference === model.instanceId,
					);
					if (target) await target.unload();
				} else {
					const loadedModels = await client.llm.listLoaded();
					const target = loadedModels.find(
						(m) => m.instanceReference === model.instanceId,
					);
					if (target) await target.unload();
				}
			}

			setModels((prev) =>
				prev.map((m) =>
					m.key === modelKey
						? {
								...m,
								status: "downloaded",
								progress: undefined,
								instanceId: undefined,
							}
						: m,
				),
			);

			setTimeout(fetchModels, 500);
		} catch (err) {
			console.error("Failed to unload model:", err);
			setError(`Failed to unload model ${modelKey}`);
		} finally {
			setProcessingModels((prev) => {
				const next = new Set(prev);
				next.delete(modelKey);
				return next;
			});
		}
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
			<div className="max-w-5xl mx-auto">
				<Header connectionStatus={connectionStatus} />
				<StatsBar models={models} />

				{error && (
					<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2 animate-fade-in">
						<svg
							className="w-5 h-5 flex-shrink-0"
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
						<span>{error}</span>
						<button
							onClick={() => setError(null)}
							className="ml-auto text-red-800 hover:text-red-900"
						>
							✕
						</button>
					</div>
				)}

				<div className="space-y-4">
					{models.map((model, index) => (
						<div
							key={model.id}
							className="animate-fade-in"
							style={{
								animationDelay: `${index * 50}ms`,
								animationFillMode: "both",
							}}
						>
							<ModelCard
								model={model}
								onLoad={handleLoad}
								onUnload={handleUnload}
								isProcessing={processingModels.has(model.key)}
							/>
						</div>
					))}
				</div>

				{models.length === 0 && !loading && (
					<div className="text-center py-12 text-gray-500">
						<div className="text-4xl mb-4">📭</div>
						<p className="text-lg font-medium">No models found</p>
						<p className="text-sm">
							Download models in LMStudio to see them here
						</p>
					</div>
				)}

				<div className="mt-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
					<span>Connected via @lmstudio/sdk</span>
					<span>•</span>
					<span>Auto-refreshing every 3s</span>
				</div>
			</div>

			<style jsx global>{`
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
					animation: fade-in 0.4s ease-out;
				}
			`}</style>
		</div>
	);
}
