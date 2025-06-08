import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Box, Typography, Paper, Grid } from '@mui/material';

import { BCIMetricsGauge } from './BCIMetricsGauge';
import { CognitiveLoadIndicator } from './CognitiveLoadIndicator';
import { QuestionCard } from './QuestionCard';
import { SessionSidebar } from './SessionSidebar';
import { CalibrationScreen } from './CalibrationScreen';
import { StartScreen } from './StartScreen';
import { 
  useDataService, 
  DifficultyLevel, 
  Question,
  BCIMetrics // Import BCIMetrics type
} from '@/services/dataService';
import { getSampleTestQuestions, getSampleQuestionByIndex } from '@/services/sampleTestService';
import { exportToCSV, TestResult } from '@/utils/exportUtils';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

// Define BCIReading interface locally or import it if defined elsewhere
interface BCIReading {
  timestamp: string;
  alpha: number;
  beta: number;
  theta: number;
}

// Helper: Start/stop recording and fetch CSV from backend
const startRecording = async () => {
  try {
    await axios.post('http://localhost:6000/start_recording');
  } catch (e) {
    console.error('Failed to start recording:', e);
  }
};
const stopRecording = async () => {
  try {
    await axios.post('http://localhost:6000/stop_recording');
  } catch (e) {
    console.error('Failed to stop recording:', e);
  }
};
const fetchPredictionCSV = async (): Promise<number[]> => {
  try {
    // The backend CSV is at ui-files/src/components/backend/realtime_predictions.csv
    // We'll expose a new endpoint to get the CSV as JSON (or fetch the file directly if served)
    // For now, fetch as text and parse
    const resp = await axios.get('http://localhost:6000/realtime_predictions.csv');
    const lines = resp.data.split('\n').filter((l: string) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const header = lines[0].split(',');
    const predIdx = header.indexOf('prediction');
    if (predIdx === -1) return [];
    return lines.slice(1).map((line: string) => {
      const cols = line.split(',');
      return parseInt(cols[predIdx], 10);
    }).filter((v: number) => v === 0 || v === 1);
  } catch (e) {
    console.error('Failed to fetch prediction CSV:', e);
    return [];
  }
};

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
  const [isSampleTest, setIsSampleTest] = useState(false);
  const [sampleTestPhase, setSampleTestPhase] = useState<'easy' | 'hard'>('easy');
  const [timeRemaining, setTimeRemaining] = useState<number>(480); // 8 minutes in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'calibration' | 'easy' | 'hard'>('easy');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(!isSampleTest);
  const [readings, setReadings] = useState<BCIReading[]>([]);

  // Add BCI data fetching - runs when test is active OR calibration is showing
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    // Fetch data if test is active OR calibration is showing
    if (isTestActive && !showCalibration) {
      console.log("hello this running")
      const fetchData = async () => {
        try {
          console.log("this is try")
          const response = await axios.get<BCIReading[]>('http://localhost:5000/api/data');
          setReadings(response.data);
        } catch (error) {
          console.error('Error fetching BCI data:', error);
        }
      };

      // Fetch data immediately on state change
      fetchData();

      // Set up polling every 100ms
      intervalId = setInterval(fetchData, 100);
    }

    // Cleanup interval on component unmount or when conditions change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isTestActive, showCalibration]); // Effect depends on these states

  // Get the latest reading (last in the array)
  const latestReading = readings[readings.length - 1];

  // Initialize with questions
  useEffect(() => {
    if (isSampleTest) {
      loadSampleTestQuestions();
    } else {
      loadQuestions('medium');
    }
  }, [isSampleTest]);

  // Update questions when difficulty changes
  useEffect(() => {
    loadQuestions(currentDifficulty);
  }, [currentDifficulty]);

  // Timer effect for sample test
  useEffect(() => {
    if (isSampleTest && isTestActive && !isTimeUp) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimeUp(true);
            setIsTestActive(false);
            setCurrentQuestion(null);
            setIsTestComplete(true);
            setShowResults(true); // Assuming you want to show results when test is complete
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSampleTest, isTestActive, isTimeUp]);

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

  // Load questions for sample test
  const loadSampleTestQuestions = () => {
    const sampleQuestions = getSampleTestQuestions();
    setQuestionPool(sampleQuestions);
    
    if (sampleQuestions.length > 0) {
      setCurrentQuestion(sampleQuestions[0]);
      setQuestionStartTime(Date.now());
    }
  };

  // Handle start button click
  const handleStart = (isSample: boolean) => {
    setIsSampleTest(isSample);
    setShowStartScreen(false);
    if (isSample) {
      setShowCalibration(true);
    } else {
      setIsTestActive(true);
      setQuestionStartTime(Date.now());
    }
  };

  // Handle calibration complete
  const handleCalibrationComplete = () => {
    setShowCalibration(false);
    setIsTestActive(true);
    setQuestionStartTime(Date.now());
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // When a new question is shown, start recording
  useEffect(() => {
    if (currentQuestion) {
      startRecording();
    }
  }, [currentQuestion]);

  // Handle answer submission
  const handleAnswerSubmitted = async (isCorrect: boolean, userAnswer: string) => {
    // Stop recording and analyze predictions
    await stopRecording();
    const predictions = await fetchPredictionCSV();
    const ones = predictions.filter((v) => v === 1).length;
    const zeros = predictions.filter((v) => v === 0).length;

    // Record test result
    if (currentQuestion) {
      const timeSpent = (Date.now() - questionStartTime) / 1000;
      
      // Format timestamp as DD/MM/YYYY, HH:mm:ss
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
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
        userAnswer: userAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        timeSpent: timeSpent,
        alpha: currentMetrics.alpha,
        beta: currentMetrics.beta,
        theta: currentMetrics.theta,
        cognitiveLoad: currentMetrics.cognitiveLoad,
        timestamp: formattedTimestamp
      }]);
    }
    
    setAnsweredQuestions(prev => [...prev, currentQuestion?.id || 0]);

    // Check if we've reached the end of the test
    if (isSampleTest) {
      if (answeredQuestions.length + 1 >= 15) {
        setCurrentQuestion(null);
        setIsTestActive(false);
        setIsTestComplete(true);
        setShowResults(true);
        return;
      }
    } else {
      if (answeredQuestions.length + 1 >= 10) {
        setCurrentQuestion(null);
        setIsTestActive(false);
        setIsTestComplete(true);
        setShowResults(true);
        return;
      }
    }

    // === Adjust difficulty based on predictions in CSV ===
    let newDifficulty = currentDifficulty;
    if (ones > zeros) {
      if (currentDifficulty === 'easy') newDifficulty = 'medium';
      else if (currentDifficulty === 'medium') newDifficulty = 'hard';
      else newDifficulty = 'hard';
    } else if (zeros > ones) {
      if (currentDifficulty === 'hard') newDifficulty = 'medium';
      else if (currentDifficulty === 'medium') newDifficulty = 'easy';
      else newDifficulty = 'easy';
    } // else, stays the same
    setCurrentDifficulty(newDifficulty);

    // Find next question before updating state
    const nextQuestion = isSampleTest 
      ? getSampleQuestionByIndex(answeredQuestions.length + 1)
      : findNextQuestion();

    if (nextQuestion) {
      setCurrentQuestion(nextQuestion);
      setQuestionStartTime(Date.now());
      // Start recording for the next question
      await startRecording();
    } else {
      setCurrentQuestion(null);
      setIsTestActive(false);
      setIsTestComplete(true);
      setShowResults(true);
    }
  };

  // Find the next question based on difficulty and answered questions
  const findNextQuestion = () => {
    const availableQuestions = questionPool.filter(q => !answeredQuestions.includes(q.id));
    
    if (availableQuestions.length > 0) {
      // For full test, adapt difficulty based on cognitive load
      let targetDifficulty = currentDifficulty;

      // This cognitive load logic is now handled in handleAnswerSubmitted, 
      // so we just need to find a question of the currentDifficulty
      const questionsOfCurrentDifficulty = availableQuestions.filter(q => q.difficulty === targetDifficulty);

      if (questionsOfCurrentDifficulty.length > 0) {
        // For simplicity, just pick the first available question of the target difficulty
        return questionsOfCurrentDifficulty[0];
      } else {
        // If no questions of the target difficulty are available, 
        // fall back to any available question (this might need refinement)
        console.warn(`No questions of difficulty ${targetDifficulty} available. Picking any available question.`);
        return availableQuestions[0];
      }
    } else {
      return null; // No more questions
    }
  };

  // Handle export results button click
  const handleExportResults = () => {
    exportToCSV(testResults);
  };

  const totalQuestions = getQuestionsByDifficulty('easy').length + 
                         getQuestionsByDifficulty('medium').length + 
                         getQuestionsByDifficulty('hard').length;

  // Show start screen first
  if (showStartScreen) {
    return <StartScreen onStart={handleStart} />;
  }

  // If calibration is active, show the calibration screen
  if (showCalibration && isSampleTest) {
    return <CalibrationScreen duration={60} onComplete={handleCalibrationComplete} latestReading={latestReading} />;
  }

  // Completed state when all questions are answered or time is up
  if ((!currentQuestion && answeredQuestions.length > 0) || isTimeUp) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background">
        {isSidebarOpen && (
          <SessionSidebar 
            questionCount={answeredQuestions.length}
            totalQuestions={isSampleTest ? 15 : 10}
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
            <h1 className="text-3xl font-bold text-primary mb-4">
              {isTimeUp ? "Time's Up!" : "Congratulations!"}
            </h1>
            <p className="text-gray-400 mb-6">
              {isTimeUp 
                ? `You've completed ${answeredQuestions.length} questions in the time limit.`
                : `You've completed all ${answeredQuestions.length} questions.`
              }
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
                  setIsTimeUp(false);
                  setTimeRemaining(480); // Reset to 8 minutes
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Start New Test
              </Button>
              
              <Button 
                onClick={() => {
                  setIsSampleTest(false);
                  setAnsweredQuestions([]);
                  setCurrentDifficulty('medium');
                  loadQuestions('medium');
                  setTestResults([]);
                  setIsTestActive(true);
                  setQuestionStartTime(Date.now()); // Reset question start time
                  setIsTimeUp(false);
                  setTimeRemaining(0); // Reset timer to 0 for full test
                  // Clear any existing timer
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                  }
                }}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              >
                Start Full Test
              </Button>
              
              <Button 
                onClick={handleExportResults}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download size={16} />
                Download Results (CSV)
              </Button>

              <Button 
                onClick={() => {
                  // Navigate to results page instead of home
                  window.location.href = '/results';
                }}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
              >
                Display Results
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
          totalQuestions={isSampleTest ? 15 : 10}
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
            
            {/* Timer for sample test */}
            {isSampleTest && isTestActive && (
              <div className="bg-card rounded-xl shadow-sm p-4 mb-6 border border-border">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-medium text-foreground">Time Remaining</h2>
                  <span className={`text-xl font-bold ${timeRemaining <= 60 ? 'text-red-500' : 'text-primary'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            )}
            
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
          
          {/* BCI Data Display */}
          <div className="mb-8 bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">BCI Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <h3 className="text-lg text-blue-400 mb-2">Alpha</h3>
                <p className="text-3xl font-bold">
                  {latestReading?.alpha.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <h3 className="text-lg text-green-400 mb-2">Beta</h3>
                <p className="text-3xl font-bold">
                  {latestReading?.beta.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <h3 className="text-lg text-purple-400 mb-2">Theta</h3>
                <p className="text-3xl font-bold">
                  {latestReading?.theta.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              Last Updated: {latestReading?.timestamp || 'No data'}
            </p>
          </div>
          
          {/* Question Card */}
          <AnimatePresence mode="wait">
            {currentQuestion && (
              <QuestionCard 
                key={currentQuestion.id}
                question={currentQuestion} 
                onAnswer={handleAnswerSubmitted}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};