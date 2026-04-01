export const InfoblockForamt = `
# File Output Foramtting 

- for writing a code file
<infoblock type="code" path="{path}">
{content}
</infoblock>

- for schedule a terminal command call, wait until result will be returned in the next run.
<infoblock type="terminal" extra="wait-for-result">
{command}
</infoblock>

- for writing the system prompt for next step
<infoblock type="next-context-prompt" extra="">
{content}
</infoblock>

- for writing next step
<infoblock type="next-step" extra="">
{content}
</infoblock>

- for writing next check up
<infoblock type="next-checkup" extra="">
{content}
</infoblock>

- for writing log
<infoblock type="log" extra="">
{content}
</infoblock>

- for ending the process
<infoblock type="goal-achieved" extra="">
{content}
</infoblock>

- {path} is the file path 
- {extra} is the extra info
- {content} is the content of the tag
`;

export type EachBlock = {
	type: string;
	path?: string;
	extra?: string;
	content: string;
};

/**
 * Parses ALL <infoblock> tags in a string.
 * - type="..." is required
 * - path="..." is optional
 * - Supports any attribute order
 * - Captures content between > and </infoblock>
 * - Skips invalid blocks (missing type)
 *
 * @param {string} input - Text that may contain multiple infoblocks
 * @returns {Array<{type: string, path?: string, content: string}>}
 */
export function parseInfoblocks(input: string) {
	const blocks: EachBlock[] = [];

	// Non-greedy match + DOTALL behavior via [\s\S]*
	const regex = /<infoblock\s+([^>]*)>([\s\S]*?)<\/infoblock>/gi;

	let match;
	while ((match = regex.exec(input)) !== null) {
		const attrsStr = match[1]!;
		const content = match[2]!.trim();

		// Extract type (required)
		const typeMatch = attrsStr.match(/type\s*=\s*["']?([^"'\s>]+)["']?/i);
		if (!typeMatch) continue; // skip invalid block

		// Extract path (optional)
		const pathMatch = attrsStr.match(/path\s*=\s*["']?([^"'\s>]+)["']?/i);

		// Extract path (optional)
		const extraMatch = attrsStr.match(/extra\s*=\s*["']?([^"'\s>]+)["']?/i);

		blocks.push({
			type: typeMatch[1]!.trim(),
			path: pathMatch ? pathMatch[1]!.trim() : undefined,
			extra: extraMatch ? extraMatch[1]!.trim() : undefined,
			content: content || "",
		});
	}

	return blocks satisfies EachBlock[];
}
