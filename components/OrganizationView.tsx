import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { StructuredData, Project, Person, Team } from '../types';
import { TeamIcon, PeopleIcon, ProjectIcon, DownloadIcon, ImageIcon } from './IconComponents';
import { PrintableOrganizationView } from './PrintableOrganizationView';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- TYPE DEFINITIONS ---
type PersonWithProjects = Person & { projects: Project[] };
type TeamWithMembers = Team & { leader?: PersonWithProjects; members: PersonWithProjects[] };
type ManagerWithTeams = {
    manager: PersonWithProjects;
    teams: TeamWithMembers[];
};

// --- CHART NODE COMPONENTS ---
const ChartNode: React.FC<{
  item: TeamWithMembers | PersonWithProjects | Project;
  children?: React.ReactNode;
}> = ({ item, children }) => {
    const getIcon = () => {
        if ('leader' in item) return <TeamIcon className="w-5 h-5 text-cyan-300" />;
        if ('teamIds' in item) return <PeopleIcon className="w-5 h-5 text-blue-300" />;
        return <ProjectIcon className="w-5 h-5 text-gray-300" />;
    };
  
    const hasChildren = React.Children.count(children) > 0;

    const roleText = 'role' in item && item.role ? `(${item.role})` : '';

    return (
        <div className="flex flex-col items-center text-center">
          <div className="bg-gray-700 p-2 rounded-lg shadow-lg min-w-[140px] z-10">
            <div className="flex items-center justify-center gap-2">
              {getIcon()}
              <div className="flex flex-col items-center">
                 <span className="font-medium text-sm">{item.name}</span>
                 {roleText && <span className="text-xs text-gray-400">{roleText}</span>}
              </div>
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

const PersonBranch: React.FC<{ person: PersonWithProjects; children?: React.ReactNode }> = ({ person, children }) => {
    const hasProjects = person.projects.length > 0;
    const hasChildren = React.Children.count(children) > 0;
    const roleText = person.role ? `(${person.role})` : '';
  
    return (
      <ChartBranch>
        <div className="flex flex-col items-center text-center">
          {/* Person Node Card */}
          <div className="bg-gray-700 p-2 rounded-lg shadow-lg min-w-[140px] z-10">
            <div className="flex items-center justify-center gap-2">
              <PeopleIcon className="w-5 h-5 text-blue-300" />
              <div className="flex flex-col items-center">
                <span className="font-medium text-sm">{person.name}</span>
                {roleText && <span className="text-xs text-gray-400">{roleText}</span>}
              </div>
            </div>
          </div>
          
          {/* Container for children (other people) OR projects */}
          {(hasChildren || hasProjects) && (
            <div className="mt-6 relative">
              <div className="absolute top-[-1.5rem] left-1/2 w-0.5 h-6 bg-gray-600"></div>
              
              {hasChildren ? (
                // If there are children (members), render them horizontally
                <div className="flex gap-x-6 gap-y-10 flex-wrap justify-center">
                    {children}
                </div>
              ) : (
                // Otherwise, render projects vertically
                <div className="flex flex-col items-center gap-y-10">
                  {person.projects.map(project => (
                    <div key={project.id} className="relative flex flex-col items-center">
                      <div className="absolute top-[-1.5rem] left-1/2 w-0.5 h-6 bg-gray-600"></div>
                      <div className="bg-gray-700 p-2 rounded-lg shadow-lg min-w-[140px] z-10">
                        <div className="flex items-center justify-center gap-2">
                          <ProjectIcon className="w-5 h-5 text-gray-300" />
                          <span className="font-medium text-sm">{project.name}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ChartBranch>
    );
  };

const OrganizationChart: React.FC<{ treeData: ManagerWithTeams[] }> = ({ treeData }) => (
    <div className="flex justify-center">
        <div className="flex flex-col gap-12 items-center">
            {treeData.map(({ manager, teams }) => (
                <ChartNode key={manager.id} item={manager}>
                    {teams.map(team => (
                        <ChartBranch key={team.id}>
                            <ChartNode item={team}>
                                {team.leader ? (
                                    <PersonBranch key={team.leader.id} person={team.leader}>
                                        {team.members.map(member => (
                                            <PersonBranch key={`${team.id}-${member.id}`} person={member} />
                                        ))}
                                    </PersonBranch>
                                ) : (
                                    team.members.map(member => (
                                        <PersonBranch key={`${team.id}-${member.id}`} person={member} />
                                    ))
                                )}
                            </ChartNode>
                        </ChartBranch>
                    ))}
                </ChartNode>
            ))}
        </div>
    </div>
);
  
// --- MAIN COMPONENT ---
export const OrganizationView: React.FC<{ data: StructuredData }> = ({ data }) => {
    const [isExporting, setIsExporting] = useState(false);
    const [isSavingImage, setIsSavingImage] = useState(false);

    const hierarchyData = useMemo<ManagerWithTeams[]>(() => {
        // 1. Augment people with their projects
        const peopleWithProjects = new Map<string, PersonWithProjects>();
        data.people.forEach(person => {
            const projectIds = new Set<string>();
            data.assignments
                .filter(a => a.personId === person.id)
                .forEach(a => {
                    const task = data.tasks.find(t => t.id === a.taskId);
                    if (task) projectIds.add(task.projectId);
                });
            const projects = Array.from(projectIds)
                .map(id => data.projects.find(p => p.id === id)!)
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name));
            peopleWithProjects.set(person.id, { ...person, projects });
        });
    
        // 2. Structure teams with members (leader first)
        const teamsWithMembers = data.teams.map(team => {
            const leader = team.leaderId ? peopleWithProjects.get(team.leaderId) : undefined;
            const members = data.people
                .filter(p => p.teamIds.includes(team.id) && p.id !== team.leaderId)
                .map(p => peopleWithProjects.get(p.id)!)
                .filter(Boolean)
                .sort((a, b) => a.name.localeCompare(b.name));
            
            return { ...team, leader, members };
        });
    
        // 3. Identify department managers (no managerId) and build the final hierarchy
        const departmentManagers = data.people
            .filter(p => !p.managerId)
            .map(p => peopleWithProjects.get(p.id)!);
    
        const finalHierarchy = departmentManagers.map(manager => {
            // A team belongs to a manager if its leader reports to them, OR if the manager is the leader.
            const managedTeams = teamsWithMembers.filter(team => 
                team.leader?.managerId === manager.id || team.leader?.id === manager.id
            );
    
            return {
                manager,
                teams: managedTeams.sort((a,b) => a.name.localeCompare(b.name))
            };
        });
    
        return finalHierarchy.sort((a,b) => a.manager.name.localeCompare(b.manager.name));
    }, [data]);
    
     const captureChart = async (): Promise<HTMLCanvasElement | null> => {
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '1920px'; 
        document.body.appendChild(tempContainer);
        
        const root = ReactDOM.createRoot(tempContainer);
        root.render(<PrintableOrganizationView treeData={hierarchyData} />);
    
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
                <OrganizationChart treeData={hierarchyData} />
            </div>
        </div>
    );
};