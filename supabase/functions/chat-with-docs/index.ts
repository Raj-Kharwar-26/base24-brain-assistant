
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

    const { message, sessionId } = await req.json();
    
    console.log('Chat request:', { message, sessionId });
    
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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured. Please add your OpenAI API key in the project settings.');
    }

    // Save user message
    const { error: userMsgError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message
      });

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      throw userMsgError;
    }

    console.log('User message saved');

    // Generate embedding for the user's question
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: message,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('OpenAI embedding error:', errorText);
      throw new Error(`Failed to generate embedding: ${embeddingResponse.status}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Query embedding generated');

    // Search for relevant document chunks
    const { data: searchResults, error: searchError } = await supabaseClient
      .rpc('search_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count: 5,
        filter_user_id: user.id
      });

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    console.log('Search results:', searchResults?.length || 0, 'chunks found');

    // Prepare context from search results
    const context = searchResults && searchResults.length > 0
      ? searchResults
          .map((result: any) => `Source: ${result.document_name}\nContent: ${result.content}`)
          .join('\n\n')
      : 'No relevant documents found in your library.';

    // Generate response using OpenAI
    const systemPrompt = `You are a helpful BASE24 documentation assistant. Answer questions based on the provided context from the user's uploaded documents. If the context doesn't contain relevant information, say so clearly.

Context from documents:
${context}

Instructions:
- Only answer based on the provided context
- Be specific and cite the source documents when possible
- If the context doesn't contain relevant information, say "I couldn't find specific information about this in your uploaded documents"
- Keep responses concise but informative`;

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('OpenAI chat error:', errorText);
      throw new Error(`Failed to generate response: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const assistantMessage = chatData.choices[0].message.content;

    console.log('Assistant response generated');

    // Save assistant response with sources
    const sources = searchResults && searchResults.length > 0
      ? searchResults.map((result: any) => ({
          documentName: result.document_name,
          similarity: result.similarity,
          content: result.content.substring(0, 200) + '...'
        }))
      : [];

    const { error: assistantMsgError } = await supabaseClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: assistantMessage,
        sources: sources
      });

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
      throw assistantMsgError;
    }

    console.log('Assistant message saved');

    return new Response(
      JSON.stringify({ 
        message: assistantMessage,
        sources: sources
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
