import React from 'react';
import { Project, Task, Person } from '../types';
import { ProjectIcon, TaskIcon, PeopleIcon } from './IconComponents';

interface TaskWithPeople extends Task {
  people: Person[];
}
interface ProjectWithTasks extends Project {
  tasks: TaskWithPeople[];
}

interface PrintableResourceTreeProps {
  treeData: ProjectWithTasks[];
}

const styles = {
    treeNode: {
        position: 'relative' as const,
        paddingLeft: '24px',
        paddingTop: '4px',
        paddingBottom: '4px',
    },
    line: {
        content: '""',
        position: 'absolute' as const,
        left: '0',
        top: '0',
        borderLeft: '1px solid #d1d5db',
    },
    horizontalLine: {
        content: '""',
        position: 'absolute' as const,
        left: '0',
        top: '16px',
        width: '12px',
        borderTop: '1px solid #d1d5db',
    },
    itemContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    projectText: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#005f73',
    },
    taskText: {
        fontSize: '16px',
        fontWeight: 500,
        color: '#047857',
    },
    personText: {
        fontSize: '14px',
        color: '#1f2937',
    },
};

const TreeNode: React.FC<{ children: React.ReactNode; isLast: boolean }> = ({ children, isLast }) => (
    <div style={styles.treeNode}>
        <div style={{ ...styles.line, height: isLast ? '16px' : '100%' }}></div>
        <div style={styles.horizontalLine}></div>
        {children}
    </div>
);

export const PrintableResourceTree: React.FC<PrintableResourceTreeProps> = ({ treeData }) => {
  return (
    <div style={{ fontFamily: 'sans-serif', color: '#111827', padding: '24px', backgroundColor: '#ffffff' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#005f73', borderBottom: '2px solid #005f73', paddingBottom: '8px', marginBottom: '24px' }}>
            Resource Assignment Report
        </h1>
        {treeData.map(project => (
            <div key={project.id} style={{ marginBottom: '24px' }}>
                <div style={{...styles.itemContent, marginBottom: '8px'}}>
                    <ProjectIcon className="w-6 h-6 text-cyan-500" />
                    <span style={styles.projectText}>{project.name}</span>
                </div>
                <div style={{ paddingLeft: '8px' }}>
                    {project.tasks.map((task, taskIndex) => (
                        <TreeNode key={task.id} isLast={taskIndex === project.tasks.length - 1 && task.people.length === 0}>
                            <div style={styles.itemContent}>
                                <TaskIcon className="w-5 h-5 text-emerald-600" />
                                <span style={styles.taskText}>{task.name}</span>
                            </div>
                            <div style={{ paddingLeft: '8px' }}>
                                {task.people.map((person, personIndex) => (
                                     <TreeNode key={person.id} isLast={personIndex === task.people.length - 1}>
                                        <div style={styles.itemContent}>
                                            <PeopleIcon className="w-5 h-5 text-blue-600" />
                                            <span style={styles.personText}>{person.name}</span>
                                        </div>
                                    </TreeNode>
                                ))}
                            </div>
                        </TreeNode>
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
};
