import { Question, DifficultyLevel } from './dataService';

// Pool of easy questions
export const easyQuestionsPool: Question[] = [
  {
    id: 101,
    text: "What is 18 + 29?",
    type: "multiple-choice",
    options: ["47", "37", "57", "27"],
    correctAnswer: "47",
    difficulty: "easy"
  },
  {
    id: 102,
    text: "What is 9 × 6?",
    type: "multiple-choice",
    options: ["54", "52", "56", "58"],
    correctAnswer: "54",
    difficulty: "easy"
  },
  {
    id: 103,
    text: "What is 169 ÷ 13?",
    type: "multiple-choice",
    options: ["13", "15", "11", "17"],
    correctAnswer: "13",
    difficulty: "easy"
  },
  {
    id: 104,
    text: "What is 30% of 150?",
    type: "text-input",
    correctAnswer: "45",
    difficulty: "easy"
  },
  {
    id: 105,
    text: "What is the square root of 64?",
    type: "multiple-choice",
    options: ["8", "7", "9", "10"],
    correctAnswer: "8",
    difficulty: "easy"
  },
  {
    id: 106,
    text: "What is 42 × 8?",
    type: "text-input",
    correctAnswer: "336",
    difficulty: "easy"
  },
  {
    id: 107,
    text: "What is 4² + 3²?",
    type: "multiple-choice",
    options: ["25", "24", "23", "22"],
    correctAnswer: "25",
    difficulty: "easy"
  },
  {
    id: 108,
    text: "What is 1000 - 678?",
    type: "text-input",
    correctAnswer: "322",
    difficulty: "easy"
  },
  {
    id: 109,
    text: "What is 13 × 13?",
    type: "multiple-choice",
    options: ["169", "149", "159", "179"],
    correctAnswer: "169",
    difficulty: "easy"
  },
  {
    id: 110,
    text: "What is 80% of 75?",
    type: "text-input",
    correctAnswer: "60",
    difficulty: "easy"
  }
];

// Pool of hard questions
export const hardQuestionsPool: Question[] = [
  {
    id: 201,
    text: "Evaluate: ∫ cos²(x) dx",
    type: "text-input",
    correctAnswer: "x/2 + sin(2x)/4 + C",
    difficulty: "hard"
  },
  {
    id: 202,
    text: "Solve: d²y/dx² + 2dy/dx + y = 0",
    type: "text-input",
    correctAnswer: "y = c₁e^(-x) + c₂xe^(-x)",
    difficulty: "hard"
  },
  {
    id: 203,
    text: "Evaluate the limit: limₓ→∞ (x²)/e^x",
    type: "text-input",
    correctAnswer: "0",
    difficulty: "hard"
  },
  {
    id: 204,
    text: "What are the eigenvalues of [[2, 1, 1], [1, 3, 2],[1, 2, 3]]?",
    type: "text-input",
    correctAnswer: "1,3,4",
    difficulty: "hard"
  },
  {
    id: 205,
    text: "Find the sum: ∑ (1/n²) from n=1 to ∞",
    type: "text-input",
    correctAnswer: "1.645",
    difficulty: "hard"
  },
  {
    id: 206,
    text: "Evaluate: ∫ e^(-x²/2) dx from -∞ to ∞",
    type: "text-input",
    correctAnswer: "√(2π)",
    difficulty: "hard"
  },
  {
    id: 207,
    text: "Use L'Hôpital's Rule: limₓ→0 (tan x)/x",
    type: "text-input",
    correctAnswer: "1",
    difficulty: "hard"
  },
  {
    id: 208,
    text: "Find the modulus of (5 - 12i)",
    type: "text-input",
    correctAnswer: "13",
    difficulty: "hard"
  },
  {
    id: 209,
    text: "If A = {x ∈ z | x² < 25}, B = {x ∈ z | x is even}, find A ∩ B",
    type: "text-input",
    correctAnswer: "{-4,-2,0,2,4}",
    difficulty: "hard"
  },
  {
    id: 210,
    text: "Evaluate: ∫ x·sin(x) dx",
    type: "text-input",
    correctAnswer: "-x·cos(x) + sin(x) + C",
    difficulty: "hard"
  },
  {
    id: 211,
    text: "Find det of matrix [[2,3,4],[5,6,7],[8,9,10]]",
    type: "text-input",
    correctAnswer: "0",
    difficulty: "hard"
  },
  {
    id: 212,
    text: "Find inverse of [[3,1,0],[1,2,1],[0,1,3]]",
    type: "text-input",
    correctAnswer: "[[5/8,-3/8,1/8],[-3/8,9/8,-3/8],[1/8,-3/8,5/8]]",
    difficulty: "hard"
  },
  {
    id: 213,
    text: "Evaluate: 523 × 419",
    type: "text-input",
    correctAnswer: "219137",
    difficulty: "hard"
  },
  {
    id: 214,
    text: "Solve: ∫ (sin x)/x dx",
    type: "text-input",
    correctAnswer: "Si(x) + C",
    difficulty: "hard"
  },
  {
    id: 215,
    text: "Evaluate: limₓ→0 (sin² x)/x²",
    type: "text-input",
    correctAnswer: "1",
    difficulty: "hard"
  },
  {
    id: 216,
    text: "Calculate rref of [[2, 3.5, 4.5],[2.3, 3.4, 6.7], [5.5, 3.5, 4.7]]",
    type: "text-input",
    correctAnswer: "[[1,0,0],[0,1,0],[0,0,1]]",
    difficulty: "hard"
  }
];

// Cache for the current test's questions
let currentTestQuestions: Question[] | null = null;

// Helper function to get random questions from a pool
const getRandomQuestions = (pool: Question[], count: number): Question[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Function to get all sample test questions in order
export const getSampleTestQuestions = (): Question[] => {
  // If we already have questions cached, return them
  if (currentTestQuestions) {
    return currentTestQuestions;
  }

  // Get 10 random easy questions and 5 random hard questions
  const selectedEasyQuestions = getRandomQuestions(easyQuestionsPool, 10);
  const selectedHardQuestions = getRandomQuestions(hardQuestionsPool, 5);
  
  // Combine them in order (easy first, then hard) and cache the result
  currentTestQuestions = [...selectedEasyQuestions, ...selectedHardQuestions];
  return currentTestQuestions;
};

// Function to get questions by phase (easy or hard)
export const getSampleQuestionsByPhase = (phase: 'easy' | 'hard'): Question[] => {
  return phase === 'easy' ? easyQuestionsPool : hardQuestionsPool;
};

// Function to get a specific question by index
export const getSampleQuestionByIndex = (index: number): Question | null => {
  const allQuestions = getSampleTestQuestions();
  if (index >= 0 && index < allQuestions.length) {
    return allQuestions[index];
  }
  return null;
};

// Function to reset the test questions (call this when starting a new test)
export const resetSampleTestQuestions = (): void => {
  currentTestQuestions = null;
}; 