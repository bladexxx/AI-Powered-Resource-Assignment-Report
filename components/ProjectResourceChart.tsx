
import React, { useMemo } from 'react';
import { StructuredData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProjectResourceChartProps {
  data: StructuredData;
}

interface ChartData {
  name: string;
  tasks: number;
}

export const ProjectResourceChart: React.FC<ProjectResourceChartProps> = ({ data }) => {
  const chartData: ChartData[] = useMemo(() => {
    return data.projects.map(project => ({
      name: project.name,
      tasks: data.tasks.filter(task => task.projectId === project.id).length
    }));
  }, [data]);

  return (
    <div style={{ width: '100%', height: 300 }}>
       <p className="text-gray-400 mb-4 text-center">Number of tasks assigned per project.</p>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="name" stroke="#A0AEC0" />
          <YAxis stroke="#A0AEC0" allowDecimals={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1A202C', 
              border: '1px solid #4A5568',
              color: '#E2E8F0'
            }}
          />
          <Legend wrapperStyle={{ color: '#E2E8F0' }} />
          <Bar dataKey="tasks" fill="#2DD4BF" name="Number of Tasks" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
