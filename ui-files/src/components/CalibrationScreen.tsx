import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/utils/timeUtils';
import { Progress } from './ui/progress';
import { Eye } from 'lucide-react';
import { BCIMetrics } from '@/services/dataService'; // Assuming BCIMetrics is the correct type for BCIReading

// Define BCIReading interface locally or import it if defined elsewhere
interface BCIReading {
  timestamp: string;
  alpha: number;
  beta: number;
  theta: number;
}

interface CalibrationScreenProps {
  duration: number;
  onComplete: () => void;
  latestReading: BCIReading | undefined; // Add prop for latest BCI reading
}
 
// edit 
export const CalibrationScreen = ({ duration, onComplete, latestReading }: CalibrationScreenProps) => {
// export const CalibrationScreen = ({ duration, onComplete }: CalibrationScreenProps) => {

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
  }, [onComplete]); // Dependency array ensures effect runs when onComplete changes

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

          {/* BCI Data Display (Real-time values from polling) */}
          {latestReading && (
            <div className="mt-8 bg-gray-800 rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-3 text-center">Real-time Metrics</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg text-blue-400 font-medium">Alpha</p>
                  <p className="text-2xl font-bold">{latestReading.alpha.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-lg text-green-400 font-medium">Beta</p>
                  <p className="text-2xl font-bold">{latestReading.beta.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-lg text-purple-400 font-medium">Theta</p>
                  <p className="text-2xl font-bold">{latestReading.theta.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
};
