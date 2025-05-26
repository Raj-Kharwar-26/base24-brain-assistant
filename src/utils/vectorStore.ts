
interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: {
    chunkIndex: number;
    documentName: string;
  };
}

class BrowserVectorStore {
  private chunks: DocumentChunk[] = [];
  private readonly storageKey = 'base24-vector-store';

  constructor() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.chunks));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.chunks = JSON.parse(stored);
        console.log(`Loaded ${this.chunks.length} chunks from storage`);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      this.chunks = [];
    }
  }

  addDocumentChunks(documentId: string, documentName: string, chunks: string[], embeddings: number[][]) {
    const newChunks: DocumentChunk[] = chunks.map((content, index) => ({
      id: `${documentId}_${index}`,
      documentId,
      content,
      embedding: embeddings[index],
      metadata: {
        chunkIndex: index,
        documentName
      }
    }));

    // Remove existing chunks for this document
    this.chunks = this.chunks.filter(chunk => chunk.documentId !== documentId);
    
    // Add new chunks
    this.chunks.push(...newChunks);
    
    this.saveToStorage();
    console.log(`Added ${newChunks.length} chunks for document ${documentName}`);
  }

  async searchSimilar(queryEmbedding: number[], topK: number = 5): Promise<{
    content: string;
    similarity: number;
    documentName: string;
    chunkIndex: number;
  }[]> {
    if (this.chunks.length === 0) {
      return [];
    }

    // Calculate cosine similarity for each chunk
    const similarities = this.chunks.map(chunk => {
      const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        content: chunk.content,
        similarity,
        documentName: chunk.metadata.documentName,
        chunkIndex: chunk.metadata.chunkIndex
      };
    });

    // Sort by similarity and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  getDocumentCount(): number {
    const uniqueDocuments = new Set(this.chunks.map(chunk => chunk.documentId));
    return uniqueDocuments.size;
  }

  getChunkCount(): number {
    return this.chunks.length;
  }

  removeDocument(documentId: string) {
    const initialCount = this.chunks.length;
    this.chunks = this.chunks.filter(chunk => chunk.documentId !== documentId);
    this.saveToStorage();
    console.log(`Removed ${initialCount - this.chunks.length} chunks for document ${documentId}`);
  }

  clear() {
    this.chunks = [];
    this.saveToStorage();
    console.log('Cleared all chunks from vector store');
  }
}

export const vectorStore = new BrowserVectorStore();
