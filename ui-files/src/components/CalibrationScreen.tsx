import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/utils/timeUtils';
import { Progress } from './ui/progress';
import { Eye } from 'lucide-react';

interface CalibrationScreenProps {
  duration: number;
  onComplete: () => void;
}

export const CalibrationScreen = ({ duration, onComplete }: CalibrationScreenProps) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const startCountdown = () => {
      intervalId = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalId);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    startCountdown();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [onComplete]);

  const progress = duration > 0 ? ((duration - timeRemaining) / duration) * 100 : 0;


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6">BCI Calibration</h1>
        
        <div className="bg-card border border-border rounded-xl p-8 shadow-md mb-8">
          <div className="flex items-center justify-center mb-6">
            <Eye size={24} className="text-primary mr-2" />
            <p className="text-lg">
              Please close your eyes and relax
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center mb-10">
            <div className="relative flex items-center justify-center">
              {/* Outer pulse circle */}
              <motion.div 
                className="absolute w-64 h-64 rounded-full bg-gradient-to-br from-primary/10 to-transparent"
                animate={{
                  scale: isAnimating ? [0.8, 1.2, 0.8] : 1,
                  opacity: isAnimating ? [0.4, 0.7, 0.4] : 0.5,
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Middle pulse circle */}
              <motion.div 
                className="absolute w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/5"
                animate={{
                  scale: isAnimating ? [1.1, 0.9, 1.1] : 1,
                  opacity: isAnimating ? [0.5, 0.8, 0.5] : 0.6,
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
              
              {/* Inner circle with timer */}
              <motion.div
                className="relative w-36 h-36 rounded-full flex items-center justify-center bg-card border border-primary/30 shadow-lg z-10"
              >
                <span className="text-5xl font-bold text-primary">{timeRemaining}</span>
              </motion.div>
            </div>
          </div>
          
          <p className="text-muted-foreground mb-4">
            Calibrating your brain activity patterns
          </p>
          
          <Progress value={progress} className="h-2 mb-2" />
          
          <p className="text-sm text-muted-foreground">
            {formatTime(timeRemaining)} remaining
          </p>
        </div>
      </motion.div>
    </div>
  );
};
