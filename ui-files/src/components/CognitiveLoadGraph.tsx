import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface CognitiveLoadData {
  timestamp: string;
  load: 'Low' | 'Medium' | 'High';
}

interface CognitiveLoadGraphProps {
  data: CognitiveLoadData[];
}

export const CognitiveLoadGraph = ({ data }: CognitiveLoadGraphProps) => {
  // Convert cognitive load levels to numbers for the graph
  const processedData = data.map(item => ({
    ...item,
    load: item.load === 'High' ? 2 : item.load === 'Medium' ? 1 : 0
  }));

  return (
    <div className="w-full h-[400px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              switch (value) {
                case 0: return 'Low';
                case 1: return 'Medium';
                case 2: return 'High';
                default: return '';
              }
            }}
          />
          <Tooltip 
            formatter={(value: number) => {
              switch (value) {
                case 0: return 'Low';
                case 1: return 'Medium';
                case 2: return 'High';
                default: return '';
              }
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="load"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Cognitive Load"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}; 