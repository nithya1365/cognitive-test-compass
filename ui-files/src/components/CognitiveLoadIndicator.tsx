
import { motion } from "framer-motion";
import { CognitiveLoadLevel } from "@/services/dataService";

interface CognitiveLoadIndicatorProps {
  level: CognitiveLoadLevel;
}

export const CognitiveLoadIndicator = ({ level }: CognitiveLoadIndicatorProps) => {
  const getColorClass = () => {
    switch (level) {
      case 'Low':
        return 'bg-blue-500/20';
      case 'Medium':
        return 'bg-yellow-500/20';
      case 'High':
        return 'bg-red-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  const getTextColorClass = () => {
    switch (level) {
      case 'Low':
        return 'text-blue-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'High':
        return 'text-red-400';
      default:
        return 'text-gray-400';
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
