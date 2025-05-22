import { motion } from 'framer-motion';
import { Button } from './ui/button';

interface StartScreenProps {
  onStart: (isSampleTest: boolean) => void;
}

export const StartScreen = ({ onStart }: StartScreenProps) => {
  const handleStartSampleTest = async () => {
    try {
      const res = await fetch("http://localhost:5000/start_eeg");
      const data = await res.json();
      console.log("EEG started:", data);
      onStart(true); // continue to test screen
    } catch (error) {
      console.error("Failed to start EEG:", error);
      alert("Could not start EEG recording.");
    }
  };

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
            For the sample test, you'll need to calibrate the BCI device.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Choose one of the options below to begin your assessment.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button 
            onClick={() => onStart(false)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2"
          >
            Start Full Test
          </Button>

          <Button 
            onClick={handleStartSampleTest}
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-2"
          >
            Start Sample Test (5 Easy + 5 Hard Questions)
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
