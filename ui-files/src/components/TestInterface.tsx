import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { BCIMetricsGauge } from './BCIMetricsGauge';
import { CognitiveLoadIndicator } from './CognitiveLoadIndicator';
import { QuestionCard } from './QuestionCard';
import { SessionSidebar } from './SessionSidebar';
import { CalibrationScreen } from './CalibrationScreen';
import { StartScreen } from './StartScreen';
import { 
  useDataService, 
  DifficultyLevel, 
  Question
} from '@/services/dataService';
import { exportToCSV, TestResult } from '@/utils/exportUtils';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

export const TestInterface = () => {
  const { 
    getQuestionsByDifficulty, 
    currentMetrics, 
    metricsHistory,
    updateBCIMetrics 
  } = useDataService();
  
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('medium');
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showCalibration, setShowCalibration] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isTestActive, setIsTestActive] = useState(false);

  // Initialize with questions
  useEffect(() => {
    loadQuestions('medium');
  }, []);

  // Update questions when difficulty changes
  useEffect(() => {
    loadQuestions(currentDifficulty);
  }, [currentDifficulty]);

  // Load questions for a given difficulty
  const loadQuestions = (difficulty: DifficultyLevel) => {
    const questions = getQuestionsByDifficulty(difficulty);
    setQuestionPool(questions);
    
    // If no current question or current question is of a different difficulty,
    // set a new current question
    if (!currentQuestion || currentQuestion.difficulty !== difficulty) {
      const availableQuestions = questions.filter(q => !answeredQuestions.includes(q.id));
      if (availableQuestions.length > 0) {
        setCurrentQuestion(availableQuestions[0]);
        setQuestionStartTime(Date.now());
      }
    }
  };

  // Handle start button click
  const handleStart = () => {
    setShowStartScreen(false);
    setShowCalibration(true);
  };

  // Handle calibration complete
  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    setIsTestActive(true);
    setQuestionStartTime(Date.now());
  };

  // Handle answer submission
  const handleAnswerSubmitted = (isCorrect: boolean) => {
    const newMetrics = updateBCIMetrics(isCorrect);
    
    // Record test result
    if (currentQuestion) {
      const timeSpent = (Date.now() - questionStartTime) / 1000;
      
      // Format timestamp as DD/MM/YYYY, HH:mm:ss
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const formattedTimestamp = `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;

      setTestResults(prev => [...prev, {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        difficulty: currentQuestion.difficulty,
        isCorrect: isCorrect,
        timeSpent: timeSpent,
        alpha: newMetrics.alpha,
        beta: newMetrics.beta,
        theta: newMetrics.theta,
        cognitiveLoad: newMetrics.cognitiveLoad,
        timestamp: formattedTimestamp
      }]);
    }
    
    // Add current question to answered questions
    setAnsweredQuestions(prev => [...prev, currentQuestion?.id || 0]);

    // Check if we've reached 10 questions
    if (answeredQuestions.length + 1 >= 10) {
      setCurrentQuestion(null);
      setIsTestActive(false);
      return;
    }
    
    // Adjust difficulty based on cognitive load
    if (newMetrics.cognitiveLoad === 'High' && currentDifficulty !== 'easy') {
      setCurrentDifficulty('easy');
    } else if (newMetrics.cognitiveLoad === 'Low' && currentDifficulty !== 'hard') {
      setCurrentDifficulty('hard');
    } else if (newMetrics.cognitiveLoad === 'Medium' && currentDifficulty !== 'medium') {
      setCurrentDifficulty('medium');
    }

    // Find next question before updating state
    const nextQuestion = findNextQuestion();
    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setQuestionStartTime(Date.now());
    } else {
      setCurrentQuestion(null);
      setIsTestActive(false);
    }
  };

  // Helper function to find next question
  const findNextQuestion = () => {
    if (!currentQuestion) return null;

    // Get all questions for current difficulty
    const currentDifficultyQuestions = getQuestionsByDifficulty(currentDifficulty);
    
    // Find next available question in current difficulty
    const nextQuestion = currentDifficultyQuestions.find(q => 
      !answeredQuestions.includes(q.id) && q.id !== currentQuestion.id
    );

    if (nextQuestion) {
      return nextQuestion;
    }

    // If no more questions in current difficulty, try other difficulties
    if (currentDifficulty === 'easy') {
      const mediumQuestions = getQuestionsByDifficulty('medium');
      return mediumQuestions.find(q => !answeredQuestions.includes(q.id));
    } else if (currentDifficulty === 'medium') {
      const hardQuestions = getQuestionsByDifficulty('hard');
      const nextHard = hardQuestions.find(q => !answeredQuestions.includes(q.id));
      if (nextHard) {
        setCurrentDifficulty('hard');
        return nextHard;
      }
      const easyQuestions = getQuestionsByDifficulty('easy');
      return easyQuestions.find(q => !answeredQuestions.includes(q.id));
    } else {
      const mediumQuestions = getQuestionsByDifficulty('medium');
      const nextMedium = mediumQuestions.find(q => !answeredQuestions.includes(q.id));
      if (nextMedium) {
        setCurrentDifficulty('medium');
        return nextMedium;
      }
      const easyQuestions = getQuestionsByDifficulty('easy');
      return easyQuestions.find(q => !answeredQuestions.includes(q.id));
    }
  };

  // Handle exporting test results
  const handleExportResults = () => {
    if (testResults.length > 0) {
      exportToCSV(testResults);
    }
  };

  // Get next question
  const handleNextQuestion = () => {
    if (!currentQuestion) return;
    setAnsweredQuestions(prev => [...prev, currentQuestion.id]);
  };

  const totalQuestions = getQuestionsByDifficulty('easy').length + 
                         getQuestionsByDifficulty('medium').length + 
                         getQuestionsByDifficulty('hard').length;

  // Show start screen first
  if (showStartScreen) {
    return <StartScreen onStart={handleStart} />;
  }

  // If calibration is active, show the calibration screen
  if (showCalibration) {
    return <CalibrationScreen duration={10} onComplete={handleCalibrationComplete} />;
  }

  // Completed state when all questions are answered
  if (!currentQuestion && answeredQuestions.length > 0) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        {isSidebarOpen && (
          <SessionSidebar 
            questionCount={answeredQuestions.length}
            totalQuestions={10}
            metricsHistory={metricsHistory}
            isTestActive={false}
          />
        )}
        
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-lg"
          >
            <h1 className="text-3xl font-bold text-primary mb-4">Congratulations!</h1>
            <p className="text-gray-400 mb-6">
              You've completed all {answeredQuestions.length} questions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => {
                  setAnsweredQuestions([]);
                  setCurrentDifficulty('medium');
                  loadQuestions('medium');
                  setTestResults([]);
                  setShowCalibration(true);
                  setIsTestActive(false);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start New Test
              </Button>
              
              <Button 
                onClick={handleExportResults}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Download Results (CSV)
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Sidebar */}
      {isSidebarOpen && (
        <SessionSidebar 
          questionCount={answeredQuestions.length}
          totalQuestions={totalQuestions}
          metricsHistory={metricsHistory}
          isTestActive={isTestActive}
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        {/* Mobile toggle for sidebar */}
        <div className="md:hidden mb-4">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            {isSidebarOpen ? "Hide Session Info" : "Show Session Info"}
          </button>
        </div>
        
        {/* Desktop sidebar toggle */}
        <div className="hidden md:block absolute top-4 left-4 z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-primary/10 hover:bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center"
          >
            {isSidebarOpen ? "←" : "→"}
          </button>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">Adaptive Math Assessment</h1>
            
            {/* BCI Metrics */}
            <div className="bg-card rounded-xl shadow-sm p-4 mb-6 border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-foreground">Brain-Computer Interface Metrics</h2>
                <CognitiveLoadIndicator level={currentMetrics.cognitiveLoad} />
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <BCIMetricsGauge 
                  label="Alpha Waves" 
                  value={currentMetrics.alpha} 
                  colorClass="bg-bci-alpha" 
                />
                <BCIMetricsGauge 
                  label="Beta Waves" 
                  value={currentMetrics.beta} 
                  colorClass="bg-bci-beta" 
                />
                <BCIMetricsGauge 
                  label="Theta Waves" 
                  value={currentMetrics.theta} 
                  colorClass="bg-bci-theta" 
                />
              </div>
            </div>
          </div>
          
          {/* Question Card */}
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <QuestionCard 
                key={currentQuestion.id}
                question={currentQuestion} 
                onAnswer={handleAnswerSubmitted}
                onNext={handleNextQuestion}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
