
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { documentId, content, fileName, fileType, fileSize } = await req.json();
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    // Set auth for the client
    await supabaseClient.auth.setSession({ access_token: token, refresh_token: '' });
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Insert document into database
    const { error: docError } = await supabaseClient
      .from('documents')
      .insert({
        id: documentId,
        user_id: user.id,
        name: fileName,
        content: content,
        file_type: fileType,
        file_size: fileSize,
        status: 'processing'
      });

    if (docError) throw docError;

    // Split content into chunks
    const chunks = splitIntoChunks(content, 1000, 200);
    
    // Generate embeddings for each chunk
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const chunksWithEmbeddings = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Generate embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      });

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      chunksWithEmbeddings.push({
        document_id: documentId,
        chunk_index: i,
        content: chunk,
        embedding: embedding,
      });
    }

    // Insert chunks with embeddings
    const { error: chunksError } = await supabaseClient
      .from('document_chunks')
      .insert(chunksWithEmbeddings);

    if (chunksError) throw chunksError;

    // Update document status to indexed
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ status: 'indexed' })
      .eq('id', documentId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, chunksCreated: chunks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    
    if (end === text.length) break;
    start = end - overlap;
  }

  return chunks;
}
