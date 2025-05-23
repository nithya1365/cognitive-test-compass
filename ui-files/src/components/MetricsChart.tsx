import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface BCIReading {
  timestamp: string;
  alpha: number;
  beta: number;
  theta: number;
}

interface ChartDataPoint {
  timestamp: string;
  alpha: number;
  beta: number;
  theta: number;
}

export const MetricsChart = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const MAX_DATA_POINTS = 50; // Keep last 50 readings

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<BCIReading[]>('http://localhost:5000/api/data');
        const newData = response.data.map(reading => ({
          timestamp: new Date(reading.timestamp).toLocaleTimeString(),
          alpha: reading.alpha,
          beta: reading.beta,
          theta: reading.theta
        }));

        setData(prevData => {
          const updatedData = [...prevData, ...newData];
          // Keep only the last MAX_DATA_POINTS
          return updatedData.slice(-MAX_DATA_POINTS);
        });
      } catch (error) {
        console.error('Error fetching BCI data:', error);
      }
    };

    // Fetch data immediately
    fetchData();

    // Set up polling every 100ms
    const intervalId = setInterval(fetchData, 100);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3747" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 10, fill: '#a0aec0' }}
            axisLine={{ stroke: '#4a5568' }}
            label={{ value: 'Time', position: 'insideBottomRight', offset: -5, fill: '#a0aec0' }} 
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10, fill: '#a0aec0' }}
            axisLine={{ stroke: '#4a5568' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(222 47% 14%)', 
              borderRadius: '8px', 
              border: '1px solid hsl(217 32% 17%)',
              color: '#e2e8f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' 
            }} 
          />
          <Line 
            type="monotone" 
            dataKey="alpha" 
            name="Alpha" 
            stroke="#9b87f5" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4 }} 
          />
          <Line 
            type="monotone" 
            dataKey="beta" 
            name="Beta" 
            stroke="#33C3F0" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4 }} 
          />
          <Line 
            type="monotone" 
            dataKey="theta" 
            name="Theta" 
            stroke="#FDE1D3" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 4 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
