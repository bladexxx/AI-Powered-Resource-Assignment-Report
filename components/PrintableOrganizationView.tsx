import React from 'react';
import { Project, Person, Team } from '../types';
import { TeamIcon, PeopleIcon, ProjectIcon } from './IconComponents';

// --- TYPE DEFINITIONS ---
type PersonWithProjects = Person & { projects: Project[] };
type TeamWithMembers = Team & { leader?: PersonWithProjects; members: PersonWithProjects[] };
type ManagerWithTeams = {
    manager: PersonWithProjects;
    teams: TeamWithMembers[];
};

interface PrintableOrganizationViewProps {
  treeData: ManagerWithTeams[];
}

// --- CHART NODE COMPONENTS ---
const ChartNode: React.FC<{
    item: TeamWithMembers | PersonWithProjects | Project;
    children?: React.ReactNode;
}> = ({ item, children }) => {
    const getIcon = () => {
        if ('leader' in item) return <TeamIcon className="w-5 h-5" />;
        if ('teamIds' in item) return <PeopleIcon className="w-5 h-5" />;
        return <ProjectIcon className="w-5 h-5" />;
    };

    const hasChildren = React.Children.count(children) > 0;
    
    const roleText = 'role' in item && item.role ? `(${item.role})` : '';

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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>{item.name}</span>
                      {roleText && <span style={{ fontSize: '12px', color: '#6b7280' }}>{roleText}</span>}
                    </div>
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

const PersonBranch: React.FC<{ person: PersonWithProjects; children?: React.ReactNode }> = ({ person, children }) => {
    const hasProjects = person.projects.length > 0;
    const hasChildren = React.Children.count(children) > 0;
    const roleText = person.role ? `(${person.role})` : '';
  
    const nodeStyles: React.CSSProperties = {
        backgroundColor: '#f3f4f6',
        padding: '6px 10px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        minWidth: '140px',
        zIndex: 1,
        border: '1px solid #d1d5db'
    };

    return (
      <ChartBranch>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* Person Node Card */}
          <div style={{...nodeStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
              <PeopleIcon className="w-5 h-5" />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>{person.name}</span>
                  {roleText && <span style={{ fontSize: '12px', color: '#6b7280' }}>{roleText}</span>}
              </div>
          </div>
          
          {/* Container for children (other people) OR projects */}
          {(hasChildren || hasProjects) && (
            <div style={{ marginTop: '24px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', backgroundColor: '#9ca3af' }}></div>
              
              {hasChildren ? (
                // If there are children (members), render them horizontally
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'nowrap', justifyContent: 'center' }}>
                    {children}
                </div>
              ) : (
                // Otherwise, render projects vertically
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px' }}>
                    {person.projects.map(project => (
                    <div key={project.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', top: '-24px', left: '50%', width: '2px', height: '24px', backgroundColor: '#9ca3af' }}></div>
                        <div style={{...nodeStyles, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                            <ProjectIcon className="w-5 h-5" />
                            <span style={{ fontWeight: 500, fontSize: '14px', color: '#1f2937' }}>{project.name}</span>
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

// --- MAIN COMPONENT ---
export const PrintableOrganizationView: React.FC<PrintableOrganizationViewProps> = ({ treeData }) => {
  return (
    <div id="printable-chart" style={{ fontFamily: 'sans-serif', color: '#111827', padding: '24px', backgroundColor: '#ffffff', display: 'inline-block' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#005f73', borderBottom: '2px solid #005f73', paddingBottom: '8px', marginBottom: '48px', textAlign: 'center' }}>
            Resource Report - Organization View
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
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
};