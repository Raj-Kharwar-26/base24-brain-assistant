
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Settings, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateEmbedding } from '@/utils/embeddingGenerator';
import { vectorStore } from '@/utils/vectorStore';
import { ollamaClient } from '@/utils/ollamaClient';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    documentName: string;
    similarity: number;
    content: string;
  }>;
  timestamp: Date;
}

const HybridChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOllamaAvailable, setIsOllamaAvailable] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkOllamaConnection();
  }, [ollamaUrl]);

  const checkOllamaConnection = async () => {
    try {
      const available = await ollamaClient.isAvailable();
      setIsOllamaAvailable(available);
      
      if (available) {
        const models = await ollamaClient.getModels();
        setAvailableModels(models);
        if (models.length > 0 && !selectedModel) {
          setSelectedModel(models[0]);
        }
        
        if (messages.length === 0) {
          setMessages([{
            id: '1',
            role: 'assistant',
            content: `Hello! I'm your BASE24 documentation assistant running on ${models.length > 0 ? selectedModel || models[0] : 'local Ollama'}. I can answer questions based on your uploaded documents using completely local AI - no data leaves your machine!`,
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Error checking Ollama connection:', error);
      setIsOllamaAvailable(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    if (!isOllamaAvailable) {
      toast({
        title: "Ollama not available",
        description: "Please make sure Ollama is running on your local machine.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedModel) {
      toast({
        title: "No model selected",
        description: "Please select a model to use for chat.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate embedding for the user's question
      console.log('Generating embedding for user query...');
      const queryEmbedding = await generateEmbedding(currentInput);

      // Search for relevant documents
      console.log('Searching for relevant content...');
      const searchResults = await vectorStore.searchSimilar(queryEmbedding, 5);

      // Prepare context from search results
      const hasRelevantContent = searchResults.length > 0 && searchResults[0].similarity > 0.3;
      const context = hasRelevantContent
        ? searchResults
            .filter(result => result.similarity > 0.3)
            .map(result => `Source: ${result.documentName}\nContent: ${result.content}`)
            .join('\n\n')
        : 'No relevant documents found in your local library.';

      console.log(`Found ${searchResults.length} results, using ${searchResults.filter(r => r.similarity > 0.3).length} relevant chunks`);

      // Prepare messages for Ollama
      const systemPrompt = `You are a helpful BASE24 documentation assistant. Answer questions based on the provided context from the user's uploaded documents. If the context doesn't contain relevant information, say so clearly.

Context from documents:
${context}

Instructions:
- Only answer based on the provided context
- Be specific and cite the source documents when possible  
- If the context doesn't contain relevant information, say "I couldn't find specific information about this in your uploaded documents"
- Keep responses concise but informative
- You are running locally via Ollama, so emphasize privacy and local processing`;

      // Add a temporary message to show streaming
      const tempId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: tempId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      setIsStreaming(true);
      let fullResponse = '';

      // Call Ollama with streaming
      await ollamaClient.chat(
        selectedModel,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: currentInput }
        ],
        (chunk) => {
          fullResponse += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, content: fullResponse }
              : msg
          ));
        }
      );

      // Update final message with sources
      const sources = hasRelevantContent 
        ? searchResults
            .filter(result => result.similarity > 0.3)
            .map(result => ({
              documentName: result.documentName,
              similarity: result.similarity,
              content: result.content.substring(0, 200) + '...'
            }))
        : [];

      setMessages(prev => prev.map(msg => 
        msg.id === tempId 
          ? { ...msg, content: fullResponse, sources }
          : msg
      ));

    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure Ollama is running and the selected model is available.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header with Ollama connection status */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isOllamaAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOllamaAvailable ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-xs font-medium">
              {isOllamaAvailable ? 'Ollama Connected' : 'Ollama Disconnected'}
            </span>
          </div>
          
          {isOllamaAvailable && availableModels.length > 0 && (
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <Zap className="h-4 w-4" />
          <span>Local AI • Private • No cloud</span>
        </div>
      </div>

      {/* Connection instructions if Ollama is not available */}
      {!isOllamaAvailable && (
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div className="text-amber-300">
              <p className="font-medium">Ollama not detected</p>
              <p className="text-sm text-amber-400">
                Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a> and run: <code className="bg-slate-800 px-1 rounded">ollama serve</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              message.role === 'user' 
                ? 'bg-blue-500' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500'
            }`}>
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div className={`max-w-[80%] ${
              message.role === 'user' ? '' : 'space-y-2'
            }`}>
              <Card className={`${
                message.role === 'user'
                  ? 'bg-blue-500/20 border-blue-500/30'
                  : 'bg-slate-700/50 border-slate-600'
              }`}>
                <CardContent className="p-3">
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>

              {/* Show sources for assistant messages */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Sources:</p>
                  {message.sources.map((source, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs bg-slate-800/50 text-slate-300 border-slate-600"
                    >
                      {source.documentName} ({Math.round(source.similarity * 100)}% match)
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                  <p className="text-slate-400 text-sm">
                    {isStreaming ? 'Streaming response...' : 'Searching your documents...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isOllamaAvailable 
              ? "Ask me anything about your uploaded BASE24 documents..." 
              : "Please start Ollama to begin chatting..."
            }
            className="flex-1 min-h-[50px] max-h-[150px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 resize-none"
            disabled={isLoading || !isOllamaAvailable}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading || !isOllamaAvailable}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default HybridChatInterface;
