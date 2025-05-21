
// Mock data service to provide questions and BCI metrics
import { useState } from 'react';

// Types
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CognitiveLoadLevel = 'Low' | 'Medium' | 'High';

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: DifficultyLevel;
}

export interface BCIMetrics {
  alpha: number;  // 0-100 scale
  beta: number;   // 0-100 scale
  theta: number;  // 0-100 scale
  cognitiveLoad: CognitiveLoadLevel;
}

// Mock questions with different difficulty levels
const mockQuestions: Question[] = [
  {
    id: 1,
    text: "What is 5 + 3?",
    options: ["7", "8", "9", "10"],
    correctAnswer: "8",
    difficulty: "easy"
  },
  {
    id: 2,
    text: "What is 12 - 4?",
    options: ["6", "7", "8", "9"],
    correctAnswer: "8",
    difficulty: "easy"
  },
  {
    id: 3,
    text: "What is 9 × 3?",
    options: ["18", "21", "24", "27"],
    correctAnswer: "27",
    difficulty: "easy"
  },
  {
    id: 4,
    text: "What is 36 ÷ 6?",
    options: ["4", "5", "6", "7"],
    correctAnswer: "6",
    difficulty: "easy"
  },
  {
    id: 5,
    text: "If x + 8 = 15, what is x?",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    difficulty: "medium"
  },
  {
    id: 6,
    text: "Solve for y: 3y - 7 = 14",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    difficulty: "medium"
  },
  {
    id: 7,
    text: "What is the value of 3² + 4²?",
    options: ["25", "24", "23", "22"],
    correctAnswer: "25",
    difficulty: "medium"
  },
  {
    id: 8,
    text: "Calculate: (8 × 5) + (7 × 2)",
    options: ["49", "50", "51", "54"],
    correctAnswer: "54",
    difficulty: "medium"
  },
  {
    id: 9,
    text: "Solve for x: 2x² - 5x - 3 = 0",
    options: ["x = 3, x = -0.5", "x = 3, x = -1", "x = 2, x = -0.5", "x = 2, x = -1"],
    correctAnswer: "x = 3, x = -0.5",
    difficulty: "hard"
  },
  {
    id: 10,
    text: "Find the derivative of f(x) = x³ - 2x² + 4x - 1",
    options: ["f'(x) = 3x² - 4x + 4", "f'(x) = 3x² - 4x", "f'(x) = 2x - 2", "f'(x) = 3x - 4"],
    correctAnswer: "f'(x) = 3x² - 4x + 4",
    difficulty: "hard"
  },
  {
    id: 11,
    text: "Evaluate ∫(2x - 3)dx from x=1 to x=4",
    options: ["6.5", "7.5", "8.5", "9.5"],
    correctAnswer: "7.5",
    difficulty: "hard"
  },
  {
    id: 12,
    text: "A quadratic function has roots at x = 2 and x = -3, and passes through the point (1, 12). Find the function.",
    options: ["f(x) = 2x² + 2x - 12", "f(x) = 2x² + 2x - 6", "f(x) = -2x² - 2x + 12", "f(x) = -2x² - 2x + 6"],
    correctAnswer: "f(x) = 2x² + 2x - 12",
    difficulty: "hard"
  }
];

// Function to get random questions by difficulty
export const getQuestionsByDifficulty = (difficulty: DifficultyLevel): Question[] => {
  return mockQuestions.filter(q => q.difficulty === difficulty);
};

// Hook to provide data service functionality
export const useDataService = () => {
  const [currentMetrics, setCurrentMetrics] = useState<BCIMetrics>({
    alpha: 50,
    beta: 50,
    theta: 50,
    cognitiveLoad: 'Medium'
  });

  // Metrics history for charting
  const [metricsHistory, setMetricsHistory] = useState<BCIMetrics[]>([]);

  // Function to simulate BCI metrics update
  const updateBCIMetrics = (userAnsweredCorrectly: boolean = true) => {
    // Simulate changes in BCI metrics based on answer correctness and some randomness
    const randomFactor = Math.random() * 20 - 10; // Random value between -10 and 10
    
    const newAlpha = Math.min(100, Math.max(0, currentMetrics.alpha + (userAnsweredCorrectly ? 5 : -5) + randomFactor));
    const newBeta = Math.min(100, Math.max(0, currentMetrics.beta + (userAnsweredCorrectly ? -3 : 8) + randomFactor));
    const newTheta = Math.min(100, Math.max(0, currentMetrics.theta + (userAnsweredCorrectly ? -2 : 7) + randomFactor));
    
    // Determine cognitive load based on metrics (simulating an SVM classifier)
    let cognitiveLoad: CognitiveLoadLevel;
    
    const loadScore = (newBeta * 0.6) + (newTheta * 0.3) - (newAlpha * 0.4);
    
    if (loadScore < 30) {
      cognitiveLoad = 'Low';
    } else if (loadScore < 60) {
      cognitiveLoad = 'Medium';
    } else {
      cognitiveLoad = 'High';
    }

    const newMetrics = {
      alpha: newAlpha,
      beta: newBeta,
      theta: newTheta,
      cognitiveLoad
    };
    
    setCurrentMetrics(newMetrics);
    setMetricsHistory(prev => [...prev, newMetrics].slice(-20)); // Keep last 20 data points
    
    return newMetrics;
  };
  
  return {
    getQuestionsByDifficulty,
    currentMetrics,
    metricsHistory,
    updateBCIMetrics,
  };
};
