import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StructuredData, Project, Task, Person } from '../types';
import { ProjectIcon, TaskIcon, PeopleIcon, DownloadIcon, ImageIcon } from './IconComponents';
import { PrintableProjectView } from './PrintableProjectView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TaskWithPeople extends Task {
  people: Person[];
}
interface ProjectWithTasks extends Project {
  tasks: TaskWithPeople[];
}

const SMALL_PROJECT_TASK_THRESHOLD = 2;

const ChartNode: React.FC<{
  item: ProjectWithTasks | TaskWithPeople | Person;
  children?: React.ReactNode;
}> = ({ item, children }) => {
  const getIcon = () => {
    if ('projectId' in item) return <TaskIcon className="w-5 h-5 text-blue-300" />;
    if ('tasks' in item) return <ProjectIcon className="w-5 h-5 text-cyan-300" />;
    return <PeopleIcon className="w-5 h-5 text-gray-300" />;
  };

  const hasChildren = ('tasks' in item && item.tasks.length > 0) || ('people' in item && item.people.length > 0);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Node Card */}
      <div className="bg-gray-700 p-2 rounded-lg shadow-lg min-w-[140px] z-10">
        <div className="flex items-center justify-center gap-2">
          {getIcon()}
          <span className="font-medium text-sm">{item.name}</span>
        </div>
      </div>
      {/* Children Container */}
      {hasChildren && (
        <div className="mt-6 relative">
          {/* Vertical line from parent */}
          <div className="absolute top-[-1.5rem] left-1/2 w-0.5 h-6 bg-gray-600"></div>
          <div className="flex gap-x-6 gap-y-10 flex-wrap justify-center">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

const ChartBranch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Vertical line from horizontal connector to node */}
      <div className="absolute top-[-1.5rem] left-1/2 w-0.5 h-6 bg-gray-600"></div>
      {/* Horizontal connector line */}
      <div className="absolute top-[-1.5rem] left-0 right-0 h-0.5 bg-gray-600"></div>
      {children}
    </div>
  );
}

const ProjectChart: React.FC<{ project: ProjectWithTasks }> = ({ project }) => (
    <ChartNode item={project}>
        {project.tasks.map(task => (
        <ChartBranch key={task.id}>
            <ChartNode item={task}>
            {task.people.map(person => (
                <ChartBranch key={person.id}>
                <ChartNode item={person} />
                </ChartBranch>
            ))}
            </ChartNode>
        </ChartBranch>
        ))}
    </ChartNode>
);

export const ProjectView: React.FC<{ data: StructuredData }> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);

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

  const { largeProjects, smallProjects } = useMemo(() => {
    const large: ProjectWithTasks[] = [];
    const small: ProjectWithTasks[] = [];
    treeData.forEach(p => {
        if (p.tasks.length > SMALL_PROJECT_TASK_THRESHOLD) {
            large.push(p);
        } else {
            small.push(p);
        }
    });
    return { largeProjects: large, smallProjects: small };
  }, [treeData]);

  const captureChart = async (): Promise<HTMLCanvasElement | null> => {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1920px';
    document.body.appendChild(tempContainer);
    
    const root = ReactDOM.createRoot(tempContainer);
    root.render(<PrintableProjectView treeData={treeData} />);

    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const chartElement = tempContainer.querySelector('#printable-chart');
      if (!chartElement) throw new Error("Could not find chart element for capturing.");

      return await html2canvas(chartElement as HTMLElement, { scale: 2, backgroundColor: '#ffffff' });
    } finally {
      root.unmount();
      document.body.removeChild(tempContainer);
    }
  };

  const handleSaveImage = async () => {
    setIsSavingImage(true);
    try {
      const canvas = await captureChart();
      if(canvas) {
        const imageURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imageURL;
        link.download = 'resource-report-project-view.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating image:", error);
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await captureChart();
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        
        const imgWidth = pdfWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight);
        pdf.save('resource-report-project-view.pdf');
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
        <h3 className="text-xl font-semibold text-cyan-300">Resource Assignment: Project View</h3>
        <div className="flex items-center gap-2">
            <button
              onClick={handleSaveImage}
              disabled={isSavingImage || isExporting}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-md transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon />
              {isSavingImage ? 'Saving...' : 'Save as Image'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting || isSavingImage}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-md transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadIcon />
              {isExporting ? 'Exporting...' : 'Export as PDF'}
            </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="flex flex-col gap-12 items-center">
            {largeProjects.map(project => (
                <ProjectChart key={project.id} project={project} />
            ))}
             {smallProjects.length > 0 && (
                <div className="w-full border-2 border-dashed border-gray-600 rounded-xl p-6 mt-4">
                    <h4 className="text-lg font-semibold text-center mb-10 text-gray-400">Small Projects</h4>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-16">
                        {smallProjects.map(project => (
                            <ProjectChart key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};