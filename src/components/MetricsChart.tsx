
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BCIMetrics } from '@/services/dataService';

interface MetricsChartProps {
  data: BCIMetrics[];
}

export const MetricsChart = ({ data }: MetricsChartProps) => {
  // Prepare data for the chart
  const chartData = data.map((metrics, index) => ({
    index,
    alpha: metrics.alpha,
    beta: metrics.beta,
    theta: metrics.theta,
    load: metrics.cognitiveLoad === 'Low' ? 25 : metrics.cognitiveLoad === 'Medium' ? 50 : 75,
  }));

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="index" 
            tick={false} 
            axisLine={false} 
            label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} 
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              border: '1px solid #f0f0f0',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
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
          <Line 
            type="stepAfter" 
            dataKey="load" 
            name="Cognitive Load" 
            stroke="#FF6969" 
            strokeWidth={1.5} 
            strokeDasharray="5 5" 
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
