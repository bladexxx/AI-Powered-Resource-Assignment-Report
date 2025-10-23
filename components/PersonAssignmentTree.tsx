import React, { useMemo, useState, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { StructuredData, Person, Project, Task } from '../types';
import { ProjectIcon, TaskIcon, PeopleIcon, DownloadIcon } from './IconComponents';
import { PrintablePersonAssignmentTree } from './PrintablePersonAssignmentTree';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


interface PersonAssignmentTreeProps {
  data: StructuredData;
}

interface PersonAssignments {
  person: Person;
  projects: {
    project: Project;
    tasks: Task[];
  }[];
}

const PersonNode: React.FC<{ personAssignments: PersonAssignments }> = ({ personAssignments }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { person, projects } = personAssignments;

    return (
        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between text-left focus:outline-none"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <PeopleIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-lg text-gray-200">{person.name}</span>
                </div>
                 <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="mt-4 pl-4 border-l-2 border-gray-600 space-y-3">
                    {projects.length > 0 ? projects.map(({ project, tasks }) => (
                        <div key={project.id}>
                            <div className="flex items-center gap-2 text-cyan-400">
                                <ProjectIcon className="w-4 h-4" />
                                <h4 className="font-medium">{project.name}</h4>
                            </div>
                            <ul className="mt-2 pl-6 space-y-1">
                                {tasks.map(task => (
                                    <li key={task.id} className="flex items-center gap-2 text-gray-300">
                                        <TaskIcon className="w-4 h-4" />
                                        <span>{task.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )) : (
                        <p className="text-gray-400 pl-2">No assignments found.</p>
                    )}
                </div>
            )}
        </div>
    )
}


export const PersonAssignmentTree: React.FC<PersonAssignmentTreeProps> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);
  
  const personAssignmentsData = useMemo<PersonAssignments[]>(() => {
    const assignmentsByPerson: Record<string, Record<string, Task[]>> = {};

    data.assignments.forEach(assignment => {
      const task = data.tasks.find(t => t.id === assignment.taskId);
      if (task) {
        if (!assignmentsByPerson[assignment.personId]) {
          assignmentsByPerson[assignment.personId] = {};
        }
        if (!assignmentsByPerson[assignment.personId][task.projectId]) {
          assignmentsByPerson[assignment.personId][task.projectId] = [];
        }
        assignmentsByPerson[assignment.personId][task.projectId].push(task);
      }
    });

    return data.people.map(person => {
      const personTasks = assignmentsByPerson[person.id] || {};
      const projects = Object.keys(personTasks).map(projectId => {
        const project = data.projects.find(p => p.id === projectId);
        return {
          project: project!,
          tasks: personTasks[projectId]
        };
      }).filter(p => p.project);

      return {
        person,
        projects
      };
    }).sort((a, b) => a.person.name.localeCompare(b.person.name));
  }, [data]);

  const handleExportPDF = async () => {
    setIsExporting(true);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '1122px'; // A4 landscape width in pixels for better canvas rendering
    document.body.appendChild(tempContainer);

    const root = ReactDOM.createRoot(tempContainer);
    root.render(<PrintablePersonAssignmentTree data={data} assignments={personAssignmentsData} />);

    // Allow content to render before capturing
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save('resource_assignments_report.pdf');

    } catch(error) {
        console.error("Error generating PDF:", error);
    } finally {
        root.unmount();
        document.body.removeChild(tempContainer);
        setIsExporting(false);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-cyan-300">Assignments by Person</h3>
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold rounded-md transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <DownloadIcon />
                {isExporting ? 'Exporting...' : 'Export as PDF'}
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personAssignmentsData.map(personData => (
            <PersonNode key={personData.person.id} personAssignments={personData} />
          ))}
        </div>
    </div>
  );
};