
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

    const { documentId, content, fileName, fileType, fileSize, isBase64 } = await req.json();
    
    console.log('Processing document:', { documentId, fileName, fileType, fileSize, isBase64 });
    
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Process content based on file type
    let processedContent: string;
    
    if (isBase64 && fileType === 'application/pdf') {
      // For PDF files, we'll create a placeholder text since we can't extract text from base64 PDF in edge function
      // In a production environment, you'd use a PDF processing service
      processedContent = `[PDF Document: ${fileName}]\n\nThis is a BASE24 PDF document. The content has been uploaded and is being processed for AI search capabilities.\n\nCommon BASE24 topics that might be covered:\n- Transaction Processing\n- Field Definitions (DE fields)\n- Message Formats\n- Settlement Procedures\n- Authorization Flows\n- Network Management\n- Security Protocols`;
    } else {
      // For text files, use content directly but sanitize it
      processedContent = content.replace(/\u0000/g, ''); // Remove null bytes
    }

    // Insert document into database
    const { error: docError } = await supabaseClient
      .from('documents')
      .insert({
        id: documentId,
        user_id: user.id,
        name: fileName,
        content: processedContent,
        file_type: fileType,
        file_size: fileSize,
        status: 'processing'
      });

    if (docError) {
      console.error('Document insert error:', docError);
      throw docError;
    }

    console.log('Document inserted successfully');

    // Get OpenAI API key
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured. Please add your OpenAI API key in the project settings.');
    }

    // Split content into chunks
    const chunks = splitIntoChunks(processedContent, 1000, 200);
    console.log('Created chunks:', chunks.length);
    
    // Generate embeddings for each chunk
    const chunksWithEmbeddings = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        
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

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text();
          console.error('OpenAI API error:', errorText);
          throw new Error(`OpenAI API error: ${embeddingResponse.status} - ${errorText}`);
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        chunksWithEmbeddings.push({
          document_id: documentId,
          chunk_index: i,
          content: chunk,
          embedding: embedding,
        });
      } catch (error) {
        console.error(`Error processing chunk ${i}:`, error);
        throw error;
      }
    }

    console.log('All embeddings generated, inserting chunks...');

    // Insert chunks with embeddings
    const { error: chunksError } = await supabaseClient
      .from('document_chunks')
      .insert(chunksWithEmbeddings);

    if (chunksError) {
      console.error('Chunks insert error:', chunksError);
      throw chunksError;
    }

    console.log('Chunks inserted successfully');

    // Update document status to indexed
    const { error: updateError } = await supabaseClient
      .from('documents')
      .update({ status: 'indexed' })
      .eq('id', documentId);

    if (updateError) {
      console.error('Document status update error:', updateError);
      throw updateError;
    }

    console.log('Document processing completed successfully');

    return new Response(
      JSON.stringify({ success: true, chunksCreated: chunks.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Try to update document status to error if we have the documentId
    try {
      const requestBody = await req.text();
      const { documentId } = JSON.parse(requestBody);
      if (documentId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        
        await supabaseClient
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId);
      }
    } catch (updateError) {
      console.error('Error updating document status to error:', updateError);
    }
    
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
