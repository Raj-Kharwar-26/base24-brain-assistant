
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ProcessedDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'indexed' | 'processing' | 'error';
  pageCount?: number;
  category: 'manual' | 'specification' | 'guide' | 'reference';
  content: string;
}

interface DocumentContextType {
  documents: ProcessedDocument[];
  addDocument: (document: ProcessedDocument) => void;
  removeDocument: (id: string) => void;
  searchDocuments: (query: string) => { document: ProcessedDocument; excerpt: string }[];
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);

  const addDocument = (document: ProcessedDocument) => {
    setDocuments(prev => [...prev, document]);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const searchDocuments = (query: string) => {
    if (!query.trim()) return [];
    
    const results: { document: ProcessedDocument; excerpt: string }[] = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    documents.forEach(doc => {
      if (doc.status !== 'indexed') return;
      
      const content = doc.content.toLowerCase();
      const hasMatch = searchTerms.some(term => content.includes(term));
      
      if (hasMatch) {
        // Find relevant excerpt
        const sentences = doc.content.split('. ');
        const relevantSentence = sentences.find(sentence => 
          searchTerms.some(term => sentence.toLowerCase().includes(term))
        );
        
        const excerpt = relevantSentence 
          ? relevantSentence.substring(0, 200) + (relevantSentence.length > 200 ? '...' : '')
          : doc.content.substring(0, 200) + '...';
          
        results.push({ document: doc, excerpt });
      }
    });
    
    return results;
  };

  return (
    <DocumentContext.Provider value={{ documents, addDocument, removeDocument, searchDocuments }}>
      {children}
    </DocumentContext.Provider>
  );
};
