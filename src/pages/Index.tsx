
import React, { useState } from 'react';
import { Upload, MessageCircle, FileText, Search, Brain, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import DocumentUpload from '@/components/DocumentUpload';
import RealChatInterface from '@/components/RealChatInterface';
import DocumentLibrary from '@/components/DocumentLibrary';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const { user } = useAuth();

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
                <h1 className="text-xl font-bold text-white">Base24 Brain</h1>
                <p className="text-sm text-slate-400">AI-Powered Documentation Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-300">
                Welcome, {user?.email}
              </div>
              <div className="flex items-center space-x-1 text-green-400">
                <Zap className="h-4 w-4" />
                <span className="text-sm">Ready</span>
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
            Your BASE24 Knowledge Assistant
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Upload your BASE24 documentation, and I'll provide intelligent, context-aware answers 
            using advanced AI and vector search technology.
          </p>
        </div>

        {/* Main Interface */}
        <Card className="bg-slate-800/50 border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>AI Assistant</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Upload Docs</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Document Library</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="mt-6">
              <RealChatInterface />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-6">
              <DocumentUpload />
            </TabsContent>
            
            <TabsContent value="library" className="mt-6">
              <DocumentLibrary />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <Upload className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Processing</h3>
            <p className="text-slate-400">Documents are automatically chunked and embedded for optimal AI retrieval.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Vector Search</h3>
            <p className="text-slate-400">Advanced semantic search finds the most relevant content for your questions.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Context-Aware AI</h3>
            <p className="text-slate-400">Get precise answers with source citations from your uploaded documents.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
