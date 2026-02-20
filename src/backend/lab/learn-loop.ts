// ============================================
// File Storage SDK + Agent Loop with Memory Management
// Auto-creates folders/files with default seed data
// Using Markdown/YAML metadata + JSON directories
// LM Studio for Chat and Embeddings
// Single File Implementation
// ============================================

import { generateText, Output, type LanguageModel } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { existsSync, mkdirSync } from "fs";

// ============================================
// Zod Schemas (No z.record, explicit objects only)
// ============================================

// Memory Node Schema
const MemoryNodeSchema = z.object({
	id: z.string(),
	content: z.string(),
	type: z.enum(["fact", "concept", "procedure", "context", "deprecated"]),
	confidence: z.number().min(0).max(1),
	createdAt: z.date(),
	lastAccessed: z.date(),
	accessCount: z.number().int().min(0),
	connections: z.array(z.string()),
	source: z.string().optional(),
	metadata: z.object({
		tags: z.array(z.string()).optional(),
		keyTerms: z.array(z.string()).optional(),
		reasoning: z.string().optional(),
		extractedAt: z.date().optional(),
		deprecationReason: z.string().optional(),
		deprecatedAt: z.date().optional(),
		mergedFrom: z.array(z.string()).optional(),
		embeddingUpdatedAt: z.date().optional(),
		version: z.number().optional(),
	}),
	validationStatus: z.enum([
		"unverified",
		"verified",
		"disputed",
		"superseded",
	]),
	supersededBy: z.string().optional(),
});

// File Metadata Schema (for YAML frontmatter)
const FileMetadataSchema = z.object({
	id: z.string(),
	type: z.enum(["fact", "concept", "procedure", "context", "deprecated"]),
	confidence: z.number().min(0).max(1),
	createdAt: z.string(),
	lastAccessed: z.string(),
	accessCount: z.number().int().min(0),
	connections: z.array(z.string()),
	source: z.string().optional(),
	validationStatus: z.enum([
		"unverified",
		"verified",
		"disputed",
		"superseded",
	]),
	supersededBy: z.string().optional(),
	embedding: z.array(z.number()).optional(),
	tags: z.array(z.string()).optional(),
	version: z.number().default(1),
});

// Database Index Schema (explicit structure, no z.record)
const FileTypeCountSchema = z.object({
	type: z.string(),
	count: z.number(),
});

const IdToFilenameMappingSchema = z.object({
	id: z.string(),
	filename: z.string(),
});

const TagIndexEntrySchema = z.object({
	tag: z.string(),
	memoryIds: z.array(z.string()),
});

const RecentAccessEntrySchema = z.object({
	id: z.string(),
	timestamp: z.string(),
});

const DatabaseIndexSchema = z.object({
	version: z.string().default("1.0.0"),
	lastUpdated: z.string(),
	totalFiles: z.number(),
	filesByType: z.array(FileTypeCountSchema),
	idToFilename: z.array(IdToFilenameMappingSchema),
	tagIndex: z.array(TagIndexEntrySchema),
	recentAccess: z.array(RecentAccessEntrySchema),
});

// Memory Extraction Schema
const LearningEntrySchema = z.object({
	type: z.enum(["fact", "concept", "procedure"]),
	content: z.string(),
	confidence: z.number().min(0).max(1),
	keyTerms: z.array(z.string()),
	reasoning: z.string(),
});

const ContradictionEntrySchema = z.object({
	existingMemoryId: z.string(),
	conflictingContent: z.string(),
	resolutionStrategy: z.enum(["supersede", "merge", "hold", "reject"]),
});

const MemoryExtractionSchema = z.object({
	learnings: z.array(LearningEntrySchema),
	contradictions: z.array(ContradictionEntrySchema),
	questions: z.array(z.string()),
});

// Learning Mode Schema
const LearningModeSchema = z.object({
	mode: z.enum(["assimilate", "accommodate", "prune"]),
	confidence: z.number().min(0).max(1),
	reasoning: z.string(),
	relevantMemoryIds: z.array(z.string()),
});

// Reflection Result Schema
const InsightEntrySchema = z.object({
	type: z.enum(["consolidation", "deprecation", "verification", "gap"]),
	description: z.string(),
	affectedMemoryIds: z.array(z.string()),
	proposedAction: z.string(),
});

const KnowledgeGapEntrySchema = z.object({
	topic: z.string(),
	severity: z.enum(["low", "medium", "high"]),
	suggestedInvestigation: z.string(),
});

const ConfidenceAdjustmentSchema = z.object({
	memoryId: z.string(),
	newConfidence: z.number().min(0).max(1),
	reason: z.string(),
});

const ReflectionResultSchema = z.object({
	insights: z.array(InsightEntrySchema),
	knowledgeGaps: z.array(KnowledgeGapEntrySchema),
	confidenceAdjustments: z.array(ConfidenceAdjustmentSchema),
});

// Agent Response Schema
const ToolCallSchema = z.object({
	tool: z.string(),
	parameters: z
		.object({
			paramName: z.string(),
			paramValue: z
				.union([z.string(), z.number(), z.boolean(), z.array(z.any())])
				.optional(),
		})
		.passthrough(),
	reasoning: z.string(),
});

const AgentResponseSchema = z.object({
	content: z.string(),
	thoughts: z.string(),
	usedMemories: z.array(z.string()),
	confidence: z.number().min(0).max(1),
	suggestedTools: z.array(ToolCallSchema).optional(),
	followUpQuestions: z.array(z.string()),
});

// Conflict Resolution Schema
const ResolutionEntrySchema = z.object({
	memoryId: z.string(),
	action: z.enum(["keep", "deprecate", "merge", "flag"]),
	newConfidence: z.number().min(0).max(1),
	explanation: z.string(),
});

const ConflictResolutionSchema = z.object({
	resolutions: z.array(ResolutionEntrySchema),
});

// Tool Parameter Schemas (explicit, no z.record)
const SearchMemoryParamsSchema = z.object({
	query: z.string(),
	limit: z.number().optional(),
});

const StoreMemoryParamsSchema = z.object({
	content: z.string(),
	type: z.enum(["fact", "concept", "procedure"]),
	confidence: z.number(),
	tags: z.array(z.string()).optional(),
});

const SelfQuestionParamsSchema = z.object({
	topic: z.string(),
});

const ConsolidateParamsSchema = z.object({});

const DeprecateMemoryParamsSchema = z.object({
	memoryId: z.string(),
	reason: z.string(),
});

const ListAllMemoriesParamsSchema = z.object({
	type: z
		.enum(["fact", "concept", "procedure", "context", "deprecated"])
		.optional(),
});

// ============================================
// Types
// ============================================

type MemoryNode = z.infer<typeof MemoryNodeSchema>;
type FileMetadata = z.infer<typeof FileMetadataSchema>;
type DatabaseIndex = z.infer<typeof DatabaseIndexSchema>;
type MemoryExtraction = z.infer<typeof MemoryExtractionSchema>;
type LearningMode = z.infer<typeof LearningModeSchema>;
type ReflectionResult = z.infer<typeof ReflectionResultSchema>;
type AgentResponse = z.infer<typeof AgentResponseSchema>;

interface PromptRequest {
	id: string;
	prompt: string;
	context?: {
		// sessionData: z.array(z.object({
		//   key: z.string(),
		//   value: z.string(),
		// })).optional(),
		// userPreferences: z.object({
		//   language: z.string().optional(),
		//   detailLevel: z.enum(['brief', 'normal', 'detailed']).optional(),
		// }).optional(),
	};
	priority: number;
	timestamp: Date;
	status: "pending" | "processing" | "completed" | "failed";
	response?: string;
	metadata: {
		userId?: string;
		sessionId?: string;
		tags?: string[];
	};
}

interface AgentState {
	memories: Map<string, MemoryNode>;
	promptQueue: PromptRequest[];
	currentContext: MemoryNode[];
	learningMode: "assimilate" | "accommodate" | "prune";
	lastReflection: Date;
	interactionCount: number;
}

interface ToolDefinition {
	name: string;
	description: string;
	parameters: z.ZodType<any>;
	execute: (args: any, context: AgentContext) => Promise<any>;
}

interface AgentContext {
	memories: FileStorageMemoryManager;
	state: AgentState;
	request: PromptRequest;
}

interface EmbeddingConfig {
	baseUrl: string;
	model: string;
	apiKey?: string;
	dimensions?: number;
}

// ============================================
// System Prompts (Embedded)
// ============================================

const SYSTEM_PROMPTS = {
	default: `You are a self-improving AI agent with explicit memory management. You operate in three learning modes:

ASSIMILATE: New information fits existing knowledge. Strengthen connections and integrate smoothly.
ACCOMMODATE: New information conflicts with existing knowledge. Hold both hypotheses in tension and seek resolution.
PRUNE: Existing knowledge is incorrect or obsolete. Mark for deprecation and removal.

Core principles:
1. Always cite relevant memories when available
2. Flag uncertainty explicitly with confidence scores
3. Use tools to augment your knowledge when needed
4. Think about what you should learn from each interaction
5. Detect contradictions and handle them explicitly

You have access to memory tools: search_memory, store_memory, self_question, consolidate_memories, list_all_memories`,

	learningModeDetection: `Analyze the current request and context to determine the appropriate learning mode.

ASSIMILATE: Use when new information extends or refines existing knowledge without conflict.
ACCOMMODATE: Use when new information contradicts or challenges existing knowledge.
PRUNE: Use when the user explicitly corrects you, says something is wrong, or asks you to forget.

Consider:
- Semantic similarity to existing memories
- Explicit contradiction markers (not, never, wrong, incorrect, actually)
- User intent (teaching vs correcting vs querying)
- Confidence levels of relevant existing memories

Output structured JSON with mode, confidence (0-1), reasoning, and relevantMemoryIds array.`,

	memoryExtraction: `Extract structured learnings from this interaction. Analyze:

1. FACTS: Specific data points, dates, names, values that should be remembered
2. CONCEPTS: Abstract patterns, principles, relationships
3. PROCEDURES: Step-by-step methods, how-to knowledge

For each learning:
- Assign appropriate confidence based on source reliability
- Identify key terms for future retrieval
- Note any contradictions with provided context

Also generate 2-3 follow-up questions that would verify deep understanding.

Output structured JSON with learnings array (each with type, content, confidence, keyTerms, reasoning), contradictions array (each with existingMemoryId, conflictingContent, resolutionStrategy), and questions array.`,

	reflection: `You are in reflection mode. Analyze your knowledge base for:

1. CONSOLIDATION: Similar memories that should be merged into abstract concepts
2. DEPRECATION: Outdated, wrong, or harmful knowledge to remove
3. VERIFICATION: Unverified claims that need validation
4. GAPS: Missing knowledge that hinders reasoning

For each insight:
- Identify specific memory IDs affected
- Propose concrete actions
- Assess impact on overall knowledge quality

Also identify knowledge gaps - topics where you have insufficient data to reason effectively.

Output structured JSON with insights array (each with type, description, affectedMemoryIds, proposedAction), knowledgeGaps array (each with topic, severity, suggestedInvestigation), and confidenceAdjustments array (each with memoryId, newConfidence, reason).`,

	conflictResolution: `Resolve detected conflicts between memories. For each conflict:

1. EVIDENCE WEIGHING: Which memory has better support?
2. SOURCE ANALYSIS: Which source is more authoritative?
3. RECENCY: Is newer information more reliable?
4. CONTEXT: Does one memory have broader applicability?

Decide: keep (maintain both), deprecate (remove one), merge (combine), or flag (needs human review).

Adjust confidence scores to reflect resolution.

Output structured JSON with resolutions array (each with memoryId, action, newConfidence, explanation).`,

	responseGeneration: `Generate a response to the user request. Structure your thinking:

1. INTERNAL REASONING: Analyze the request and available context
2. MEMORY RETRIEVAL: Identify which memories are relevant
3. CONFIDENCE ASSESSMENT: How certain are you in your answer?
4. RESPONSE: Clear, helpful answer citing sources when possible
5. FOLLOW-UP: Questions that deepen understanding or verify learning

Be honest about uncertainty. If memories are insufficient, say so and suggest what you need to learn.

Output structured JSON with content, thoughts, usedMemories array, confidence, suggestedTools array (each with tool, parameters object, reasoning), and followUpQuestions array.`,

	toolDescriptions: {
		search_memory:
			"Search the agent memory for relevant information by semantic similarity",
		store_memory:
			"Store new information as a structured memory node with YAML metadata",
		self_question:
			"Generate questions to test your own understanding of a topic",
		consolidate_memories: "Merge similar memories into abstract concepts",
		deprecate_memory:
			"Mark a memory as incorrect or obsolete and move to deprecated folder",
		list_all_memories:
			"List all memories in the knowledge base with their metadata",
	},
};

// ============================================
// Default Seed Data (Auto-created if missing)
// ============================================

const DEFAULT_SEED_DATA = [
	{
		id: "mem_default_001",
		content:
			"The agent operates on three learning modes: assimilate, accommodate, and prune. These correspond to Piaget's theory of cognitive development adapted for AI systems.",
		type: "concept" as const,
		confidence: 0.95,
		tags: ["meta", "learning-theory", "core-concept"],
		connections: ["mem_default_002", "mem_default_003", "mem_default_004"],
	},
	{
		id: "mem_default_002",
		content:
			"ASSIMILATE mode: New information fits existing knowledge schemas. The agent strengthens connections between related memories and increases confidence scores when evidence is consistent.",
		type: "procedure" as const,
		confidence: 0.9,
		tags: ["meta", "learning-modes", "assimilate"],
		connections: ["mem_default_001"],
	},
	{
		id: "mem_default_003",
		content:
			"ACCOMMODATE mode: New information conflicts with existing knowledge. The agent holds multiple hypotheses in tension and seeks evidence to resolve conflicts, potentially restructuring knowledge graphs.",
		type: "procedure" as const,
		confidence: 0.9,
		tags: ["meta", "learning-modes", "accommodate"],
		connections: ["mem_default_001"],
	},
	{
		id: "mem_default_004",
		content:
			"PRUNE mode: Existing knowledge is identified as incorrect, obsolete, or harmful. The agent marks memories as deprecated but retains provenance for audit trails and moves them to the deprecated folder.",
		type: "procedure" as const,
		confidence: 0.9,
		tags: ["meta", "learning-modes", "prune"],
		connections: ["mem_default_001"],
	},
	{
		id: "mem_default_005",
		content:
			"Memory storage uses Markdown files with YAML frontmatter for metadata and JSON directories for indexing. This enables human-readable persistent storage with semantic versioning.",
		type: "fact" as const,
		confidence: 1.0,
		tags: ["meta", "storage", "architecture", "filesystem"],
		connections: ["mem_default_006"],
	},
	{
		id: "mem_default_006",
		content:
			"Vector embeddings are generated using LM Studio's local embedding models, enabling semantic search without external API dependencies. Embeddings are stored in YAML frontmatter as arrays.",
		type: "fact" as const,
		confidence: 0.95,
		tags: ["meta", "embeddings", "lmstudio", "local-ai"],
		connections: ["mem_default_005"],
	},
	{
		id: "mem_default_007",
		content:
			"Critical thinking involves examining assumptions, evaluating evidence, considering alternatives, and reflecting on the reasoning process itself. It requires metacognitive awareness.",
		type: "concept" as const,
		confidence: 0.85,
		tags: ["cognition", "critical-thinking", "reasoning", "metacognition"],
		connections: ["mem_default_008"],
	},
	{
		id: "mem_default_008",
		content:
			"When evaluating exam quality: 1) Distractors should reveal specific misconceptions, 2) Questions should test transfer not just recall, 3) Confidence calibration identifies overconfidence, 4) Spacing and interleaving improve retention.",
		type: "procedure" as const,
		confidence: 0.8,
		tags: ["education", "exams", "evaluation", "pedagogy"],
		connections: ["mem_default_007"],
	},
	{
		id: "mem_default_009",
		content:
			"The FileStorageSDK automatically creates all necessary directories (facts, concepts, procedures, contexts, deprecated) and initializes the database.json index file with version tracking.",
		type: "fact" as const,
		confidence: 1.0,
		tags: ["meta", "storage", "initialization", "sdk"],
		connections: ["mem_default_005"],
	},
	{
		id: "mem_default_010",
		content:
			"Self-reflection in AI agents should occur periodically (every N interactions) and analyze: knowledge consolidation opportunities, deprecated memories needing cleanup, verification of unverified claims, and identification of knowledge gaps.",
		type: "procedure" as const,
		confidence: 0.85,
		tags: ["meta", "reflection", "maintenance", "self-improvement"],
		connections: ["mem_default_001", "mem_default_007"],
	},
];

// ============================================
// File Storage SDK with Auto-Creation
// ============================================

class FileStorageSDK {
	private basePath: string;
	private dbPath: string;
	private indexPath: string;
	private index: DatabaseIndex;
	private initialized: boolean;

	constructor(basePath: string = "./agent_database") {
		this.basePath = basePath;
		this.dbPath = path.join(basePath, "memories");
		this.indexPath = path.join(basePath, "database.json");
		this.index = this.createEmptyIndex();
		this.initialized = false;
	}

	private createEmptyIndex(): DatabaseIndex {
		return {
			version: "1.0.0",
			lastUpdated: new Date().toISOString(),
			totalFiles: 0,
			filesByType: [],
			idToFilename: [],
			tagIndex: [],
			recentAccess: [],
		};
	}

	/**
	 * Initialize the storage system.
	 * Auto-creates all folders and files if they don't exist.
	 * Seeds default data if database is empty.
	 */
	async initialize(): Promise<void> {
		if (this.initialized) return;

		console.log(`📁 Initializing FileStorageSDK at ${this.basePath}`);

		// Step 1: Create base directory structure
		await this.createDirectoryStructure();

		// Step 2: Initialize or load database.json
		await this.initializeIndex();

		// Step 3: Seed default data if empty
		if (this.index.totalFiles === 0) {
			console.log("🌱 Database empty, seeding default data...");
			await this.seedDefaultData();
		}

		this.initialized = true;
		console.log(
			`✅ Storage initialized with ${this.index.totalFiles} files`,
		);
	}

	/**
	 * Auto-create all required directories
	 */
	private async createDirectoryStructure(): Promise<void> {
		const dirs = [
			this.basePath,
			this.dbPath,
			path.join(this.dbPath, "facts"),
			path.join(this.dbPath, "concepts"),
			path.join(this.dbPath, "procedures"),
			path.join(this.dbPath, "contexts"),
			path.join(this.dbPath, "deprecated"),
		];

		for (const dir of dirs) {
			await this.ensureDir(dir);
		}
	}

	/**
	 * Initialize database.json index file
	 */
	private async initializeIndex(): Promise<void> {
		if (!existsSync(this.indexPath)) {
			console.log("  📝 Creating database.json index file...");
			await this.saveIndex();
		} else {
			await this.loadIndex();
			console.log(
				`  📊 Loaded index: ${this.index.totalFiles} files tracked`,
			);
		}
	}

	/**
	 * Seed default data into storage
	 */
	private async seedDefaultData(): Promise<void> {
		for (const data of DEFAULT_SEED_DATA) {
			const now = new Date().toISOString();
			const metadata: FileMetadata = {
				id: data.id,
				type: data.type,
				confidence: data.confidence,
				createdAt: now,
				lastAccessed: now,
				accessCount: 0,
				connections: data.connections,
				validationStatus: "verified",
				tags: data.tags,
				version: 1,
			};

			const yamlHeader = this.serializeMetadata(metadata);
			const fileContent = `---\n${yamlHeader}\n---\n\n${data.content}`;
			const filePath = this.getFilePath(data.id, data.type);

			// Write file directly (bypass normal write to avoid embedding generation during seed)
			await fs.writeFile(filePath, fileContent, "utf-8");

			// Update index using array operations
			this.index.idToFilename.push({
				id: data.id,
				filename: path.relative(this.basePath, filePath),
			});
			this.index.totalFiles++;

			const existingTypeCount = this.index.filesByType.find(
				(t) => t.type === data.type,
			);
			if (existingTypeCount) {
				existingTypeCount.count++;
			} else {
				this.index.filesByType.push({ type: data.type, count: 1 });
			}

			// Update tag index
			for (const tag of data.tags) {
				const existingTagEntry = this.index.tagIndex.find(
					(t) => t.tag === tag,
				);
				if (existingTagEntry) {
					if (!existingTagEntry.memoryIds.includes(data.id)) {
						existingTagEntry.memoryIds.push(data.id);
					}
				} else {
					this.index.tagIndex.push({ tag, memoryIds: [data.id] });
				}
			}

			console.log(`    ✓ Created ${data.type}/${data.id}.md`);
		}

		await this.saveIndex();
		console.log(`  ✅ Seeded ${DEFAULT_SEED_DATA.length} default memories`);
	}

	/**
	 * Ensure directory exists, create if missing
	 */
	private async ensureDir(dir: string): Promise<void> {
		try {
			if (!existsSync(dir)) {
				mkdirSync(dir, { recursive: true });
				console.log(
					`  📂 Created directory: ${path.relative(this.basePath, dir) || "."}`,
				);
			}
		} catch (error) {
			console.error(`Failed to create directory ${dir}:`, error);
			throw error;
		}
	}

	/**
	 * Get directory for memory type
	 */
	private getTypeDir(type: string): string {
		const typeDirs: Record<string, string> = {
			fact: "facts",
			concept: "concepts",
			procedure: "procedures",
			context: "contexts",
			deprecated: "deprecated",
		};
		return path.join(this.dbPath, typeDirs[type] || "facts");
	}

	/**
	 * Get full file path for a memory
	 */
	private getFilePath(id: string, type: string): string {
		const dir = this.getTypeDir(type);
		// Ensure directory exists before returning path
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
		return path.join(dir, `${id}.md`);
	}

	/**
	 * Serialize metadata to YAML format
	 */
	private serializeMetadata(metadata: Partial<FileMetadata>): string {
		const cleanMetadata = Object.entries(metadata).reduce(
			(acc, [key, value]) => {
				if (value !== undefined && value !== null) {
					acc[key] = value;
				}
				return acc;
			},
			{} as Record<string, any>,
		);

		return Object.entries(cleanMetadata)
			.map(([key, value]) => {
				if (Array.isArray(value)) {
					if (value.length === 0) return `${key}: []`;
					return `${key}:\n${value.map((v) => `  - ${JSON.stringify(v)}`).join("\n")}`;
				}
				return `${key}: ${JSON.stringify(value)}`;
			})
			.join("\n");
	}

	/**
	 * Parse YAML frontmatter and content from markdown file
	 */
	private parseMetadata(content: string): {
		metadata: Partial<FileMetadata>;
		body: string;
	} {
		const match: any = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
		if (!match) {
			return { metadata: {}, body: content };
		}

		const yamlContent = match[1] as string;
		const body = match[2].trim();

		const metadata: Record<string, any> = {};
		const lines = yamlContent.split("\n");
		let currentKey: string | null = null;

		for (const line of lines) {
			const arrayMatch: any = line.match(/^  - (.+)$/);
			if (arrayMatch && currentKey) {
				if (!metadata[currentKey]) metadata[currentKey] = [];
				const value = arrayMatch[1].trim();
				try {
					metadata[currentKey].push(JSON.parse(value));
				} catch {
					metadata[currentKey].push(
						value.replace(/^["']|["']$/g, ""),
					);
				}
			} else {
				const keyValueMatch: any = line.match(/^([^:]+):\s*(.+)?$/);
				if (keyValueMatch) {
					currentKey = keyValueMatch[1].trim() as string;
					const value = keyValueMatch[2]?.trim();
					if (value) {
						try {
							metadata[currentKey] = JSON.parse(value);
						} catch {
							metadata[currentKey] = value.replace(
								/^["']|["']$/g,
								"",
							);
						}
					} else {
						metadata[currentKey] = [];
					}
				}
			}
		}

		return { metadata, body };
	}

	/**
	 * Write a new memory file with metadata
	 */
	async writeFile(
		id: string,
		content: string,
		metadata: Partial<
			Omit<
				FileMetadata,
				"id" | "createdAt" | "lastAccessed" | "accessCount" | "version"
			>
		>,
	): Promise<string> {
		// Ensure initialized
		if (!this.initialized) await this.initialize();

		const type = metadata.type || "fact";
		const now = new Date().toISOString();

		const fullMetadata: FileMetadata = {
			id,
			type,
			confidence: metadata.confidence ?? 0.5,
			createdAt: now,
			lastAccessed: now,
			accessCount: 0,
			connections: metadata.connections ?? [],
			source: metadata.source,
			validationStatus: metadata.validationStatus ?? "unverified",
			supersededBy: metadata.supersededBy,
			embedding: metadata.embedding,
			tags: metadata.tags ?? [],
			version: 1,
		};

		const yamlHeader = this.serializeMetadata(fullMetadata);
		const fileContent = `---\n${yamlHeader}\n---\n\n${content}`;
		const filePath = this.getFilePath(id, type);

		// Ensure directory exists
		await this.ensureDir(path.dirname(filePath));

		await fs.writeFile(filePath, fileContent, "utf-8");

		// Update index using array operations
		const existingMapping = this.index.idToFilename.find(
			(m) => m.id === id,
		);
		if (existingMapping) {
			existingMapping.filename = path.relative(this.basePath, filePath);
		} else {
			this.index.idToFilename.push({
				id,
				filename: path.relative(this.basePath, filePath),
			});
			this.index.totalFiles++;
		}

		const existingTypeCount = this.index.filesByType.find(
			(t) => t.type === type,
		);
		if (existingTypeCount) {
			existingTypeCount.count++;
		} else {
			this.index.filesByType.push({ type, count: 1 });
		}

		// Update tag index
		for (const tag of fullMetadata.tags as any[]) {
			const existingTagEntry = this.index.tagIndex.find(
				(t) => t.tag === tag,
			);
			if (existingTagEntry) {
				if (!existingTagEntry.memoryIds.includes(id)) {
					existingTagEntry.memoryIds.push(id);
				}
			} else {
				this.index.tagIndex.push({ tag, memoryIds: [id] });
			}
		}

		await this.saveIndex();
		return filePath;
	}

	/**
	 * Read a memory file and update access statistics
	 */
	async readFile(
		id: string,
	): Promise<{ metadata: FileMetadata; content: string } | null> {
		// Ensure initialized
		if (!this.initialized) await this.initialize();

		const mapping = this.index.idToFilename.find((m) => m.id === id);
		if (!mapping) return null;

		const filePath = path.join(this.basePath, mapping.filename);

		// Auto-create if file missing but in index (corruption recovery)
		if (!existsSync(filePath)) {
			console.warn(`  ⚠️  File missing for ${id}, removing from index`);
			this.index.idToFilename = this.index.idToFilename.filter(
				(m) => m.id !== id,
			);
			this.index.totalFiles = Math.max(0, this.index.totalFiles - 1);
			await this.saveIndex();
			return null;
		}

		try {
			const fileContent = await fs.readFile(filePath, "utf-8");
			const { metadata, body } = this.parseMetadata(fileContent);

			// Update access stats
			metadata.lastAccessed = new Date().toISOString();
			metadata.accessCount = ((metadata.accessCount as number) || 0) + 1;

			// Rewrite with updated stats
			const yamlHeader = this.serializeMetadata(metadata as FileMetadata);
			const newContent = `---\n${yamlHeader}\n---\n\n${body}`;
			await fs.writeFile(filePath, newContent, "utf-8");

			// Update recent access in index
			this.index.recentAccess.unshift({
				id,
				timestamp: metadata.lastAccessed,
			});
			this.index.recentAccess = this.index.recentAccess.slice(0, 100);
			await this.saveIndex();

			return { metadata: metadata as FileMetadata, content: body };
		} catch (error) {
			console.error(`Error reading file ${filePath}:`, error);
			return null;
		}
	}

	/**
	 * Update existing memory file
	 */
	async updateFile(
		id: string,
		updates: Partial<{ content: string; metadata: Partial<FileMetadata> }>,
	): Promise<boolean> {
		// Ensure initialized
		if (!this.initialized) await this.initialize();

		const existing = await this.readFile(id);
		if (!existing) return false;

		const { metadata, content } = existing;

		if (updates.content) {
			metadata.version = (metadata.version || 1) + 1;
		}

		if (updates.metadata) {
			Object.assign(metadata, updates.metadata);
		}

		const yamlHeader = this.serializeMetadata(metadata);
		const newContent = `---\n${yamlHeader}\n---\n\n${updates.content || content}`;

		const mapping = this.index.idToFilename.find((m) => m.id === id);
		if (!mapping) return false;

		const filePath = path.join(this.basePath, mapping.filename);

		// Ensure directory exists
		await this.ensureDir(path.dirname(filePath));

		await fs.writeFile(filePath, newContent, "utf-8");
		await this.saveIndex();
		return true;
	}

	/**
	 * Delete a memory file
	 */
	async deleteFile(id: string): Promise<boolean> {
		// Ensure initialized
		if (!this.initialized) await this.initialize();

		const mapping = this.index.idToFilename.find((m) => m.id === id);
		if (!mapping) return false;

		const filePath = path.join(this.basePath, mapping.filename);

		try {
			if (existsSync(filePath)) {
				await fs.unlink(filePath);
			}

			// Update index using array operations
			const type = mapping.filename.split("/")[1];
			this.index.idToFilename = this.index.idToFilename.filter(
				(m) => m.id !== id,
			);
			this.index.totalFiles = Math.max(0, this.index.totalFiles - 1);

			const typeCount = this.index.filesByType.find(
				(t) => t.type === type,
			);
			if (typeCount) {
				typeCount.count = Math.max(0, typeCount.count - 1);
			}

			// Remove from tag index
			this.index.tagIndex = this.index.tagIndex
				.map((tagEntry) => ({
					...tagEntry,
					memoryIds: tagEntry.memoryIds.filter((mid) => mid !== id),
				}))
				.filter((tagEntry) => tagEntry.memoryIds.length > 0);

			await this.saveIndex();
			return true;
		} catch (error) {
			console.error(`Error deleting file ${filePath}:`, error);
			return false;
		}
	}

	/**
	 * Check if memory exists
	 */
	async exists(id: string): Promise<boolean> {
		if (!this.initialized) await this.initialize();
		return this.index.idToFilename.some((m) => m.id === id);
	}

	/**
	 * List all memory IDs with optional filtering
	 */
	async listAll(options?: {
		type?: string;
		tag?: string;
		limit?: number;
	}): Promise<string[]> {
		if (!this.initialized) await this.initialize();

		let ids = this.index.idToFilename.map((m) => m.id);

		if (options?.type) {
			ids = ids.filter((id) => {
				const mapping = this.index.idToFilename.find(
					(m) => m.id === id,
				);
				return (
					mapping && mapping.filename.includes(`/${options.type}/`)
				);
			});
		}

		if (options?.tag) {
			const tagEntry = this.index.tagIndex.find(
				(t) => t.tag === options.tag,
			);
			ids = tagEntry ? tagEntry.memoryIds : [];
		}

		if (options?.limit) {
			ids = ids.slice(0, options.limit);
		}

		return ids;
	}

	/**
	 * Query memories by tag
	 */
	async queryByTag(
		tag: string,
	): Promise<Array<{ id: string; metadata: FileMetadata; content: string }>> {
		if (!this.initialized) await this.initialize();

		const tagEntry = this.index.tagIndex.find((t) => t.tag === tag);
		const ids = tagEntry ? tagEntry.memoryIds : [];
		const results = [];

		for (const id of ids) {
			const file = await this.readFile(id);
			if (file) results.push({ id, ...file });
		}

		return results;
	}

	/**
	 * Get database statistics
	 */
	async getStats(): Promise<DatabaseIndex> {
		if (!this.initialized) await this.initialize();
		return { ...this.index };
	}

	/**
	 * Get base storage path
	 */
	getBasePath(): string {
		return this.basePath;
	}

	/**
	 * Export all memories
	 */
	async exportAll(): Promise<
		Array<{ id: string; metadata: FileMetadata; content: string }>
	> {
		if (!this.initialized) await this.initialize();

		const ids = await this.listAll();
		const results = [];

		for (const id of ids) {
			const file = await this.readFile(id);
			if (file) results.push({ id, ...file });
		}

		return results;
	}

	/**
	 * Load index from disk
	 */
	private async loadIndex(): Promise<void> {
		try {
			const data = await fs.readFile(this.indexPath, "utf-8");
			const parsed = JSON.parse(data);
			// Convert old format to new array format if needed
			this.index = this.migrateIndexFormat(parsed);
		} catch (error) {
			console.warn("Failed to load index, creating new one:", error);
			this.index = this.createEmptyIndex();
		}
	}

	/**
	 * Migrate old record-based index to new array-based format
	 */
	private migrateIndexFormat(parsed: any): DatabaseIndex {
		// If already in new format, return as-is
		if (Array.isArray(parsed.idToFilename)) {
			return DatabaseIndexSchema.parse(parsed);
		}

		// Convert old record format to new array format
		const newIndex: DatabaseIndex = {
			version: parsed.version || "1.0.0",
			lastUpdated: parsed.lastUpdated || new Date().toISOString(),
			totalFiles: parsed.totalFiles || 0,
			filesByType: Object.entries(parsed.filesByType || {}).map(
				([type, count]) => ({
					type,
					count: count as number,
				}),
			),
			idToFilename: Object.entries(parsed.idToFilename || {}).map(
				([id, filename]) => ({
					id,
					filename: filename as string,
				}),
			),
			tagIndex: Object.entries(parsed.tagIndex || {}).map(
				([tag, memoryIds]) => ({
					tag,
					memoryIds: memoryIds as string[],
				}),
			),
			recentAccess: (parsed.recentAccess || []).map((entry: any) => ({
				id: entry.id,
				timestamp: entry.timestamp,
			})),
		};

		return newIndex;
	}

	/**
	 * Save index to disk
	 */
	private async saveIndex(): Promise<void> {
		this.index.lastUpdated = new Date().toISOString();
		await fs.writeFile(this.indexPath, JSON.stringify(this.index, null, 2));
	}

	/**
	 * Force re-initialization (useful for recovery)
	 */
	async reinitialize(): Promise<void> {
		this.initialized = false;
		this.index = this.createEmptyIndex();
		await this.initialize();
	}
}

// ============================================
// LM Studio Embedding Provider
// ============================================

class LMStudioEmbeddingProvider {
	private baseUrl: string;
	private model: string;
	private apiKey: string;
	private dimensions: number;

	constructor(config: EmbeddingConfig) {
		this.baseUrl = config.baseUrl.replace("/v1", "");
		this.model = config.model;
		this.apiKey = config.apiKey || "not-needed";
		this.dimensions = config.dimensions || 768;
	}

	async generateEmbedding(text: string): Promise<number[]> {
		try {
			const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${this.apiKey}`,
				},
				body: JSON.stringify({
					model: this.model,
					input: text,
					encoding_format: "float",
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				throw new Error(
					`Embedding API error: ${response.status} - ${error}`,
				);
			}

			const data = await response.json();

			if (data.data && data.data[0] && data.data[0].embedding) {
				return data.data[0].embedding;
			} else if (data.embedding) {
				return data.embedding;
			} else {
				throw new Error("Unexpected embedding response format");
			}
		} catch (error) {
			console.error("Failed to generate embedding:", error);
			return this.fallbackEmbedding(text);
		}
	}

	private fallbackEmbedding(text: string): number[] {
		const hash = text.split("").reduce((a, b) => {
			a = (a << 5) - a + b.charCodeAt(0);
			return a & a;
		}, 0);
		return Array.from(
			{ length: this.dimensions },
			(_, i) => Math.sin(hash * (i + 1)) * 0.5 + 0.5,
		);
	}
}

// ============================================
// File Storage Memory Manager
// ============================================

class FileStorageMemoryManager {
	private storage: FileStorageSDK;
	private embeddingProvider: LMStudioEmbeddingProvider;
	private memoryCache: Map<string, MemoryNode>;
	private vectorCache: Map<string, number[]>;
	private initialized: boolean;

	constructor(
		storage: FileStorageSDK,
		embeddingProvider: LMStudioEmbeddingProvider,
	) {
		this.storage = storage;
		this.embeddingProvider = embeddingProvider;
		this.memoryCache = new Map();
		this.vectorCache = new Map();
		this.initialized = false;
	}

	async initialize(): Promise<void> {
		if (this.initialized) return;

		// Ensure storage is initialized (auto-creates folders/files)
		await this.storage.initialize();

		// Load all memories into cache
		const allFiles = await this.storage.exportAll();

		for (const file of allFiles) {
			const memory = this.fileToMemory(file);
			this.memoryCache.set(memory.id, memory);
			if (file.metadata.embedding) {
				this.vectorCache.set(memory.id, file.metadata.embedding);
			}
		}

		this.initialized = true;
		console.log(
			`🧠 Memory manager loaded ${this.memoryCache.size} memories from storage`,
		);
	}

	private fileToMemory(file: {
		id: string;
		metadata: FileMetadata;
		content: string;
	}): MemoryNode {
		return {
			id: file.metadata.id,
			content: file.content,
			type: file.metadata.type,
			confidence: file.metadata.confidence,
			createdAt: new Date(file.metadata.createdAt),
			lastAccessed: new Date(file.metadata.lastAccessed),
			accessCount: file.metadata.accessCount,
			connections: file.metadata.connections,
			source: file.metadata.source,
			metadata: {
				tags: file.metadata.tags,
				version: file.metadata.version,
			},
			validationStatus: file.metadata.validationStatus,
			supersededBy: file.metadata.supersededBy,
		};
	}

	private memoryToFileMetadata(memory: MemoryNode): Partial<FileMetadata> {
		return {
			type: memory.type,
			confidence: memory.confidence,
			connections: memory.connections,
			source: memory.source,
			validationStatus: memory.validationStatus,
			supersededBy: memory.supersededBy,
			tags: memory.metadata.tags,
			embedding: this.vectorCache.get(memory.id),
		};
	}

	async createMemory(
		content: string,
		type: MemoryNode["type"],
		options?: Partial<Omit<MemoryNode, "id" | "content" | "type">>,
	): Promise<MemoryNode> {
		if (!this.initialized) await this.initialize();

		const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Generate embedding
		const embedding =
			await this.embeddingProvider.generateEmbedding(content);

		// Find connections by vector similarity
		const connections = await this.findRelatedByVector(embedding, 3);

		const memory: MemoryNode = {
			id,
			content,
			type,
			confidence: options?.confidence ?? 0.5,
			createdAt: new Date(),
			lastAccessed: new Date(),
			accessCount: 0,
			connections: connections.map((m) => m.id),
			source: options?.source,
			metadata: options?.metadata ?? {},
			validationStatus: options?.validationStatus ?? "unverified",
			supersededBy: options?.supersededBy,
		};

		// Persist to storage (auto-creates folders if needed)
		await this.storage.writeFile(id, content, {
			...this.memoryToFileMetadata(memory),
			embedding,
		});

		// Update caches
		this.memoryCache.set(id, memory);
		this.vectorCache.set(id, embedding);

		return memory;
	}

	async retrieve(query: string, limit: number = 5): Promise<MemoryNode[]> {
		if (!this.initialized) await this.initialize();

		const queryEmbedding =
			await this.embeddingProvider.generateEmbedding(query);

		const scored = Array.from(this.memoryCache.values())
			.filter((m) => m.validationStatus !== "superseded")
			.map((memory) => ({
				memory,
				score:
					this.cosineSimilarity(
						queryEmbedding,
						this.vectorCache.get(memory.id) ||
							this.fallbackVector(),
					) * this.getRecencyBoost(memory),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		// Update access patterns and persist
		for (const { memory } of scored) {
			memory.lastAccessed = new Date();
			memory.accessCount++;

			// Update in storage
			await this.storage.updateFile(memory.id, {
				metadata: {
					lastAccessed: memory.lastAccessed.toISOString(),
					accessCount: memory.accessCount,
				},
			});
		}

		return scored.map((s) => s.memory);
	}

	async retrieveByVector(
		embedding: number[],
		limit: number = 5,
	): Promise<MemoryNode[]> {
		if (!this.initialized) await this.initialize();

		const scored = Array.from(this.memoryCache.values())
			.filter((m) => m.validationStatus !== "superseded")
			.map((memory) => ({
				memory,
				score: this.cosineSimilarity(
					embedding,
					this.vectorCache.get(memory.id) || this.fallbackVector(),
				),
			}))
			.sort((a, b) => b.score - a.score)
			.slice(0, limit);

		return scored.map((s) => s.memory);
	}

	async deprecateMemory(
		id: string,
		reason: string,
		replacementId?: string,
	): Promise<void> {
		if (!this.initialized) await this.initialize();

		const memory = this.memoryCache.get(id);
		if (!memory) throw new Error(`Memory ${id} not found`);

		memory.validationStatus = "superseded";
		memory.supersededBy = replacementId;
		memory.metadata.deprecationReason = reason;
		memory.metadata.deprecatedAt = new Date();

		// Persist changes
		await this.storage.updateFile(id, {
			metadata: this.memoryToFileMetadata(memory),
		});

		// Move to deprecated folder by updating type
		await this.storage.deleteFile(id);
		await this.storage.writeFile(id, memory.content, {
			...this.memoryToFileMetadata(memory),
			type: "deprecated",
			embedding: this.vectorCache.get(id),
		});

		// Update cache
		memory.type = "deprecated";
		this.memoryCache.set(id, memory);
	}

	async consolidate(): Promise<void> {
		if (!this.initialized) await this.initialize();

		const clusters = await this.clusterByVector();

		for (const cluster of clusters) {
			if (cluster.length < 2) continue;

			const mergedContent = await this.synthesizeConcept(cluster);
			const newEmbedding =
				await this.embeddingProvider.generateEmbedding(mergedContent);

			const newMemory = await this.createMemory(
				mergedContent,
				"concept",
				{
					confidence: Math.max(...cluster.map((m) => m.confidence)),
					metadata: { mergedFrom: cluster.map((m) => m.id) },
				},
			);

			// Update vector cache for new memory
			this.vectorCache.set(newMemory.id, newEmbedding);

			for (const mem of cluster) {
				await this.deprecateMemory(
					mem.id,
					"Consolidated into abstract concept",
					newMemory.id,
				);
			}

			console.log(
				`  🔄 Consolidated ${cluster.length} memories into ${newMemory.id}`,
			);
		}
	}

	get(id: string): MemoryNode | undefined {
		return this.memoryCache.get(id);
	}

	getAll(): MemoryNode[] {
		return Array.from(this.memoryCache.values());
	}

	getEmbedding(id: string): number[] | undefined {
		return this.vectorCache.get(id);
	}

	async findRelatedByVector(
		embedding: number[],
		limit: number,
	): Promise<MemoryNode[]> {
		return this.retrieveByVector(embedding, limit);
	}

	private async clusterByVector(): Promise<MemoryNode[][]> {
		const threshold = 0.85;
		const visited = new Set<string>();
		const clusters: MemoryNode[][] = [];

		for (const [id, embedding] of this.vectorCache.entries()) {
			if (visited.has(id)) continue;

			const cluster: MemoryNode[] = [];
			const queue = [id];

			while (queue.length > 0) {
				const currentId = queue.pop()!;
				if (visited.has(currentId)) continue;

				const currentMemory = this.memoryCache.get(currentId);
				const currentEmbedding = this.vectorCache.get(currentId);
				if (!currentMemory || !currentEmbedding) continue;

				visited.add(currentId);
				cluster.push(currentMemory);

				for (const [
					otherId,
					otherEmbedding,
				] of this.vectorCache.entries()) {
					if (visited.has(otherId)) continue;

					const similarity = this.cosineSimilarity(
						currentEmbedding,
						otherEmbedding,
					);
					if (similarity > threshold) {
						queue.push(otherId);
					}
				}
			}

			if (cluster.length > 1) clusters.push(cluster);
		}

		return clusters;
	}

	private async synthesizeConcept(memories: MemoryNode[]): Promise<string> {
		const embeddings = memories
			.map((m) => this.vectorCache.get(m.id)!)
			.filter(Boolean);
		if (embeddings.length === 0) {
			return `Abstract: ${memories.map((m) => m.content.substring(0, 100)).join(" | ")}`;
		}

		const centroid = this.calculateCentroid(embeddings);

		let closestMemory = memories[0] as any;
		let closestDistance = Infinity;

		for (const memory of memories) {
			const embedding = this.vectorCache.get(memory.id);
			if (!embedding) continue;
			const distance = this.euclideanDistance(centroid, embedding);
			if (distance < closestDistance) {
				closestDistance = distance;
				closestMemory = memory;
			}
		}

		return `Abstract Concept (${memories.length} sources): ${closestMemory.content.substring(0, 150)}...`;
	}

	private calculateCentroid(embeddings: number[][]): number[] {
		const dimensions = (embeddings as any)[0].length;
		const centroid = new Array(dimensions).fill(0);

		for (const embedding of embeddings) {
			for (let i = 0; i < dimensions; i++) {
				centroid[i] += embedding[i];
			}
		}

		return centroid.map((sum) => sum / embeddings.length);
	}

	private euclideanDistance(a: any[], b: any[]): number {
		return Math.sqrt(
			a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0),
		);
	}

	private cosineSimilarity(a: any[], b: any[]): number {
		const dot = a.reduce((sum, _, i) => sum + a[i] * b[i], 0);
		const normA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
		const normB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
		return dot / (normA * normB);
	}

	private getRecencyBoost(memory: MemoryNode): number {
		const hoursSinceAccess =
			(Date.now() - memory.lastAccessed.getTime()) / 3600000;
		return (
			Math.exp(-0.01 * hoursSinceAccess) *
			(1 + Math.log1p(memory.accessCount) * 0.1)
		);
	}

	private fallbackVector(): number[] {
		return new Array(768).fill(0.5);
	}

	getStats(): object {
		return {
			totalMemories: this.memoryCache.size,
			byType: Array.from(this.memoryCache.values()).reduce(
				(acc, m) => {
					acc[m.type] = (acc[m.type] || 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			),
			averageConfidence:
				Array.from(this.memoryCache.values()).reduce(
					(sum, m) => sum + m.confidence,
					0,
				) / this.memoryCache.size,
			supersededCount: Array.from(this.memoryCache.values()).filter(
				(m) => m.validationStatus === "superseded",
			).length,
		};
	}

	getStorage(): FileStorageSDK {
		return this.storage;
	}
}

// ============================================
// Prompt Request Stack
// ============================================

class PromptRequestStack {
	private queue: PromptRequest[];
	private processing: Set<string>;
	private subscribers: Map<string, ((request: PromptRequest) => void)[]>;

	constructor() {
		this.queue = [];
		this.processing = new Set();
		this.subscribers = new Map();
	}

	push(
		prompt: string,
		options?: Partial<
			Omit<PromptRequest, "id" | "prompt" | "timestamp" | "status">
		>,
	): string {
		const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const request: PromptRequest = {
			id,
			prompt,
			priority: options?.priority ?? 1,
			timestamp: new Date(),
			status: "pending",
			context: options?.context,
			metadata: options?.metadata ?? {},
			...options,
		};

		const insertIndex = this.queue.findIndex(
			(r) => r.priority < request.priority,
		);
		if (insertIndex === -1) {
			this.queue.push(request);
		} else {
			this.queue.splice(insertIndex, 0, request);
		}

		this.notify("new", request);
		return id;
	}

	pop(): PromptRequest | undefined {
		const request = this.queue.find(
			(r) => r.status === "pending" && !this.processing.has(r.id),
		);
		if (request) {
			this.processing.add(request.id);
			request.status = "processing";
		}
		return request;
	}

	complete(id: string, response: string): void {
		const request = this.queue.find((r) => r.id === id);
		if (request) {
			request.status = "completed";
			request.response = response;
			this.processing.delete(id);
			this.notify("completed", request);
		}
	}

	fail(id: string, error: string): void {
		const request = this.queue.find((r) => r.id === id);
		if (request) {
			request.status = "failed";
			request.response = error;
			this.processing.delete(id);
			this.notify("failed", request);
		}
	}

	on(
		event: "new" | "completed" | "failed",
		callback: (request: PromptRequest) => void,
	): () => void {
		if (!this.subscribers.has(event)) {
			this.subscribers.set(event, []);
		}
		this.subscribers.get(event)!.push(callback);

		return () => {
			const subs = this.subscribers.get(event)!;
			const index = subs.indexOf(callback);
			if (index > -1) subs.splice(index, 1);
		};
	}

	getStatus(): {
		pending: number;
		processing: number;
		completed: number;
		failed: number;
	} {
		return {
			pending: this.queue.filter((r) => r.status === "pending").length,
			processing: this.processing.size,
			completed: this.queue.filter((r) => r.status === "completed")
				.length,
			failed: this.queue.filter((r) => r.status === "failed").length,
		};
	}

	get(id: string): PromptRequest | undefined {
		return this.queue.find((r) => r.id === id);
	}

	private notify(
		event: "new" | "completed" | "failed",
		request: PromptRequest,
	): void {
		this.subscribers.get(event)?.forEach((cb) => {
			try {
				cb(request);
			} catch (e) {
				console.error(e);
			}
		});
	}
}

// ============================================
// Agent Loop
// ============================================

class AgentLoop {
	private memories: FileStorageMemoryManager;
	private promptStack: PromptRequestStack;
	private state: AgentState;
	private tools: Map<string, ToolDefinition>;
	private isRunning: boolean;
	private lmStudio: ReturnType<typeof createOpenAICompatible>;
	private config: {
		chatModel: string;
		embeddingModel: string;
		maxIterations: number;
		reflectionInterval: number;
	};

	constructor(
		lmStudioBaseUrl: string = "http://localhost:1234/v1",
		storagePath: string = "./agent_database",
		config?: Partial<AgentLoop["config"]>,
	) {
		const embeddingProvider = new LMStudioEmbeddingProvider({
			baseUrl: lmStudioBaseUrl,
			model:
				config?.embeddingModel ||
				"text-embedding-nomic-embed-text-v1.5",
			dimensions: 768,
		});

		const storage = new FileStorageSDK(storagePath);
		this.memories = new FileStorageMemoryManager(
			storage,
			embeddingProvider,
		);
		this.promptStack = new PromptRequestStack();
		this.tools = new Map();
		this.isRunning = false;

		this.state = {
			memories: new Map(),
			promptQueue: [],
			currentContext: [],
			learningMode: "assimilate",
			lastReflection: new Date(),
			interactionCount: 0,
		};

		this.config = {
			chatModel: "local-ai-model",
			embeddingModel: "text-embedding-nomic-embed-text-v1.5",
			maxIterations: 5,
			reflectionInterval: 5,
			...config,
		};

		this.lmStudio = createOpenAICompatible({
			name: "lmstudio",
			baseURL: lmStudioBaseUrl as string,
			apiKey: "not-needed",
		});

		this.registerDefaultTools();
	}

	async initialize(): Promise<void> {
		// Initialize storage (auto-creates folders/files)
		await this.memories.initialize();
	}

	async start(): Promise<void> {
		if (this.isRunning) return;
		this.isRunning = true;
		console.log("🤖 Agent loop started with File Storage + LM Studio");

		while (this.isRunning) {
			const request = this.promptStack.pop();

			if (request) {
				await this.processRequest(request);
				this.state.interactionCount++;
			} else {
				await this.idleMaintenance();
				await this.sleep(100);
			}

			if (this.shouldReflect()) {
				await this.selfReflect();
			}
		}
	}

	stop(): void {
		this.isRunning = false;
		console.log("🛑 Agent loop stopped");
	}

	async submit(
		prompt: string,
		options?: Parameters<PromptRequestStack["push"]>[1],
	): Promise<string> {
		const id = this.promptStack.push(prompt, options);

		return new Promise((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error("Request timeout"));
			}, 60000);

			const unsubscribeCompleted = this.promptStack.on(
				"completed",
				(req) => {
					if (req.id === id) {
						clearTimeout(timeout);
						unsubscribeCompleted();
						resolve(req.response!);
					}
				},
			);

			const unsubscribeFailed = this.promptStack.on("failed", (req) => {
				if (req.id === id) {
					clearTimeout(timeout);
					unsubscribeFailed();
					reject(new Error(req.response));
				}
			});
		});
	}

	private async processRequest(request: PromptRequest): Promise<void> {
		console.log(
			`\n📝 Processing [${request.id}]: ${request.prompt.substring(0, 60)}...`,
		);

		try {
			// Step 1: Retrieve relevant memories
			const relevantMemories = await this.memories.retrieve(
				request.prompt,
				5,
			);
			this.state.currentContext = relevantMemories;
			console.log(
				`  📚 Retrieved ${relevantMemories.length} relevant memories from storage`,
			);

			// Step 2: Determine learning mode
			const modeResult = await this.determineLearningMode(
				request,
				relevantMemories,
			);
			this.state.learningMode = modeResult.mode;
			console.log(
				`  🧠 Mode: ${modeResult.mode} (${(modeResult.confidence * 100).toFixed(0)}%)`,
			);

			// Step 3: Generate response
			const response = await this.generateResponse(
				request,
				relevantMemories,
				modeResult,
			);

			// Step 4: Extract and persist learnings
			await this.extractLearnings(request, response, relevantMemories);

			// Step 5: Complete
			this.promptStack.complete(request.id, response.content);
		} catch (error) {
			console.error(`  ❌ Error:`, error);
			this.promptStack.fail(request.id, String(error));
		}
	}

	private async determineLearningMode(
		request: PromptRequest,
		memories: MemoryNode[],
	): Promise<LearningMode> {
		const { object } = await generateText({
			model: this.lmStudio(this.config.chatModel) as any,
			schema: LearningModeSchema,
			prompt: `${SYSTEM_PROMPTS.learningModeDetection}

User Request: "${request.prompt}"

Relevant Existing Memories:
${memories.map((m) => `- [${m.type}] ${m.content.substring(0, 100)} (ID: ${m.id}, Confidence: ${m.confidence})`).join("\n")}

Analyze and determine the learning mode.`,
		});

		return object;
	}

	private async generateResponse(
		request: PromptRequest,
		memories: MemoryNode[],
		mode: LearningMode,
	): Promise<AgentResponse> {
		const contextBlock =
			memories.length > 0
				? `\nRelevant Context from Knowledge Base:\n${memories
						.map(
							(m) =>
								`- [${m.type}] ${m.content.substring(0, 150)}... (ID: ${m.id}, conf: ${m.confidence})`,
						)
						.join("\n")}`
				: "No relevant memories found in storage.";

		const object: any = await generateText({
			output: Output.object({
				schema: AgentResponseSchema,
			}),
			model: this.lmStudio(this.config.chatModel) as any,
			prompt: `${SYSTEM_PROMPTS.default}

${SYSTEM_PROMPTS.responseGeneration}

Current Learning Mode: ${mode.mode} - ${mode.reasoning}

${contextBlock}

Available Tools:
${Array.from(this.tools.entries())
	.map(([name, tool]) => `- ${name}: ${tool.description}`)
	.join("\n")}

User Request: "${request.prompt}"

Generate your response following the schema.`,
		});

		// Execute suggested tools
		if (object.suggestedTools && object.suggestedTools.length > 0) {
			for (const toolCall of object.suggestedTools) {
				const tool = this.tools.get(toolCall.tool);
				if (tool) {
					try {
						const result = await tool.execute(toolCall.parameters, {
							memories: this.memories,
							state: this.state,
							request,
						});
						object.content += `\n\n[Tool ${toolCall.tool} result: ${JSON.stringify(result).substring(0, 200)}]`;
					} catch (e) {
						object.content += `\n\n[Tool ${toolCall.tool} failed: ${e}]`;
					}
				}
			}
		}

		return object;
	}

	private async extractLearnings(
		request: PromptRequest,
		response: AgentResponse,
		priorMemories: MemoryNode[],
	): Promise<void> {
		const object = (await generateText({
			output: Output.object({
				schema: MemoryExtractionSchema,
			}),
			model: this.lmStudio(this.config.chatModel) as any,
			prompt: `${SYSTEM_PROMPTS.memoryExtraction}

Interaction:
- User: "${request.prompt}"
- Agent: "${response.content}"
- Thoughts: "${response.thoughts}"

Prior Memories:
${priorMemories.map((m) => `- ${m.id}: ${m.content.substring(0, 100)}`).join("\n")}

Extract structured learnings and identify any contradictions.`,
		})) as any;

		// Store new learnings (persisted to file storage with auto-folder creation)
		for (const learning of object.learnings) {
			const memory = await this.memories.createMemory(
				learning.content,
				learning.type,
				{
					confidence: learning.confidence,
					source: `interaction:${request.id}`,
					metadata: {
						keyTerms: learning.keyTerms,
						reasoning: learning.reasoning,
						extractedAt: new Date(),
						tags: [
							"learned",
							request.metadata.tags?.[0] || "general",
						].filter(Boolean),
					},
				},
			);
			console.log(
				`  💾 Persisted [${learning.type}]: ${learning.content.substring(0, 50)}... (conf: ${learning.confidence})`,
			);
		}

		if (object.contradictions.length > 0) {
			console.log(
				`  ⚠️  Detected ${object.contradictions.length} contradictions`,
			);
			await this.resolveConflicts(object.contradictions);
		}
	}

	private async resolveConflicts(
		contradictions: MemoryExtraction["contradictions"],
	): Promise<void> {
		const object: any = await generateText({
			output: Output.object({
				schema: ConflictResolutionSchema,
			}),
			model: this.lmStudio(this.config.chatModel) as any,
			prompt: `${SYSTEM_PROMPTS.conflictResolution}

Contradictions to resolve:
${contradictions
	.map(
		(c) => `
- Memory ${c.existingMemoryId}: "${c.conflictingContent}"
  Proposed strategy: ${c.resolutionStrategy}
`,
	)
	.join("\n")}

Current Memory States:
${contradictions
	.map((c) => {
		const mem = this.memories.get(c.existingMemoryId);
		return `- ${c.existingMemoryId}: "${mem?.content.substring(0, 80)}..." (conf: ${mem?.confidence}, status: ${mem?.validationStatus})`;
	})
	.join("\n")}

Resolve each conflict with detailed reasoning.`,
		});

		for (const resolution of object.resolutions) {
			const memory = this.memories.get(resolution.memoryId);
			if (!memory) continue;

			if (resolution.action === "deprecate") {
				await this.memories.deprecateMemory(
					resolution.memoryId,
					resolution.explanation,
				);
				console.log(
					`  🗑️  Deprecated ${resolution.memoryId} and moved to deprecated/ folder`,
				);
			} else {
				memory.confidence = resolution.newConfidence;
				if (resolution.action === "flag") {
					memory.validationStatus = "disputed";
				}
				console.log(
					`  📝 Updated ${resolution.memoryId}: confidence ${resolution.newConfidence}`,
				);
			}
		}
	}

	private async selfReflect(): Promise<void> {
		console.log("\n🪞 Self-reflection initiated...");

		const allMemories = this.memories.getAll();
		const stats = this.memories.getStats();

		const object = await generateText({
			output: Output.object({
				schema: ReflectionResultSchema,
			}),
			model: this.lmStudio(this.config.chatModel) as any,

			prompt: `${SYSTEM_PROMPTS.reflection}

Knowledge Base Statistics:
${JSON.stringify(stats, null, 2)}

Sample Memories from Storage:
${allMemories
	.sort(() => Math.random() - 0.5)
	.slice(0, 10)
	.map(
		(m) =>
			`- [${m.type}] ${m.content.substring(0, 80)}... (conf: ${m.confidence}, accesses: ${m.accessCount})`,
	)
	.join("\n")}

Analyze and propose improvements.`,
		});

		for (const insight of object.insights) {
			console.log(`  💡 ${insight.type}: ${insight.description}`);

			if (insight.type === "consolidation") {
				await this.memories.consolidate();
			} else if (insight.type === "deprecation") {
				for (const id of insight.affectedMemoryIds) {
					await this.memories.deprecateMemory(
						id,
						insight.proposedAction,
					);
				}
			}
		}

		for (const adj of object.confidenceAdjustments) {
			const mem = this.memories.get(adj.memoryId);
			if (mem) {
				mem.confidence = adj.newConfidence;
				console.log(
					`  📊 Adjusted ${adj.memoryId} confidence to ${adj.newConfidence}`,
				);
			}
		}

		this.state.lastReflection = new Date();
		console.log(
			"  ✓ Reflection complete - all changes persisted to storage",
		);
	}

	private async idleMaintenance(): Promise<void> {
		const stats = this.memories.getStats();
		if ((stats as any).totalMemories > 900) {
			await this.memories.consolidate();
		}
	}

	private shouldReflect(): boolean {
		return (
			this.state.interactionCount > 0 &&
			this.state.interactionCount % this.config.reflectionInterval === 0
		);
	}

	private registerDefaultTools(): void {
		this.registerTool({
			name: "search_memory",
			description: SYSTEM_PROMPTS.toolDescriptions.search_memory,
			parameters: SearchMemoryParamsSchema,
			execute: async (args, context) => {
				return context.memories.retrieve(args.query, args.limit || 5);
			},
		});

		this.registerTool({
			name: "store_memory",
			description: SYSTEM_PROMPTS.toolDescriptions.store_memory,
			parameters: StoreMemoryParamsSchema,
			execute: async (args, context) => {
				const mem = await context.memories.createMemory(
					args.content,
					args.type,
					{
						confidence: args.confidence,
						metadata: { tags: args.tags || [] },
					},
				);
				return {
					id: mem.id,
					status: "stored",
					location: `memories/${mem.type}s/${mem.id}.md`,
				};
			},
		});

		this.registerTool({
			name: "self_question",
			description: SYSTEM_PROMPTS.toolDescriptions.self_question,
			parameters: SelfQuestionParamsSchema,
			execute: async (args, context) => {
				const memories = (await context.memories.retrieve(
					args.topic,
					3,
				)) as any;

				return {
					topic: args.topic,
					knownFacts: memories.map((m: MemoryNode) => m.content),
					suggestedQuestions:
						memories.length < 2
							? [
									`What is ${args.topic}?`,
									`How does ${args.topic} work?`,
								]
							: [`Why is "${memories[0].content}" significant?`],
				};
			},
		});

		this.registerTool({
			name: "consolidate_memories",
			description: SYSTEM_PROMPTS.toolDescriptions.consolidate_memories,
			parameters: ConsolidateParamsSchema,
			execute: async (_, context) => {
				await context.memories.consolidate();
				return {
					status: "consolidated",
					stats: context.memories.getStats(),
				};
			},
		});

		this.registerTool({
			name: "deprecate_memory",
			description: SYSTEM_PROMPTS.toolDescriptions.deprecate_memory,
			parameters: DeprecateMemoryParamsSchema,
			execute: async (args, context) => {
				await context.memories.deprecateMemory(
					args.memoryId,
					args.reason,
				);
				return {
					status: "deprecated",
					memoryId: args.memoryId,
					newLocation: `memories/deprecated/${args.memoryId}.md`,
				};
			},
		});

		this.registerTool({
			name: "list_all_memories",
			description: SYSTEM_PROMPTS.toolDescriptions.list_all_memories,
			parameters: ListAllMemoriesParamsSchema,
			execute: async (args, context) => {
				const all = context.memories.getAll();
				const filtered = args.type
					? all.filter((m) => m.type === args.type)
					: all;
				return {
					count: filtered.length,
					memories: filtered.map((m) => ({
						id: m.id,
						type: m.type,
						confidence: m.confidence,
						preview: m.content.substring(0, 80),
					})),
				};
			},
		});
	}

	registerTool(definition: ToolDefinition): void {
		this.tools.set(definition.name, definition);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	getMemoryManager(): FileStorageMemoryManager {
		return this.memories;
	}

	getPromptStack(): PromptRequestStack {
		return this.promptStack;
	}

	getState(): AgentState {
		return { ...this.state };
	}
}

// ============================================
// Example Usage
// ============================================

export async function runDemoLoop() {
	// Initialize agent with file storage
	const agent = new AgentLoop(
		"http://localhost:1234/v1",
		"./.codetown/agent_memory_database",
		{
			chatModel: "openclaw",
			embeddingModel: "qwen3-vl-embedding-2b", //,"text-embedding-nomic-embed-text-v1.5",
			maxIterations: 5,
			reflectionInterval: 3,
		},
	);

	console.log("=== AI Agent with Auto-Creating File Storage SDK ===");
	console.log("Features:");
	console.log(
		"- Auto-creates all folders (facts, concepts, procedures, contexts, deprecated)",
	);
	console.log(
		"- Auto-creates database.json index file with explicit array structures",
	);
	console.log("- Auto-seeds default data if database is empty");
	console.log("- Uses Markdown with YAML frontmatter for metadata");
	console.log("- Uses LM Studio for chat and embeddings");
	console.log("");

	// Initialize (auto-creates everything)
	await agent.initialize();

	// Start agent loop
	agent.start();
	await new Promise((r) => setTimeout(r, 1000));

	try {
		// Example 1: Query existing seeded data
		console.log("--- Example 1: Query Seeded Knowledge ---");
		const r1 = await agent.submit(
			"What are the three learning modes and how do they work?",
			{ priority: 1, metadata: { tags: ["meta"] } },
		);
		console.log("Response:", r1);

		// Example 2: Learn new fact (auto-creates facts/ folder if needed)
		console.log("\n--- Example 2: Learn New Fact ---");
		const r2 = await agent.submit(
			"The speed of light in vacuum is exactly 299,792,458 meters per second.",
			{ priority: 2, metadata: { tags: ["physics"] } },
		);
		console.log("Response:", r2);

		// Example 3: Semantic search
		console.log("\n--- Example 3: Semantic Search ---");
		const r3 = await agent.submit("How fast does light travel in space?", {
			priority: 1,
		});
		console.log("Response:", r3);

		// Example 4: Use tool to list memories
		console.log("\n--- Example 4: List All Memories ---");
		const r4 = await agent.submit(
			"Use the list_all_memories tool to show me what you know.",
			{ priority: 1 },
		);
		console.log("Response:", r4);

		// Example 5: Correction (triggers PRUNE mode, moves to deprecated/)
		console.log("\n--- Example 5: Correction and Unlearning ---");
		const r5 = await agent.submit(
			"Actually, I need to correct something. Light speed is 299,792,458 m/s by definition, not measurement.",
			{ priority: 3, metadata: { tags: ["correction"] } },
		);
		console.log("Response:", r5);

		// Wait for reflection
		await new Promise((r) => setTimeout(r, 2000));
	} catch (error) {
		console.error("Error:", error);
	}

	// Show final stats
	console.log("\n=== Final Memory Statistics ===");
	console.log(agent.getMemoryManager().getStats());

	console.log("\n=== Storage Location ===");
	const storagePath = agent.getMemoryManager().getStorage().getBasePath();
	console.log(`Database: ${storagePath}`);
	console.log(`Index: ${path.join(storagePath, "database.json")}`);
	console.log(`Memories: ${path.join(storagePath, "memories")}`);

	agent.stop();
	console.log("\n=== Agent Shutdown - All Data Persisted ===");
}

// if (require.main === module) {
// 	main().catch(console.error);
// }

export {
	AgentLoop,
	FileStorageMemoryManager,
	FileStorageSDK,
	PromptRequestStack,
	LMStudioEmbeddingProvider,
	SYSTEM_PROMPTS,
	DEFAULT_SEED_DATA,
	MemoryNodeSchema,
	FileMetadataSchema,
	DatabaseIndexSchema,
	type MemoryNode,
	type FileMetadata,
	type DatabaseIndex,
	type PromptRequest,
	type AgentState,
};
