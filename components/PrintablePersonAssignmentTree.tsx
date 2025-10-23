import React from 'react';
import { StructuredData, Person, Project, Task } from '../types';
import { ProjectIcon, TaskIcon, PeopleIcon } from './IconComponents';

interface PersonAssignments {
    person: Person;
    projects: {
      project: Project;
      tasks: Task[];
    }[];
}
  
interface PrintablePersonAssignmentTreeProps {
  data: StructuredData;
  assignments: PersonAssignments[];
}

export const PrintablePersonAssignmentTree: React.FC<PrintablePersonAssignmentTreeProps> = ({ data, assignments }) => {
  return (
    <div style={{ fontFamily: 'sans-serif', color: '#111827', padding: '24px', backgroundColor: '#ffffff' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#005f73', borderBottom: '2px solid #005f73', paddingBottom: '8px', marginBottom: '24px' }}>
            Resource Assignment Report
        </h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {assignments.map(({ person, projects }) => (
                <div key={person.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb', breakInside: 'avoid' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <PeopleIcon className="w-6 h-6" />
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{person.name}</h2>
                    </div>
                    <div style={{ paddingLeft: '16px', borderLeft: '2px solid #d1d5db', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {projects.length > 0 ? projects.map(({ project, tasks }) => (
                            <div key={project.id}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#047857' }}>
                                    <ProjectIcon className="w-5 h-5" />
                                    <h3 style={{ fontSize: '16px', fontWeight: '500' }}>{project.name}</h3>
                                </div>
                                <ul style={{ marginTop: '8px', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {tasks.map(task => (
                                        <li key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563' }}>
                                            <TaskIcon className="w-4 h-4" />
                                            <span>{task.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )) : (
                            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No assignments found.</p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};