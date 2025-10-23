
import React from 'react';

export const Loader: React.FC = () => (
  <div className="flex flex-col items-center justify-center p-10">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400"></div>
    <p className="mt-4 text-lg text-gray-300">AI is analyzing your data...</p>
  </div>
);
