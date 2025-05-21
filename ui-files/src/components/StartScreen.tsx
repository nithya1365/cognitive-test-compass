
import { motion } from 'framer-motion';
import { Button } from './ui/button';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen = ({ onStart }: StartScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6">Adaptive Math Assessment</h1>
        
        <div className="bg-card border border-border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-medium mb-4">Welcome</h2>
          <p className="text-muted-foreground mb-6">
            This test uses brain-computer interface technology to adapt to your cognitive state.
            Before we begin, you'll need to calibrate the BCI device.
          </p>
          
          <p className="text-sm text-muted-foreground mb-6">
            When you're ready, click the button below to start the calibration process.
            You'll be asked to sit calmly with your eyes closed for 30 seconds.
          </p>
        </div>
        
        <Button 
          onClick={onStart}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2"
        >
          Start Test
        </Button>
      </motion.div>
    </div>
  );
};
