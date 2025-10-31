import React, { useMemo } from 'react';
import { Project, Task, Person } from '../types';
import { ProjectIcon, TaskIcon, PeopleIcon } from './IconComponents';

interface TaskWithPeople extends Task {
  people: Person[];
}
interface ProjectWithTasks extends Project {
  tasks: TaskWithPeople[];
}

interface PrintableProjectViewProps {
  treeData: ProjectWithTasks[];
}

const SMALL_PROJECT_TASK_THRESHOLD = 2;

const ChartNode: React.FC<{
  item: ProjectWithTasks | TaskWithPeople | Person;
  children?: React.ReactNode;
  childrenLayout?: 'horizontal' | 'vertical';
}> = ({ item, children, childrenLayout = 'horizontal' }) => {
    const getIcon = () => {
        if ('projectId' in item) return <TaskIcon className="w-5 h-5" />;
        if ('tasks' in item) return <ProjectIcon className="w-5 h-5" />;
        return <PeopleIcon className="w-5 h-5" />;
    };

    const isTask = 'projectId' in item;

    const nodeStyles: React.CSSProperties = {
        backgroundColor: '#f3f4f6',
        padding: '6px 10px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
        border: '1px solid #d1d5db',
        width: isTask ? '144px' : 'auto',
        minWidth: isTask ? '144px' : '140px',
    };
    
    const textStyles: React.CSSProperties = {
        fontWeight: 500,
        fontSize: '14px',
        color: '#1f2937',
        wordBreak: isTask ? 'break-word' : 'normal',
    };
    
    const childrenContainerStyles: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: childrenLayout === 'horizontal' ? 'wrap' : 'nowrap',
        flexDirection: childrenLayout === 'vertical' ? 'column' : 'row',
        gap: childrenLayout === 'vertical' ? '40px' : '24px',
        alignItems: 'center'
    };

    const hasChildren = ('tasks' in item && item.tasks.length > 0) || ('people' in item && item.people.length > 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={nodeStyles}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {getIcon()}
                    <span style={textStyles}>{item.name}</span>
                </div>
            </div>
            {hasChildren && (
                <div style={{ marginTop: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', backgroundColor: '#9ca3af' }}></div>
                    <div style={childrenContainerStyles}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const ChartBranch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'absolute', top: '-12px', left: '0', right: '0', height: '2px', backgroundColor: '#9ca3af' }}></div>
        <div style={{ position: 'absolute', top: '-12px', left: '50%', width: '2px', height: '12px', backgroundColor: '#9ca3af' }}></div>
        {children}
      </div>
    );
}

const ProjectChart: React.FC<{ project: ProjectWithTasks }> = ({ project }) => (
    <ChartNode item={project} childrenLayout="horizontal">
        {project.tasks.map(task => (
            <ChartBranch key={task.id}>
                <ChartNode item={task} childrenLayout="vertical">
                    {task.people.map(person => (
                        <div key={person.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                           <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', backgroundColor: '#9ca3af' }}></div>
                           <ChartNode item={person} />
                        </div>
                    ))}
                </ChartNode>
            </ChartBranch>
        ))}
    </ChartNode>
);


export const PrintableProjectView: React.FC<PrintableProjectViewProps> = ({ treeData }) => {
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

  return (
    <div id="printable-chart" style={{ fontFamily: 'sans-serif', color: '#111827', padding: '24px', backgroundColor: '#ffffff', display: 'inline-block' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#005f73', borderBottom: '2px solid #005f73', paddingBottom: '8px', marginBottom: '48px', textAlign: 'center' }}>
            Resource Report - Project View
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '48px 64px' }}>
                {largeProjects.map(project => (
                    <ProjectChart key={project.id} project={project} />
                ))}
            </div>
            {smallProjects.length > 0 && (
                <div style={{width: '100%', border: '2px dashed #9ca3af', borderRadius: '12px', padding: '24px', marginTop: '64px'}}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', textAlign: 'center', marginBottom: '40px', color: '#4b5563' }}>Small Projects</h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', gap: '32px 64px' }}>
                        {smallProjects.map(project => (
                            <ProjectChart key={project.id} project={project} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};