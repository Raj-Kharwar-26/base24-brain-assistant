
import React, { useState } from 'react';
import { Search, FileText, Calendar, Eye, Trash2, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'indexed' | 'processing' | 'error';
  pageCount?: number;
  category: 'manual' | 'specification' | 'guide' | 'reference';
}

const DocumentLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data - in real app this would come from your backend
  const [documents] = useState<Document[]>([
    {
      id: '1',
      name: 'BASE24 Transaction Processing Guide.pdf',
      type: 'application/pdf',
      size: 2400000,
      uploadDate: new Date('2024-01-15'),
      status: 'indexed',
      pageCount: 156,
      category: 'guide'
    },
    {
      id: '2',
      name: 'DE_Field_Specifications.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 890000,
      uploadDate: new Date('2024-01-20'),
      status: 'indexed',
      pageCount: 45,
      category: 'specification'
    },
    {
      id: '3',
      name: 'Settlement_Process_Manual.pdf',
      type: 'application/pdf',
      size: 1800000,
      uploadDate: new Date('2024-01-22'),
      status: 'indexed',
      pageCount: 89,
      category: 'manual'
    }
  ]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-blue-400" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      manual: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      specification: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      guide: 'bg-green-500/20 text-green-400 border-green-500/30',
      reference: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    };
    return colors[category as keyof typeof colors] || colors.reference;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Indexed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processing</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Error</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
          />
        </div>
        
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
          <TabsList className="bg-slate-700/50">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="manual">Manuals</TabsTrigger>
            <TabsTrigger value="specification">Specs</TabsTrigger>
            <TabsTrigger value="guide">Guides</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Document Grid */}
      {filteredDocuments.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-slate-400 mb-4" />
            <CardTitle className="text-xl text-white mb-2">
              {documents.length === 0 ? 'No documents uploaded yet' : 'No documents found'}
            </CardTitle>
            <CardDescription className="text-center">
              {documents.length === 0 
                ? 'Upload your first BASE24 document to get started.'
                : 'Try adjusting your search terms or filters.'
              }
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(doc.type)}
                    <Badge className={getCategoryColor(doc.category)}>
                      {doc.category}
                    </Badge>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
                <CardTitle className="text-white text-sm font-medium line-clamp-2">
                  {doc.name}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(doc.size)}</span>
                  </div>
                  {doc.pageCount && (
                    <div className="flex justify-between">
                      <span>Pages:</span>
                      <span>{doc.pageCount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span>{doc.uploadDate.toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4 pt-3 border-t border-slate-600">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Library Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">{documents.length}</div>
              <div className="text-sm text-slate-400">Total Documents</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {documents.filter(d => d.status === 'indexed').length}
              </div>
              <div className="text-sm text-slate-400">Indexed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {documents.reduce((sum, doc) => sum + (doc.pageCount || 0), 0)}
              </div>
              <div className="text-sm text-slate-400">Total Pages</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
              </div>
              <div className="text-sm text-slate-400">Total Size</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentLibrary;
