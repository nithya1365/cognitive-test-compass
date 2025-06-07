import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BCIMetrics } from '@/services/dataService';
import { BCIMetricsGauge } from './BCIMetricsGauge';

interface MetricsChartProps {
  data: BCIMetrics[];
}

export const MetricsChart = ({ data }: MetricsChartProps) => {
  // Get the latest metrics from the data array
  const latestMetrics = data[data.length - 1] || { alpha: 0, beta: 0, theta: 0 };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col items-center">
        <div className="text-sm font-medium mb-1 text-muted-foreground">Alpha</div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-[#9b87f5]"
            initial={{ width: 0 }}
            animate={{ width: `${latestMetrics.alpha}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs mt-1 text-muted-foreground">{Math.round(latestMetrics.alpha)}%</div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-sm font-medium mb-1 text-muted-foreground">Beta</div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-[#33C3F0]"
            initial={{ width: 0 }}
            animate={{ width: `${latestMetrics.beta}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs mt-1 text-muted-foreground">{Math.round(latestMetrics.beta)}%</div>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-sm font-medium mb-1 text-muted-foreground">Theta</div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-[#FDE1D3]"
            initial={{ width: 0 }}
            animate={{ width: `${latestMetrics.theta}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs mt-1 text-muted-foreground">{Math.round(latestMetrics.theta)}%</div>
      </div>
    </div>
  );
};
