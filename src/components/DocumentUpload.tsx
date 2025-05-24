import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/contexts/DocumentContext';
import { extractTextFromFile, categorizeDocument } from '@/utils/documentProcessor';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
}

const DocumentUpload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const { toast } = useToast();
  const { addDocument } = useDocuments();

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
  }, []);

  const processFiles = (fileList: File[]) => {
    const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    fileList.forEach((file) => {
      if (!supportedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not supported. Please upload PDF, DOCX, or TXT files.`,
          variant: "destructive",
        });
        return;
      }

      const uploadFile: UploadedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0
      };

      setFiles(prev => [...prev, uploadFile]);
      simulateUpload(uploadFile.id, file);
    });
  };

  const simulateUpload = (fileId: string, file: File) => {
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setFiles(prev => prev.map(fileItem => {
        if (fileItem.id === fileId && fileItem.status === 'uploading') {
          const newProgress = Math.min(fileItem.progress + Math.random() * 30, 100);
          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            // Start processing phase
            setTimeout(() => {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f
              ));
              simulateProcessing(fileId, file);
            }, 500);
            return { ...fileItem, progress: 100, status: 'uploading' };
          }
          return { ...fileItem, progress: newProgress };
        }
        return fileItem;
      }));
    }, 200);
  };

  const simulateProcessing = async (fileId: string, file: File) => {
    try {
      // Extract text content
      const content = await extractTextFromFile(file);
      
      // Simulate processing progress
      const processingInterval = setInterval(() => {
        setFiles(prev => prev.map(fileItem => {
          if (fileItem.id === fileId && fileItem.status === 'processing') {
            const newProgress = Math.min(fileItem.progress + Math.random() * 25, 100);
            if (newProgress >= 100) {
              clearInterval(processingInterval);
              
              // Add to document context
              const processedDoc = {
                id: fileId,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadDate: new Date(),
                status: 'indexed' as const,
                pageCount: Math.floor(content.length / 500), // Rough estimate
                category: categorizeDocument(file.name),
                content: content
              };
              
              addDocument(processedDoc);
              
              toast({
                title: "Document processed successfully",
                description: `${file.name} has been indexed and is ready for questions.`,
              });
              
              return { ...fileItem, progress: 100, status: 'completed' };
            }
            return { ...fileItem, progress: newProgress };
          }
          return fileItem;
        }));
      }, 300);
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error' } : f
      ));
      toast({
        title: "Processing failed",
        description: `Failed to process ${file.name}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <FileText className="h-4 w-4 text-blue-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing with AI...';
      case 'completed':
        return 'Ready for questions';
      case 'error':
        return 'Error occurred';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          isDragActive
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Upload className={`h-12 w-12 mb-4 ${isDragActive ? 'text-blue-400' : 'text-slate-400'}`} />
          <CardTitle className="text-xl text-white mb-2">
            {isDragActive ? 'Drop your files here' : 'Upload BASE24 Documents'}
          </CardTitle>
          <CardDescription className="text-center mb-6 max-w-md">
            Upload your PDF, DOCX, or TXT files. The AI will process and index them for intelligent questioning.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose Files
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Supported: PDF, DOCX, TXT files up to 10MB each
          </p>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Processing Files</CardTitle>
            <CardDescription>
              Your documents are being uploaded and processed by AI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="flex-shrink-0">
                  {getStatusIcon(file.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={file.progress} 
                      className="flex-1 h-2"
                    />
                    <span className="text-xs text-slate-400 w-16">
                      {Math.round(file.progress)}%
                    </span>
                  </div>
                  
                  <p className="text-xs text-slate-400 mt-1">
                    {getStatusText(file.status)}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;
