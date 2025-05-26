
import { pipeline, env } from '@huggingface/transformers';

// Configure to use local models (no CDN)
env.allowLocalModels = false;
env.allowRemoteModels = true;

let embeddingPipeline: any = null;

export const initializeEmbeddingPipeline = async () => {
  if (!embeddingPipeline) {
    console.log('Initializing embedding pipeline...');
    try {
      // Use a lightweight embedding model that works well in browser
      embeddingPipeline = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        { 
          device: 'cpu',
          dtype: 'fp32'
        }
      );
      console.log('Embedding pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding pipeline:', error);
      throw error;
    }
  }
  return embeddingPipeline;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const pipeline = await initializeEmbeddingPipeline();
    
    // Generate embedding
    const result = await pipeline(text, { 
      pooling: 'mean', 
      normalize: true 
    });
    
    // Convert to regular array with proper type assertion
    const embedding = Array.from(result.data as Float32Array) as number[];
    
    console.log(`Generated embedding for text (length: ${text.length}), embedding dim: ${embedding.length}`);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i++) {
    console.log(`Generating embedding ${i + 1}/${texts.length}`);
    const embedding = await generateEmbedding(texts[i]);
    embeddings.push(embedding);
  }
  
  return embeddings;
};
