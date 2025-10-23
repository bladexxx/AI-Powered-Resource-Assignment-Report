
import React from 'react';
import { StructuredData } from '../types';
import { PeopleIcon } from './IconComponents';

interface OrgChartProps {
  data: StructuredData;
}

export const OrgChart: React.FC<OrgChartProps> = ({ data }) => {
  return (
    <div className="flex flex-wrap gap-8 justify-center">
      {data.teams.map(team => (
        <div key={team.id} className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 min-w-[250px] flex-shrink-0">
          <h4 className="text-lg font-bold text-center text-cyan-400 mb-4">{team.name}</h4>
          <div className="space-y-3">
            {data.people
              .filter(person => person.teamId === team.id)
              .map(person => (
                <div key={person.id} className="bg-gray-800 p-3 rounded-md flex items-center gap-3 shadow">
                  <PeopleIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-200">{person.name}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};
