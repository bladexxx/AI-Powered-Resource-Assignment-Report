import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StructuredData, Project, Task, Person } from '../types';
import { ProjectIcon, TaskIcon, PeopleIcon, DownloadIcon } from './IconComponents';
import { PrintableResourceTree } from './PrintableResourceTree';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TaskWithPeople extends Task {
  people: Person[];
}
interface ProjectWithTasks extends Project {
  tasks: TaskWithPeople[];
}

const Node: React.FC<{
  item: ProjectWithTasks | TaskWithPeople | Person;
  level: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
}> = ({ item, level, isExpanded, onToggle, children }) => {
  const getIcon = () => {
    if ('projectId' in item) return <TaskIcon className="w-5 h-5 text-gray-300" />;
    if ('tasks' in item) return <ProjectIcon className="w-5 h-5 text-cyan-400" />;
    return <PeopleIcon className="w-5 h-5 text-blue-400" />;
  };

  const hasChildren = 'tasks' in item || ('people' in item && item.people.length > 0);

  const content = (
    <div className="flex items-center gap-3">
      {getIcon()}
      <span className={`font-medium ${level === 0 ? 'text-lg text-cyan-300' : ''}`}>{item.name}</span>
    </div>
  );

  return (
    <li className="relative">
      <div className="absolute left-[-2rem] top-0 h-full">
          <div className="h-full w-px bg-gray-700"></div>
          <div className="absolute top-[1.1rem] h-px w-4 bg-gray-700"></div>
      </div>

      <div className="flex items-center">
        {hasChildren ? (
          <button onClick={onToggle} className="flex items-center gap-3 w-full text-left p-2 rounded-md hover:bg-gray-700/50 transition-colors">
            <svg className={`w-4 h-4 text-gray-500 transition-transform transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            {content}
          </button>
        ) : (
          <div className="flex items-center gap-3 p-2 ml-7">{content}</div>
        )}
      </div>

      {isExpanded && hasChildren && <ul className="pl-8">{children}</ul>}
    </li>
  );
};


export const Dashboard: React.FC<{ data: StructuredData }> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    data.projects.forEach(p => initialState[p.id] = true); // Default to expanded
    return initialState;
  });

  const treeData = useMemo<ProjectWithTasks[]>(() => {
    return data.projects.map(project => {
      const projectTasks = data.tasks
        .filter(task => task.projectId === project.id)
        .map(task => {
          const assignedPeople = data.assignments
            .filter(a => a.taskId === task.id)
            .map(a => data.people.find(p => p.id === a.personId))
            .filter((p): p is Person => p !== undefined);
          return { ...task, people: assignedPeople };
        });
      return { ...project, tasks: projectTasks };
    });
  }, [data]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1200px';
    document.body.appendChild(tempContainer);
    
    const root = ReactDOM.createRoot(tempContainer);
    root.render(<PrintableResourceTree treeData={treeData} />);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const canvas = await html2canvas(tempContainer, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps= pdf.getImageProperties(imgData);
      const ratio = imgProps.height / imgProps.width;
      let imgHeight = pdfWidth * ratio;
      let y = 0;
      if (imgHeight > pdfHeight) {
          imgHeight = pdfHeight; // if image is too high, cap it.
          // This case is not fully handled (multi-page), but will prevent distortion.
      } else {
        y = (pdfHeight - imgHeight) / 2; // Center vertically
      }

      pdf.addImage(imgData, 'PNG', 0, y, pdfWidth, imgHeight);
      pdf.save('resource-assignment-report.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      root.unmount();
      document.body.removeChild(tempContainer);
      setIsExporting(false);
    }
  };
  
  const toggleProject = (projectId: string) => {
      setExpandedProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h3 className="text-xl font-semibold text-cyan-300">Resource Assignment Structure</h3>
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-md transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <DownloadIcon />
          {isExporting ? 'Exporting...' : 'Export as PDF'}
        </button>
      </div>

      <div className="pl-8">
        <ul className="space-y-2">
            {treeData.map(project => (
                <Node
                    key={project.id}
                    item={project}
                    level={0}
                    isExpanded={!!expandedProjects[project.id]}
                    onToggle={() => toggleProject(project.id)}
                >
                    {project.tasks.map(task => (
                        <Node key={task.id} item={task} level={1} isExpanded={true}>
                            {task.people.map(person => (
                                <Node key={person.id} item={person} level={2} />
                            ))}
                        </Node>
                    ))}
                </Node>
            ))}
        </ul>
      </div>
    </div>
  );
};
