import React, { useState, useRef } from 'react';
import { parseExcelToString } from '../services/excelParser';
import { FileIcon, UploadIcon } from './IconComponents';

interface DataInputProps {
  onProcess: (text: string) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const defaultExample = `
Team: Engineering - Members: Alice, Bob
Team: Design - Members: Carol

Project: New Website - Tasks: UI/UX Design, Backend Development, Frontend Development
Project: Mobile App - Tasks: iOS App, Android App

Assignments:
- Carol is assigned to UI/UX Design.
- Alice is assigned to Backend Development and iOS App.
- Bob is assigned to Frontend Development and Android App.
- Bob is also assigned to UI/UX Design.
`.trim();


export const DataInput: React.FC<DataInputProps> = ({ onProcess, error, setError }) => {
  const [text, setText] = useState<string>(defaultExample);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      try {
        const fileContent = await parseExcelToString(file);
        setText(fileContent);
      } catch (e: any) {
        setError(e.message || "Failed to parse Excel file.");
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleSubmit = () => {
    onProcess(text);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-cyan-300">Enter Resource Data</h2>
      <p className="text-gray-400 mb-4">
        You can either type in your data directly or upload an Excel file. Use the example below as a guide for the format.
      </p>
      
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-64 p-4 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
        placeholder="Enter your teams, projects, tasks, and assignments here..."
      />
      
      <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto flex-grow px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-md transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          Generate Report
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".xlsx, .xls, .csv"
        />
        <button
          onClick={handleUploadClick}
          className="w-full sm:w-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-md transition-colors duration-300 flex items-center justify-center gap-2"
        >
          <UploadIcon />
          Import Excel
        </button>
      </div>

    </div>
  );
};