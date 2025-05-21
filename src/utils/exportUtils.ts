import { BCIMetrics } from "@/services/dataService";

export interface TestResult {
  questionId: number;
  question: string;
  difficulty: string;
  isCorrect: boolean;
  timeSpent: number;
  alpha: number;
  beta: number;
  theta: number;
  cognitiveLoad: string;
}

export const exportToCSV = (results: TestResult[]) => {
  // Create CSV headers
  const headers = [
    "Question ID",
    "Question",
    "Difficulty",
    "Correct",
    "Time Spent (s)",
    "Alpha",
    "Beta",
    "Theta",
    "Cognitive Load"
  ];
  
  // Convert results to CSV rows
  const rows = results.map(result => [
    result.questionId,
    `"${result.question.replace(/"/g, '""')}"`, // Escape quotes in question text
    result.difficulty,
    result.isCorrect ? "Yes" : "No",
    result.timeSpent,
    result.alpha,
    result.beta,
    result.theta,
    result.cognitiveLoad
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
  
  // Create a Blob and download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  link.setAttribute("href", url);
  link.setAttribute("download", `cognitive-test-results-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.display = "none";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
