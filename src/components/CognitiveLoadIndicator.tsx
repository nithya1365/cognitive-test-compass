
import { motion } from "framer-motion";
import { CognitiveLoadLevel } from "@/services/dataService";

interface CognitiveLoadIndicatorProps {
  level: CognitiveLoadLevel;
}

export const CognitiveLoadIndicator = ({ level }: CognitiveLoadIndicatorProps) => {
  const getColorClass = () => {
    switch (level) {
      case 'Low':
        return 'bg-low-load';
      case 'Medium':
        return 'bg-yellow-100';
      case 'High':
        return 'bg-high-load';
      default:
        return 'bg-gray-100';
    }
  };

  const getTextColorClass = () => {
    switch (level) {
      case 'Low':
        return 'text-blue-700';
      case 'Medium':
        return 'text-yellow-700';
      case 'High':
        return 'text-red-700';
      default:
        return 'text-gray-700';
    }
  };

  return (
    <motion.div 
      className={`rounded-full px-4 py-1.5 inline-flex items-center ${getColorClass()}`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`animate-pulse-subtle w-2 h-2 rounded-full mr-2 ${level === 'Low' ? 'bg-blue-500' : level === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
      <span className={`text-sm font-medium ${getTextColorClass()}`}>
        {level} Cognitive Load
      </span>
    </motion.div>
  );
};
