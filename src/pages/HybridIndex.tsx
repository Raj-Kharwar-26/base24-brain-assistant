
import React, { useState } from 'react';
import { Upload, MessageCircle, FileText, Search, Brain, Zap, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HybridDocumentUpload from '@/components/HybridDocumentUpload';
import HybridChatInterface from '@/components/HybridChatInterface';

const HybridIndex = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Base24 Brain Local</h1>
                <p className="text-sm text-slate-400">Open Source AI-Powered Documentation Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-green-400">
                <Cpu className="h-4 w-4" />
                <span className="text-sm">100% Local • Private</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Your Private BASE24 Knowledge Assistant
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Upload your BASE24 documentation and chat with local AI models. All processing happens on your machine - 
            no data leaves your computer. Uses HuggingFace Transformers + Ollama.
          </p>
        </div>

        {/* Main Interface */}
        <Card className="bg-slate-800/50 border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>AI Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Docs</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-6">
              <HybridChatInterface />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-6">
              <HybridDocumentUpload />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Technology Stack */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Cpu className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Browser Embeddings</h3>
            <p className="text-slate-400">HuggingFace Transformers running locally in your browser for document processing.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Local Vector Store</h3>
            <p className="text-slate-400">Fast semantic search using cosine similarity, stored in browser localStorage.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Ollama Integration</h3>
            <p className="text-slate-400">Connect to local Llama, Mistral, or other open-source models via Ollama.</p>
          </div>
        </div>

        {/* Setup Instructions */}
        <Card className="mt-8 bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Setup Instructions</h3>
            <div className="space-y-4 text-slate-300">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Install Ollama</p>
                  <p className="text-slate-400 text-sm">
                    Download from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">ollama.ai</a> and run <code className="bg-slate-700 px-1 rounded">ollama serve</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Download a Model</p>
                  <p className="text-slate-400 text-sm">
                    Run <code className="bg-slate-700 px-1 rounded">ollama pull llama2</code> or <code className="bg-slate-700 px-1 rounded">ollama pull mistral</code>
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Upload Documents & Chat</p>
                  <p className="text-slate-400 text-sm">
                    Upload your BASE24 docs, then chat with your local AI assistant!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HybridIndex;
