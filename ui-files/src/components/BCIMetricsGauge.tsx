
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BCIMetricsGaugeProps {
  label: string;
  value: number;
  colorClass: string;
}

export const BCIMetricsGauge = ({ label, value, colorClass }: BCIMetricsGaugeProps) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-sm font-medium mb-1 text-muted-foreground">{label}</div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div 
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-xs mt-1 text-muted-foreground">{Math.round(value)}%</div>
    </div>
  );
};
