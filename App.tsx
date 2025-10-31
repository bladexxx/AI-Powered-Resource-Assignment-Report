import React, { useState, useCallback } from 'react';
import { StructuredData } from './types';
import { processDataWithGemini } from './services/geminiService';
import { DataInput } from './components/DataInput';
import { ProjectView } from './components/ProjectView';
import { OrganizationView } from './components/OrganizationView';
import { TaskView } from './components/TaskView';
import { Loader } from './components/Loader';
import { ProjectIcon, OrgIcon, TaskIcon } from './components/IconComponents';

type ViewType = 'project' | 'organization' | 'task';

const App: React.FC = () => {
  const [structuredData, setStructuredData] = useState<StructuredData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('project');

  const handleProcessData = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError("Input data cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setStructuredData(null);
    try {
      const data = await processDataWithGemini(text);
      setStructuredData(data);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleReset = () => {
    setStructuredData(null);
    setError(null);
    setIsLoading(false);
    setActiveView('project');
  };

  const handleUpdateData = useCallback((newData: StructuredData) => {
    setStructuredData(newData);
  }, []);

  const TabButton: React.FC<{
    viewType: ViewType;
    label: string;
    icon: React.ReactNode;
  }> = ({ viewType, label, icon }) => (
    <button
      onClick={() => setActiveView(viewType)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeView === viewType
          ? 'bg-cyan-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            AI Resource Assignment Report
          </h1>
          {structuredData && (
             <button
              onClick={handleReset}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-300 shadow-lg"
            >
              Start Over
            </button>
          )}
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        {!structuredData && !isLoading && (
          <DataInput onProcess={handleProcessData} error={error} setError={setError} />
        )}

        {isLoading && <Loader />}
        
        {error && !isLoading && !structuredData && (
             <div className="mt-4 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
                <p><strong>Error:</strong> {error}</p>
             </div>
        )}

        {structuredData && !isLoading && (
          <div>
            <div className="mb-6 p-2 bg-gray-800 rounded-lg inline-flex items-center gap-2 border border-gray-700">
                <TabButton viewType="project" label="View by Project" icon={<ProjectIcon className="w-5 h-5" />} />
                <TabButton viewType="organization" label="View by Organization" icon={<OrgIcon className="w-5 h-5" />} />
                <TabButton viewType="task" label="View by Tasks" icon={<TaskIcon className="w-5 h-5" />} />
            </div>
            
            {activeView === 'project' && <ProjectView data={structuredData} />}
            {activeView === 'organization' && <OrganizationView data={structuredData} />}
            {activeView === 'task' && <TaskView data={structuredData} onUpdate={handleUpdateData} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;