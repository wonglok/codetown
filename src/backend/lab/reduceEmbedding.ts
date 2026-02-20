/**
 * Method 2: Averaging/Chunking (Better representation)
 * Splits 512 into 3 chunks and averages them to create x, y, z.
 */
export function reduceEmbeddingToVec3Average(
	embedding: Array<number>,
): Array<number> {
	const chunkSize = Math.floor(embedding.length / 3);
	const getAvg = (start: number, end: number) =>
		embedding.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);

	return [
		getAvg(0, chunkSize),
		getAvg(chunkSize, chunkSize * 2),
		getAvg(chunkSize * 2, embedding.length),
	];
}
