// Mock data service to provide questions and BCI metrics
import { useState } from 'react';

// Types
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type CognitiveLoadLevel = 'Low' | 'Medium' | 'High';
export type QuestionType = 'multiple-choice' | 'text-input';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string;
  difficulty: DifficultyLevel;
}

export interface BCIMetrics {
  alpha: number;  // 0-100 scale
  beta: number;   // 0-100 scale
  theta: number;  // 0-100 scale
  cognitiveLoad: CognitiveLoadLevel;
}

// Mock questions with different difficulty levels and question types
const mockQuestions: Question[] = [
  // Easy Questions - Multiple Choice
  {
    id: 1,
    text: "What is 123 x 3?",
    type: "multiple-choice",
    options: ["369", "389", "379", "359"],
    correctAnswer: "369",
    difficulty: "easy"
  },
  {
    id: 2,
    text: "What is the square root of 169?",
    type: "multiple-choice",
    options: ["12", "13", "14", "15"],
    correctAnswer: "13",
    difficulty: "easy"
  },
  {
    id: 3,
    text: "Simplify: 6² - 4²",
    type: "multiple-choice",
    options: ["20", "24", "28", "32"],
    correctAnswer: "20",
    difficulty: "easy"
  },
  // Easy Questions - Text Input
  {
    id: 4,
    text: "What is 25% of 320?",
    type: "text-input",
    correctAnswer: "80",
    difficulty: "easy"
  },
  {
    id: 5,
    text: "What is the value of π (up to 2 decimal places)?",
    type: "text-input",
    correctAnswer: "3.14",
    difficulty: "easy"
  },
  {
    id: 6,
    text: "What is 37 x 9?",
    type: "text-input",
    correctAnswer: "333",
    difficulty: "easy"
  },
  // Medium Questions - Multiple Choice (keeping some of the original medium questions)
  {
    id: 7,
    text: "If x + 8 = 15, what is x?",
    type: "multiple-choice",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    difficulty: "medium"
  },
  {
    id: 8,
    text: "Solve for y: 3y - 7 = 14",
    type: "multiple-choice",
    options: ["5", "6", "7", "8"],
    correctAnswer: "7",
    difficulty: "medium"
  },
  {
    id: 9,
    text: "What is the value of 3² + 4²?",
    type: "multiple-choice",
    options: ["25", "24", "23", "22"],
    correctAnswer: "25",
    difficulty: "medium"
  },
  {
    id: 10,
    text: "Calculate: (8 × 5) + (7 × 2)",
    type: "multiple-choice",
    options: ["49", "50", "51", "54"],
    correctAnswer: "54",
    difficulty: "medium"
  },
  // Hard Questions - Multiple Choice
  {
    id: 11,
    text: "Evaluate: ∫ sin²(x) dx",
    type: "multiple-choice",
    options: ["x/2 - sin(2x)/4 + C", "x/2 + sin(2x)/4 + C", "x - sin(2x)/2 + C", "sin(x)/cos(x) + C"],
    correctAnswer: "x/2 - sin(2x)/4 + C",
    difficulty: "hard"
  },
  {
    id: 12,
    text: "Solve: d²y/dx² - 2dy/dx + y = 0",
    type: "multiple-choice",
    options: ["y = c₁eˣ + c₂xeˣ", "y = c₁e²ˣ + c₂e⁻ˣ", "y = c₁sin(x) + c₂cos(x)", "y = c₁ + c₂e²ˣ"],
    correctAnswer: "y = c₁eˣ + c₂xeˣ",
    difficulty: "hard"
  },
  {
    id: 13,
    text: "Evaluate the limit: limₓ→∞ (ln x)/x",
    type: "multiple-choice",
    options: ["0", "1", "∞", "undefined"],
    correctAnswer: "0",
    difficulty: "hard"
  },
  // Hard Questions - Text Input
  {
    id: 14,
    text: "What are the eigenvalues of [[3, 1, 2], [0, 2, 3], [1, 5, 6]]? List them separated by commas.",
    type: "text-input",
    correctAnswer: "1,4,6",
    difficulty: "hard"
  },
  {
    id: 15,
    text: "Find the sum: ∑ (1/n³) from n=1 to ∞ (round to 3 decimal places)",
    type: "text-input",
    correctAnswer: "1.202",
    difficulty: "hard"
  },
  {
    id: 16,
    text: "Evaluate: ∫ e^(-x²) dx from -∞ to ∞",
    type: "text-input",
    correctAnswer: "√π",
    difficulty: "hard"
  },
  {
    id: 17,
    text: "Use L'Hôpital's Rule: limₓ→0 (sin x)/x",
    type: "text-input",
    correctAnswer: "1",
    difficulty: "hard"
  },
  {
    id: 18,
    text: "Find the modulus of (7 - 24i)",
    type: "text-input",
    correctAnswer: "25",
    difficulty: "hard"
  },
  {
    id: 19,
    text: "If A = {x ∈ z | x² < 20}, B = {x ∈ z | x is odd}, find A ∩ B as a set",
    type: "text-input",
    correctAnswer: "{-3,-1,1,3}",
    difficulty: "hard"
  },
  {
    id: 20,
    text: "Evaluate: ∫ x·e^x dx",
    type: "text-input",
    correctAnswer: "x·e^x - e^x + C",
    difficulty: "hard"
  },
  {
    id: 21,
    text: "Find det of matrix [[1,2,3],[4,5,6],[7,8,9]]",
    type: "text-input",
    correctAnswer: "0",
    difficulty: "hard"
  },
  {
    id: 22,
    text: "Evaluate: 421 x 317",
    type: "text-input",
    correctAnswer: "133457",
    difficulty: "hard"
  },
  {
    id: 23,
    text: "Solve: ∫ (ln x)/x dx",
    type: "text-input",
    correctAnswer: "(ln x)²/2 + C",
    difficulty: "hard"
  },
  {
    id: 24,
    text: "Evaluate: limₓ→0 (1 - cos x)/x² (as a fraction)",
    type: "text-input",
    correctAnswer: "1/2",
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
