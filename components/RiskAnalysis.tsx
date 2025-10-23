
import React from 'react';

// A simple markdown-to-html renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderContent = () => {
    return content
      .split('\n')
      .map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold mt-5 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-2xl font-extrabold mt-6 mb-3">{line.substring(2)}</h1>;
        }
        if (line.startsWith('* ')) {
          return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={index} />;
        }
        return <p key={index} className="text-gray-300 leading-relaxed">{line}</p>;
      });
  };

  return <div className="prose prose-invert max-w-none">{renderContent()}</div>;
};


interface RiskAnalysisProps {
  analysis: string;
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ analysis }) => {
  return (
    <div className="h-full overflow-y-auto pr-2">
      <div className="text-gray-300 space-y-2">
        <MarkdownRenderer content={analysis} />
      </div>
    </div>
  );
};
