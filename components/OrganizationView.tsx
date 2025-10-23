import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StructuredData, Project, Person, Team, Task } from '../types';
import { TeamIcon, PeopleIcon, ProjectIcon, DownloadIcon, ImageIcon } from './IconComponents';
import { PrintableOrganizationView } from './PrintableOrganizationView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PersonWithProjects extends Person {
    projects: Project[];
}
interface TeamWithMembers extends Team {
    members: PersonWithProjects[];
}

const ChartNode: React.FC<{
  item: TeamWithMembers | PersonWithProjects | Project;
  children?: React.ReactNode;
}> = ({ item, children }) => {
    const getIcon = () => {
        if ('members' in item) return <TeamIcon className="w-5 h-5 text-cyan-300" />;
        if ('projects' in item) return <PeopleIcon className="w-5 h-5 text-blue-300" />;
        return <ProjectIcon className="w-5 h-5 text-gray-300" />;
    };
  
    const hasChildren = ('members' in item && item.members.length > 0) || ('projects' in item && item.projects.length > 0);

    return (
        <div className="flex flex-col items-center text-center">
          <div className="bg-gray-700 p-2 rounded-lg shadow-lg min-w-[140px] z-10">
            <div className="flex items-center justify-center gap-2">
              {getIcon()}
              <span className="font-medium text-sm">{item.name}</span>
            </div>
          </div>
          {hasChildren && (
            <div className="mt-6 relative">
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
        <div className="absolute top-[-1.5rem] left-1/2 w-0.5 h-6 bg-gray-600"></div>
        <div className="absolute top-[-1.5rem] left-0 right-0 h-0.5 bg-gray-600"></div>
        {children}
      </div>
    );
}

const OrganizationChart: React.FC<{ treeData: TeamWithMembers[] }> = ({ treeData }) => (
    <div className="flex justify-center">
        <div className="flex flex-col gap-12 items-center">
            {treeData.map(team => (
                <ChartNode key={team.id} item={team}>
                    {team.members.map(person => (
                        <ChartBranch key={person.id}>
                            <ChartNode item={person}>
                                {person.projects.map(project => (
                                    <ChartBranch key={project.id}>
                                        <ChartNode item={project} />
                                    </ChartBranch>
                                ))}
                            </ChartNode>
                        </ChartBranch>
                    ))}
                </ChartNode>
            ))}
        </div>
    </div>
);
  
export const OrganizationView: React.FC<{ data: StructuredData }> = ({ data }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isSavingImage, setIsSavingImage] = useState(false);

    const treeData = useMemo<TeamWithMembers[]>(() => {
        return data.teams.map(team => {
            const members = data.people
                .filter(person => person.teamId === team.id)
                .map(person => {
                    const personAssignments = data.assignments.filter(a => a.personId === person.id);
                    const projectIds = new Set<string>();
                    personAssignments.forEach(pa => {
                        const task = data.tasks.find(t => t.id === pa.taskId);
                        if (task) {
                            projectIds.add(task.projectId);
                        }
                    });

                    const projects = Array.from(projectIds)
                        .map(projectId => data.projects.find(p => p.id === projectId)!)
                        .filter(p => p)
                        .sort((a,b) => a.name.localeCompare(b.name));
                    
                    return { ...person, projects };
                }).sort((a,b) => a.name.localeCompare(b.name));
            return { ...team, members };
        }).sort((a,b) => a.name.localeCompare(b.name));
    }, [data]);
    
     const captureChart = async (): Promise<HTMLCanvasElement | null> => {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1920px'; 
        document.body.appendChild(tempContainer);
        
        const root = ReactDOM.createRoot(tempContainer);
        root.render(<PrintableOrganizationView treeData={treeData} />);
    
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
            if (canvas) {
                const imageURL = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = imageURL;
                link.download = 'resource-report-organization-view.png';
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
                pdf.save('resource-report-organization-view.pdf');
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
                <h3 className="text-xl font-semibold text-cyan-300">Resource Assignment: Organization View</h3>
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
                <OrganizationChart treeData={treeData} />
            </div>
        </div>
    );
};