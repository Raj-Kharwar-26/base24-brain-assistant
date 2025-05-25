
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

const RealChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create a new chat session when component mounts
    const createChatSession = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user?.id,
            title: 'New Chat'
          })
          .select()
          .single();

        if (error) throw error;
        setSessionId(data.id);

        // Add welcome message
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'Hello! I\'m your BASE24 documentation assistant. I can now provide accurate answers based on your uploaded documents. What would you like to know?',
          timestamp: new Date()
        }]);

      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };

    if (user) {
      createChatSession();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading || !sessionId) return;

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
      const { data, error } = await supabase.functions.invoke('chat-with-docs', {
        body: {
          message: currentInput,
          sessionId: sessionId
        }
      });

      if (error) throw error;

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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
      {/* Header with user info and logout */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="text-sm text-slate-300">
          Signed in as {user?.email}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="text-slate-400 hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>

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
                      <FileText className="h-3 w-3 mr-1" />
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
                  <p className="text-slate-400 text-sm">Searching your documents...</p>
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
            placeholder="Ask me anything about your uploaded BASE24 documents..."
            className="flex-1 min-h-[50px] max-h-[150px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 resize-none"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RealChatInterface;
