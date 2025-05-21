
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/utils/timeUtils';

interface CalibrationScreenProps {
  duration: number;
  onComplete: () => void;
}

export const CalibrationScreen = ({ duration, onComplete }: CalibrationScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, onComplete]);

  const progress = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6">BCI Calibration</h1>
        
        <p className="text-lg mb-8">
          Please sit calmly and close your eyes for {duration} seconds to calibrate the BCI device.
        </p>
        
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative">
            <motion.div 
              className="w-60 h-60 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 absolute"
              animate={{
                scale: isAnimating ? [0.9, 1.1, 0.9] : 1,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
            
            <motion.div 
              className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 absolute inset-0 m-auto"
              animate={{
                scale: isAnimating ? [1.1, 0.9, 1.1] : 1,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.5,
              }}
            />
            
            <motion.div
              className="w-36 h-36 rounded-full flex items-center justify-center bg-background absolute inset-0 m-auto shadow-lg"
            >
              <span className="text-4xl font-bold">{timeRemaining}</span>
            </motion.div>
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2 mb-2">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          {formatTime(timeRemaining)} remaining
        </p>
      </motion.div>
    </div>
  );
};
