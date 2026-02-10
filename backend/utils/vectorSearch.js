/**
 * Vector Search Utility for RAG
 * Handles embeddings and similarity search
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBHRUpqJmXTWD8ingi0OdnQVEz2RK-Oqd8';

// text-embedding-004 returns 404 on v1beta. Use supported embedding models.
// gemini-embedding-001 is the current Gemini API embedding model.
const EMBEDDING_MODELS = ['text-embedding-005', 'embedding-001', 'gemini-embedding-001'];

/**
 * Generate embedding using Gemini
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
async function generateEmbedding(text) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  let lastError;

  for (const modelName of EMBEDDING_MODELS) {
    try {
      // embedContent lives on GenerativeModel, not on the client
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);

      if (result?.embedding?.values && Array.isArray(result.embedding.values)) {
        return result.embedding.values;
      }
      if (Array.isArray(result?.embedding)) {
        return result.embedding;
      }
      throw new Error('Unexpected embedding format');
    } catch (error) {
      lastError = error;
      const msg = (error?.message || (typeof error?.toString === 'function' ? error.toString() : '')) + (error?.response?.data ? JSON.stringify(error.response.data) : '');
      if (/404|not found|not supported|embedContent/i.test(msg)) {
        continue; // try next model
      }
      throw error;
    }
  }

  throw new Error(
    `Failed to generate embedding. Tried models: ${EMBEDDING_MODELS.join(', ')}. ` +
    `Last error: ${lastError?.message || 'Unknown'}. ` +
    `Use a valid embedding model (e.g. text-embedding-005 or embedding-001) and check GEMINI_API_KEY.`
  );
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
  if (denominator === 0) return 0;
  
  return dotProduct / denominator;
}

/**
 * Find most similar chunks using vector similarity
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {Array<{text: string, embedding: number[], metadata: object}>} chunks - Chunks with embeddings
 * @param {number} topK - Number of top results to return
 * @returns {Array<{chunk: object, similarity: number}>} Top similar chunks
 */
function findSimilarChunks(queryEmbedding, chunks, topK = 5) {
  const similarities = chunks.map(chunk => ({
    chunk: chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));
  
  // Sort by similarity (descending)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Return top K
  return similarities.slice(0, topK);
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function generateEmbeddingsBatch(texts) {
  // Gemini doesn't support batch embeddings directly, so we'll do sequential
  // For production, consider batching or using a service that supports batch
  const embeddings = [];
  
  for (const text of texts) {
    try {
      const embedding = await generateEmbedding(text);
      embeddings.push(embedding);
    } catch (error) {
      console.error(`Failed to embed text: ${text.substring(0, 50)}...`, error.message);
      // Push zero vector as fallback
      embeddings.push(new Array(768).fill(0)); // Adjust size based on model
    }
  }
  
  return embeddings;
}

module.exports = {
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
  findSimilarChunks
};
