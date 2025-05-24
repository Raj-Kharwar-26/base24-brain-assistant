
import React, { useState } from 'react';
import { Upload, MessageCircle, FileText, Search, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocuments } from '@/contexts/DocumentContext';
import DocumentUpload from '@/components/DocumentUpload';
import ChatInterface from '@/components/ChatInterface';
import DocumentLibrary from '@/components/DocumentLibrary';

const Index = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const { documents } = useDocuments();

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
                {documents.length} documents indexed
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
            Upload your BASE24 documentation once, then ask questions in natural language. 
            Get instant, accurate answers from your entire document library.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Documents</CardTitle>
              <FileText className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{documents.length}</div>
              <p className="text-xs text-slate-400">Total uploaded</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Questions Asked</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-slate-400">This session</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">AI Status</CardTitle>
              <Brain className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">Ready</div>
              <p className="text-xs text-slate-400">AI assistant online</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Interface */}
        <Card className="bg-slate-800/50 border-slate-700">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-700/50">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Ask Questions</span>
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
              <ChatInterface />
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
            <h3 className="text-lg font-semibold text-white mb-2">Easy Upload</h3>
            <p className="text-slate-400">Support for PDF, DOCX, and TXT files. Drag and drop or browse to upload.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
            <p className="text-slate-400">Advanced AI understands your BASE24 documentation and provides accurate answers.</p>
          </div>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <Search className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Search</h3>
            <p className="text-slate-400">Find information instantly across all your documents with semantic search.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
