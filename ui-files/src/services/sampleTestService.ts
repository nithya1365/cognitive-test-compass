import { Question, DifficultyLevel } from './dataService';

// Pool of easy questions
const easyQuestionsPool: Question[] = [
  {
    id: 101,
    text: "What is 15 + 27?",
    type: "multiple-choice",
    options: ["42", "32", "52", "22"],
    correctAnswer: "42",
    difficulty: "easy"
  },
  {
    id: 102,
    text: "What is 8 × 7?",
    type: "multiple-choice",
    options: ["56", "54", "58", "52"],
    correctAnswer: "56",
    difficulty: "easy"
  },
  {
    id: 103,
    text: "What is 144 ÷ 12?",
    type: "multiple-choice",
    options: ["12", "14", "10", "16"],
    correctAnswer: "12",
    difficulty: "easy"
  },
  {
    id: 104,
    text: "What is 25% of 200?",
    type: "text-input",
    correctAnswer: "50",
    difficulty: "easy"
  },
  {
    id: 105,
    text: "What is the square root of 81?",
    type: "multiple-choice",
    options: ["9", "8", "7", "10"],
    correctAnswer: "9",
    difficulty: "easy"
  },
  {
    id: 106,
    text: "What is 37 × 9?",
    type: "text-input",
    correctAnswer: "333",
    difficulty: "easy"
  },
  {
    id: 107,
    text: "What is 3² + 4²?",
    type: "multiple-choice",
    options: ["25", "24", "23", "22"],
    correctAnswer: "25",
    difficulty: "easy"
  },
  {
    id: 108,
    text: "What is 1000 - 567?",
    type: "text-input",
    correctAnswer: "433",
    difficulty: "easy"
  },
  {
    id: 109,
    text: "What is 12 × 12?",
    type: "multiple-choice",
    options: ["144", "124", "134", "154"],
    correctAnswer: "144",
    difficulty: "easy"
  },
  {
    id: 110,
    text: "What is 75% of 80?",
    type: "text-input",
    correctAnswer: "60",
    difficulty: "easy"
  }
];

// Pool of hard questions
const hardQuestionsPool: Question[] = [
  {
    id: 201,
    text: "Evaluate: ∫ sin²(x) dx",
    type: "text-input",
    correctAnswer: "x/2 - sin(2x)/4 + C",
    difficulty: "hard"
  },
  {
    id: 202,
    text: "Solve: d²y/dx² - 2dy/dx + y = 0",
    type: "text-input",
    correctAnswer: "y = c₁eˣ + c₂xeˣ",
    difficulty: "hard"
  },
  {
    id: 203,
    text: "Evaluate the limit: limₓ→∞ (ln x)/x",
    type: "text-input",
    correctAnswer: "0",
    difficulty: "hard"
  },
  {
    id: 204,
    text: "What are the eigenvalues of [[3, 1,2], [0, 2, 3],[1, 5, 6]]?",
    type: "text-input",
    correctAnswer: "1,4,6",
    difficulty: "hard"
  },
  {
    id: 205,
    text: "Find the sum: ∑ (1/n³) from n=1 to ∞",
    type: "text-input",
    correctAnswer: "1.202",
    difficulty: "hard"
  },
  {
    id: 206,
    text: "Evaluate: ∫ e^(-x²) dx from -∞ to ∞",
    type: "text-input",
    correctAnswer: "√π",
    difficulty: "hard"
  },
  {
    id: 207,
    text: "Use L'Hôpital's Rule: limₓ→0 (sin x)/x",
    type: "text-input",
    correctAnswer: "1",
    difficulty: "hard"
  },
  {
    id: 208,
    text: "Find the modulus of (7 - 24i)",
    type: "text-input",
    correctAnswer: "25",
    difficulty: "hard"
  },
  {
    id: 209,
    text: "If A = {x ∈ z | x² < 20}, B = {x ∈ z | x is odd}, find A ∩ B",
    type: "text-input",
    correctAnswer: "{-3,-1,1,3}",
    difficulty: "hard"
  },
  {
    id: 210,
    text: "Evaluate: ∫ x·e^x dx",
    type: "text-input",
    correctAnswer: "x·e^x - e^x + C",
    difficulty: "hard"
  },
  {
    id: 211,
    text: "Find det of matrix [[1,2,3],[4,5,6],[7,8,9]]",
    type: "text-input",
    correctAnswer: "0",
    difficulty: "hard"
  },
  {
    id: 212,
    text: "Find inverse of [[2,1,0],[1,1,1],[0,1,2]]",
    type: "text-input",
    correctAnswer: "[[1,-2,1],[-2,4,-2],[1,-2,1]]",
    difficulty: "hard"
  },
  {
    id: 213,
    text: "Evaluate: 421 x 317",
    type: "text-input",
    correctAnswer: "133457",
    difficulty: "hard"
  },
  {
    id: 214,
    text: "Solve: ∫ (ln x)/x dx",
    type: "text-input",
    correctAnswer: "(ln x)²/2 + C",
    difficulty: "hard"
  },
  {
    id: 215,
    text: "Evaluate: limₓ→0 (1 - cos x)/x²",
    type: "text-input",
    correctAnswer: "1/2",
    difficulty: "hard"
  },
  {
    id: 216,
    text: "Calculate rref of [[1, 2.5, 3.5],[1.3, 2.4, 5.7], [4.5, 2.5, 3.7]]",
    type: "text-input",
    correctAnswer: "[[1,0,0],[0,1,0],[0,0,1]]",
    difficulty: "hard"
  }
];

// Helper function to get random questions from a pool
const getRandomQuestions = (pool: Question[], count: number): Question[] => {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Function to get all sample test questions in order
export const getSampleTestQuestions = (): Question[] => {
  // Get 5 random easy questions and 5 random hard questions
  const selectedEasyQuestions = getRandomQuestions(easyQuestionsPool, 5);
  const selectedHardQuestions = getRandomQuestions(hardQuestionsPool, 5);
  
  // Combine them in order (easy first, then hard)
  return [...selectedEasyQuestions, ...selectedHardQuestions];
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