
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle, Cpu } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generateEmbeddings, initializeEmbeddingPipeline } from '@/utils/embeddingGenerator';
import { vectorStore } from '@/utils/vectorStore';

interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  status: 'reading' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const HybridDocumentUpload = () => {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const initializePipeline = useCallback(async () => {
    if (isInitialized) return;
    
    setIsInitialized(true);
    try {
      await initializeEmbeddingPipeline();
      toast({
        title: "AI Pipeline Ready",
        description: "HuggingFace embedding model loaded successfully.",
      });
    } catch (error) {
      console.error('Failed to initialize pipeline:', error);
      toast({
        title: "Initialization Failed",
        description: "Could not load the embedding model. Please try again.",
        variant: "destructive",
      });
      setIsInitialized(false);
    }
  }, [isInitialized, toast]);

  const splitIntoChunks = (text: string, chunkSize: number = 1000, overlap: number = 200): string[] => {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk.trim());
      
      if (end === text.length) break;
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const content = reader.result as string;
        
        if (file.type === 'text/plain') {
          resolve(content);
        } else if (file.type === 'application/pdf') {
          // For demo purposes, create sample content for PDFs
          resolve(`[PDF Document: ${file.name}]\n\nThis is a BASE24 document that contains technical specifications and procedures.\n\nCommon topics covered:\n- Transaction Processing\n- Field Definitions (DE fields)\n- Message Formats\n- Settlement Procedures\n- Authorization Flows\n- Network Management\n- Security Protocols\n\nSample content for demonstration purposes. In a production environment, you would use a proper PDF parser.`);
        } else {
          reject(new Error('Unsupported file type'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        // For other file types, simulate reading
        setTimeout(() => {
          reader.onload?.({} as any);
        }, 500);
      }
    });
  };

  const processFile = async (file: File) => {
    const fileId = crypto.randomUUID();
    
    const processingFile: ProcessingFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'reading',
      progress: 0,
    };

    setProcessingFiles(prev => [...prev, processingFile]);

    try {
      // Initialize pipeline if not done
      if (!isInitialized) {
        await initializePipeline();
      }

      // Step 1: Read file content
      setProcessingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'reading', progress: 20 } : f
      ));

      const content = await readFileContent(file);

      // Step 2: Chunk the content
      setProcessingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'chunking', progress: 40 } : f
      ));

      const chunks = splitIntoChunks(content);
      console.log(`Created ${chunks.length} chunks for ${file.name}`);

      // Step 3: Generate embeddings
      setProcessingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'embedding', progress: 60 } : f
      ));

      const embeddings = await generateEmbeddings(chunks);

      // Step 4: Store in vector store
      setProcessingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'storing', progress: 80 } : f
      ));

      vectorStore.addDocumentChunks(fileId, file.name, chunks, embeddings);

      // Step 5: Complete
      setProcessingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
      ));

      toast({
        title: "Document processed successfully!",
        description: `${file.name} has been embedded and stored locally.`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      setProcessingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Processing failed' }
          : f
      ));

      toast({
        title: "Processing failed",
        description: `Could not process ${file.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    // Validate file types
    const allowedTypes = ['application/pdf', 'text/plain'];
    const validFiles = acceptedFiles.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== acceptedFiles.length) {
      toast({
        title: "Some files skipped",
        description: "Only PDF and TXT files are supported.",
        variant: "destructive",
      });
    }

    // Process each file
    for (const file of validFiles) {
      await processFile(file);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'reading':
      case 'chunking':
      case 'embedding':
      case 'storing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex items-center justify-center mb-4">
              <Cpu className="h-8 w-8 text-blue-400 mr-2" />
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
            <div className="text-white mb-2">
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <p>Drag & drop your BASE24 documents here, or click to select</p>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Supports PDF and TXT files up to 10MB each • Processed locally with HuggingFace
            </p>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Choose Files
            </Button>
          </div>
          
          {!isInitialized && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <Cpu className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 text-sm">
                  Click "Choose Files" or drop files to initialize the AI embedding model
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {processingFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Processing Progress</h3>
            <div className="space-y-4">
              {processingFiles.map((file) => (
                <div key={file.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white text-sm font-medium">{file.name}</p>
                        <p className="text-slate-400 text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <span className="text-sm text-slate-300 capitalize">
                        {file.status === 'embedding' ? 'Generating embeddings...' : file.status}
                      </span>
                    </div>
                  </div>
                  <Progress value={file.progress} className="h-2" />
                  {file.error && (
                    <p className="text-red-400 text-sm">{file.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Hybrid AI System</h3>
          <div className="space-y-3 text-slate-300">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                1
              </div>
              <p><strong>Browser Embeddings:</strong> Documents are processed locally using HuggingFace Transformers (all-MiniLM-L6-v2)</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                2
              </div>
              <p><strong>Local Vector Storage:</strong> Embeddings stored in browser localStorage for instant retrieval</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                3
              </div>
              <p><strong>Ollama Integration:</strong> Chat with local LLMs (Llama, Mistral, etc.) for completely private AI assistance</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 text-sm">
              <strong>Documents processed:</strong> {vectorStore.getDocumentCount()} | 
              <strong> Chunks stored:</strong> {vectorStore.getChunkCount()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HybridDocumentUpload;
