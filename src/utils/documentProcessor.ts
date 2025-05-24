
export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const text = reader.result as string;
      
      if (file.type === 'text/plain') {
        resolve(text);
      } else if (file.type === 'application/pdf') {
        // Simulate PDF text extraction - in real app, use PDF.js
        resolve(`[PDF Content from ${file.name}]\n\nThis is simulated PDF content extraction. In a real implementation, we would use PDF.js or a backend service to extract actual text from PDF files.\n\nSample BASE24 content:\nDE 35 - Track 2 Data: Contains the magnetic stripe track 2 data from the card.\nDE 39 - Response Code: Indicates the result of the transaction request.\nSettlement Process: The process of transferring funds between financial institutions.`);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Simulate DOCX text extraction - in real app, use mammoth.js
        resolve(`[DOCX Content from ${file.name}]\n\nThis is simulated DOCX content extraction. In a real implementation, we would use mammoth.js or a backend service to extract actual text from DOCX files.\n\nSample BASE24 specifications:\nField 127: Network Management Information\nSubfield 22: Contains additional transaction data\nTransaction Processing: BASE24 processes various transaction types including purchases, withdrawals, and balance inquiries.`);
      } else {
        reject(new Error('Unsupported file type'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      // For binary files, we'll simulate the content
      reader.readAsArrayBuffer(file);
    }
  });
};

export const categorizeDocument = (fileName: string): 'manual' | 'specification' | 'guide' | 'reference' => {
  const name = fileName.toLowerCase();
  
  if (name.includes('manual')) return 'manual';
  if (name.includes('spec') || name.includes('field')) return 'specification';
  if (name.includes('guide') || name.includes('process')) return 'guide';
  return 'reference';
};
