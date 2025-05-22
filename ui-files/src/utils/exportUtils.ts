import { BCIMetrics } from "@/services/dataService";

export interface TestResult {
  questionId: number;
  question: string;
  difficulty: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  timeSpent: number;
  alpha: number;
  beta: number;
  theta: number;
  cognitiveLoad: string;
  timestamp: string;
}

// Helper function to properly escape CSV values
const escapeCSV = (value: any): string => {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If the value contains commas, quotes, or newlines, wrap it in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export const exportToCSV = (results: TestResult[]) => {
  // Create CSV headers
  const headers = [
    "Question ID",
    "Question",
    "Difficulty",
    "Correct",
    "User Answer",
    "Correct Answer",
    "Time Spent (s)",
    "Alpha",
    "Beta",
    "Theta",
    "Cognitive Load",
    "Timestamp"
  ];
  
  // Convert results to CSV rows with proper escaping
  const rows = results.map(result => [
    escapeCSV(result.questionId),
    escapeCSV(result.question),
    escapeCSV(result.difficulty),
    escapeCSV(result.isCorrect ? "Yes" : "No"),
    escapeCSV(result.userAnswer),
    escapeCSV(result.correctAnswer),
    escapeCSV(result.timeSpent.toFixed(2)),
    escapeCSV(result.alpha.toFixed(2)),
    escapeCSV(result.beta.toFixed(2)),
    escapeCSV(result.theta.toFixed(2)),
    escapeCSV(result.cognitiveLoad),
    escapeCSV(result.timestamp)
  ]);
  
  // Combine headers and rows with proper line endings
  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map(row => row.join(","))
  ].join("\r\n"); // Use Windows-style line endings for better compatibility
  
  // Create a Blob with BOM for Excel compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { 
    type: "text/csv;charset=utf-8" 
  });
  
  // Create and trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `cognitive-test-results-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up the URL object
};
