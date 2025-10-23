
import React from 'react';
import { StructuredData } from '../types';
import { PeopleIcon, ProjectIcon, TaskIcon, TeamIcon } from './IconComponents';

interface SummaryCardsProps {
  data: StructuredData;
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="bg-gray-800 p-6 rounded-xl flex items-center gap-4 border border-gray-700 shadow-lg">
    <div className="p-3 rounded-full bg-gray-700 text-cyan-400">
      {icon}
    </div>
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-gray-400">{label}</p>
    </div>
  </div>
);

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  const stats = [
    { icon: <TeamIcon />, label: 'Total Teams', value: data.teams.length },
    { icon: <PeopleIcon />, label: 'Total People', value: data.people.length },
    { icon: <ProjectIcon />, label: 'Total Projects', value: data.projects.length },
    { icon: <TaskIcon />, label: 'Total Tasks', value: data.tasks.length },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
