import React from 'react';
import { Project, Person, Team } from '../types';
import { TeamIcon, PeopleIcon, ProjectIcon } from './IconComponents';

interface PersonWithProjects extends Person {
    projects: Project[];
}
interface TeamWithMembers extends Team {
    members: PersonWithProjects[];
}

interface PrintableOrganizationViewProps {
  treeData: TeamWithMembers[];
}

const ChartNode: React.FC<{
    item: TeamWithMembers | PersonWithProjects | Project;
    children?: React.ReactNode;
}> = ({ item, children }) => {
    const getIcon = () => {
        if ('members' in item) return <TeamIcon className="w-5 h-5" />;
        if ('projects' in item) return <PeopleIcon className="w-5 h-5" />;
        return <ProjectIcon className="w-5 h-5" />;
    };

    const hasChildren = ('members' in item && item.members.length > 0) || ('projects' in item && item.projects.length > 0);
    
    const nodeStyles: React.CSSProperties = {
        backgroundColor: '#f3f4f6',
        padding: '6px 10px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        minWidth: '140px',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        zIndex: 1,
        border: '1px solid #d1d5db'
    };
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={nodeStyles}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {getIcon()}
                    <span style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>{item.name}</span>
                </div>
            </div>
            {hasChildren && (
                <div style={{ marginTop: '24px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', backgroundColor: '#9ca3af' }}></div>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'nowrap', justifyContent: 'center' }}>
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


export const PrintableOrganizationView: React.FC<PrintableOrganizationViewProps> = ({ treeData }) => {
  return (
    <div id="printable-chart" style={{ fontFamily: 'sans-serif', color: '#111827', padding: '24px', backgroundColor: '#ffffff', display: 'inline-block' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#005f73', borderBottom: '2px solid #005f73', paddingBottom: '8px', marginBottom: '48px', textAlign: 'center' }}>
            Resource Report - Organization View
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
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
};