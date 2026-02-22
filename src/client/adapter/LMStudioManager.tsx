// LMStudioManager.tsx
import React, { useState, useEffect, useCallback } from "react";
import { LMStudioSDK, type ModelInfo, type ModelStatus } from "./LMStudioSDK";

interface LMStudioManagerProps {
	baseURL?: string;
	authToken?: string;
}

const DEFAULT_MODELS = [
	{
		id: "nvidia/nemotron-3-nano",
		desc: "Smart AI Model",
		name: "Nemotron 3 Nano",
		type: "Smart",
	},

	{
		id: "qwen.qwen3-vl-embedding-2b",
		desc: "Image AI Model",
		name: "Image Embedding",
		type: "Image Embedding",
	},
	{
		id: "text-embedding-nomic-embed-text-v1.5",
		desc: "Text AI Model",
		name: "Nomic Text Embedding",
		type: "Text Embedding",
	},

	// {
	// 	//
	// 	id: "openai/gpt-oss-20b",
	// 	desc: "Fast AI Model",
	// 	name: "GPT-OSS 20B",
	// 	type: "Fast",
	// },
];

const StatusBadge: React.FC<{ status: ModelStatus; progress?: number }> = ({
	status,
	progress,
}) => {
	const styles: Record<ModelStatus, React.CSSProperties> = {
		not_downloaded: {
			backgroundColor: "#fee2e2",
			color: "#991b1b",
			border: "1px solid #fecaca",
		},
		downloading: {
			backgroundColor: "#dbeafe",
			color: "#1e40af",
			border: "1px solid #bfdbfe",
		},
		downloaded: {
			backgroundColor: "#fef3c7",
			color: "#92400e",
			border: "1px solid #fde68a",
		},
		loading: {
			backgroundColor: "#e0e7ff",
			color: "#3730a3",
			border: "1px solid #c7d2fe",
		},
		loaded: {
			backgroundColor: "#d1fae5",
			color: "#065f46",
			border: "1px solid #a7f3d0",
		},
	};

	const labels: Record<ModelStatus, string> = {
		not_downloaded: "Not Downloaded",
		downloading: progress
			? `Downloading ${progress.toFixed(1)}%`
			: "Downloading",
		downloaded: "Not in RAM",
		loading: "Loading to RAM...",
		loaded: "Loaded & Ready",
	};

	return (
		<span
			style={{
				padding: "4px 12px",
				borderRadius: "9999px",
				fontSize: "0.875rem",
				fontWeight: 500,
				display: "inline-flex",
				alignItems: "center",
				gap: "6px",
				...styles[status],
			}}
		>
			{status === "downloading" && (
				<span
					style={{
						width: "12px",
						height: "12px",
						border: "2px solid currentColor",
						borderTopColor: "transparent",
						borderRadius: "50%",
						animation: "spin 1s linear infinite",
					}}
				/>
			)}
			{labels[status]}
		</span>
	);
};

export const LMStudioManager: React.FC<LMStudioManagerProps> = ({
	baseURL = "http://localhost:1234",
	authToken,
}) => {
	const [sdk] = useState(() => new LMStudioSDK(baseURL, authToken));
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [prepareStatus, setPrepareStatus] = useState("idle");
	const [error, setError] = useState<string | null>(null);

	// Fetch current status of all models
	const refreshStatus = useCallback(async () => {
		try {
			setModels([]);
			setError(null);
			const downloadedModels = await sdk.listModels();

			const updatedModels = await Promise.all(
				DEFAULT_MODELS.map(async (defaultModel) => {
					const theModel: any = downloadedModels.find(
						(r: any) =>
							r.key.toLowerCase() ===
							defaultModel.id.toLowerCase(),
					);

					if (!theModel) {
						return {
							id: theModel.key,
							status: "not_downloaded",
						};
					}

					let data = {
						id: theModel.key,
						...theModel,
					};

					if (theModel) {
						data.status = "downloaded";
					}

					if (theModel?.loaded_instances?.length >= 1) {
						data.status = "loaded";
					}

					return data;
				}),
			);

			setModels(updatedModels);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch status",
			);
		}
	}, [sdk]);

	useEffect(() => {
		refreshStatus();
	}, []);

	useEffect(() => {
		if (
			models.filter((r) => r.status === "loaded").length ===
			DEFAULT_MODELS.length
		) {
			setPrepareStatus("done");
		}
	}, [models.map((r) => r.status).join("_")]);

	// Poll for updates

	const handleDownload = async (modelId: string) => {
		try {
			await sdk.downloadModel(modelId);
			// Check if it's currently downloading
			try {
				const downloadJob: any = await sdk.downloadModel(modelId);

				const downloadStatus = await sdk.getDownloadStatus(
					downloadJob.job_id,
				);

				console.log(downloadStatus);
				// if (
				// 	downloadStatus.status === "downloading" ||
				// 	downloadStatus.status === "pending"
				// ) {
				// 	return {
				// 		id: defaultModel.id,
				// 		status: "downloading" as ModelStatus,
				// 		downloadProgress: downloadStatus.progress,
				// 	};
				// }
			} catch (e) {
				// Not downloading
			}

			refreshStatus();
		} catch (err) {
			setError(
				`Failed to download ${modelId}: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
		}
	};

	const handleLoad = async (modelId: string) => {
		try {
			setModels((prev) =>
				prev.map((m) =>
					m.id === modelId ? { ...m, status: "loading" } : m,
				),
			);
			await sdk.loadModel(modelId);
			refreshStatus();
		} catch (err) {
			setError(
				`Failed to load ${modelId}: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
			refreshStatus();
		}
	};

	const handleUnload = async (instanceID: string) => {
		try {
			await sdk.unloadModel(instanceID);
			refreshStatus();
		} catch (err) {
			setError(
				`Failed to unload ${instanceID}: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
		}
	};

	const handleDownloadAll = async () => {
		setPrepareStatus("preparing");
		try {
			for (const model of DEFAULT_MODELS) {
				const currentStatus = models.find((m) => m.id === model.id);
				if (currentStatus?.status === "not_downloaded") {
					await handleDownload(model.id);
					await handleLoad(model.id);
				}
				if (currentStatus?.status === "downloaded") {
					await handleLoad(model.id);
				}
			}
		} finally {
			setPrepareStatus("done");
		}
	};

	const getActionButton = (model: ModelInfo & any) => {
		switch (model.status) {
			case "not_downloaded":
				return (
					<button
						onClick={() => handleDownload(model.id)}
						style={buttonStyle("#3b82f6")}
					>
						Download
					</button>
				);
			case "downloaded":
				return (
					<button
						onClick={() => handleLoad(model.id)}
						style={buttonStyle("#10b981")}
					>
						Load to RAM
					</button>
				);
			case "loaded":
				return (
					<button
						onClick={() => {
							handleUnload(model.loaded_instances[0].id);
						}}
						style={buttonStyle("#ef4444")}
					>
						Unload
					</button>
				);
			default:
				return null;
		}
	};

	return (
		<div
			style={{
				maxWidth: "900px",
				margin: "0 auto",
				padding: "24px",
				fontFamily: "system-ui, -apple-system, sans-serif",
			}}
		>
			<style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

			<div
				style={{
					marginBottom: "24px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>
					<h1
						style={{
							margin: 0,
							fontSize: "1.5rem",
							color: "#111827",
						}}
					>
						LM Studio Model Manager
					</h1>
					<p
						style={{
							margin: "4px 0 0 0",
							color: "#6b7280",
							fontSize: "0.875rem",
						}}
					>
						Manage required AI models for the system
					</p>
				</div>
				<button
					onClick={handleDownloadAll}
					disabled={
						prepareStatus === "done" ||
						prepareStatus === "preparing"
					}
					style={
						prepareStatus === "done"
							? {
									...buttonStyle("#198d19"),
								}
							: {
									...buttonStyle("#111827"),
								}
					}
				>
					{prepareStatus === "idle" && "Prepare needed AI Models"}
					{prepareStatus === "done" && "Done"}
					{prepareStatus === "preparing" && "Preparing"}
				</button>
			</div>

			{error && (
				<div
					style={{
						padding: "12px",
						backgroundColor: "#fee2e2",
						color: "#991b1b",
						borderRadius: "6px",
						marginBottom: "16px",
						fontSize: "0.875rem",
					}}
				>
					{error}
				</div>
			)}

			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "12px",
				}}
			>
				{DEFAULT_MODELS.map((defaultModel) => {
					const modelState = models.find(
						(m) => m.id === defaultModel.id,
					) || {
						id: defaultModel.id,
						status: "not_downloaded" as ModelStatus,
					};

					return (
						<div
							key={defaultModel.id}
							style={{
								border: "1px solid #e5e7eb",
								borderRadius: "8px",
								padding: "16px",
								backgroundColor: "white",
								boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
							}}
						>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
									marginBottom: "8px",
								}}
							>
								<div>
									<h3
										style={{
											margin: 0,
											fontSize: "1.125rem",
											color: "#111827",
										}}
									>
										{defaultModel.name}
									</h3>
									<p
										style={{
											margin: "4px 0 0 0",
											fontSize: "0.875rem",
											color: "#6b7280",
										}}
									>
										{defaultModel.id} • {defaultModel.type}
									</p>
								</div>
								<StatusBadge
									status={modelState.status}
									progress={modelState.downloadProgress}
								/>
							</div>

							<div
								style={{
									display: "flex",
									justifyContent: "flex-end",
									marginTop: "12px",
								}}
							>
								{getActionButton(modelState)}
							</div>
						</div>
					);
				})}
			</div>

			<div
				style={{
					marginTop: "24px",
					padding: "12px",
					backgroundColor: "#f3f4f6",
					borderRadius: "6px",
					fontSize: "0.875rem",
					color: "#4b5563",
				}}
			>
				<strong>Note:</strong> Ensure LM Studio is running locally with
				the REST API server enabled on port 1234.
			</div>
		</div>
	);
};

const buttonStyle = (bgColor: string): React.CSSProperties | any => ({
	padding: "8px 16px",
	backgroundColor: bgColor,
	color: "white",
	border: "none",
	borderRadius: "6px",
	fontSize: "0.875rem",
	fontWeight: 500,
	cursor: "pointer",
	transition: "opacity 0.2s",
	":hover": {
		opacity: 0.9,
	},
});
