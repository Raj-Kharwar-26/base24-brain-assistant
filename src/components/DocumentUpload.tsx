import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

const DocumentUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();
  const { session, user } = useAuth();

  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    if (!session || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      status: 'uploading',
      progress: 0,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (const file of acceptedFiles) {
      const fileId = newFiles.find(f => f.name === file.name)?.id;
      if (!fileId) continue;

      try {
        await uploadToSupabase(file, fileId);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : f
        ));
      }
    }
  }, [session, user, toast]);

  const uploadToSupabase = async (file: File, fileId: string) => {
    if (!session?.access_token) {
      throw new Error('No valid session token');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload PDF, TXT, DOC, or DOCX files.');
    }

    try {
      // Update status to uploading
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 25 } : f
      ));

      // For PDF files, we'll send the file as base64
      let content: string;
      if (file.type === 'application/pdf') {
        content = await fileToBase64(file);
      } else {
        content = await readFileAsText(file);
      }
      
      // Update progress
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 50 } : f
      ));

      // Update status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 75 } : f
      ));

      // Call the process-document edge function
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: fileId,
          content: content,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          isBase64: file.type === 'application/pdf'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error('Processing error:', error);
        throw new Error(error.message || 'Failed to process document');
      }

      // Update to completed
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
      ));

      toast({
        title: "Document uploaded successfully!",
        description: `${file.name} has been processed and is ready for chat.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:application/pdf;base64,)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (!user) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <Upload className="h-12 w-12 mx-auto mb-4" />
            <p>Please sign in to upload documents.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <div className="text-white mb-2">
              {isDragActive ? (
                <p>Drop the files here...</p>
              ) : (
                <p>Drag & drop your BASE24 documents here, or click to select</p>
              )}
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Supports PDF, TXT, DOC, DOCX files up to 10MB each
            </p>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload Progress</h3>
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
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
                      {file.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                      )}
                      {file.status === 'processing' && (
                        <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                      )}
                      {file.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                      {file.status === 'error' && (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className="text-sm text-slate-300 capitalize">
                        {file.status}
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

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
          <div className="space-y-2 text-slate-300">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                1
              </div>
              <p>Upload your BASE24 documentation files (PDF, TXT, DOC, DOCX)</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                2
              </div>
              <p>Documents are processed and chunked for optimal AI retrieval</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mt-0.5">
                3
              </div>
              <p>Ask questions in the AI Assistant tab and get context-aware answers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentUpload;
