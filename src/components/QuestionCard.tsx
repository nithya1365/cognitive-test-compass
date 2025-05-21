
import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Question } from "@/services/dataService";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  question: Question;
  onAnswer: (isCorrect: boolean) => void;
  onNext: () => void;
}

export const QuestionCard = ({ question, onAnswer, onNext }: QuestionCardProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };
  
  const handleSubmit = () => {
    if (!selectedOption || isAnswered) return;
    
    const isCorrect = selectedOption === question.correctAnswer;
    setIsAnswered(true);
    onAnswer(isCorrect);
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    onNext();
  };

  const getOptionClass = (option: string) => {
    if (!isAnswered) {
      return selectedOption === option 
        ? "border-primary bg-primary/10" 
        : "border-border hover:border-primary/50 hover:bg-card/80";
    }

    if (option === question.correctAnswer) {
      return "border-green-500 bg-green-500/10 text-green-400";
    }

    if (selectedOption === option && option !== question.correctAnswer) {
      return "border-red-500 bg-red-500/10 text-red-400";
    }

    return "border-border opacity-60";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-xl mx-auto"
    >
      <Card className="shadow-md border border-border">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-4">{question.text}</h2>
          </div>
          
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswered}
                className={cn(
                  "w-full py-4 px-5 rounded-xl text-left border-2 transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  getOptionClass(option)
                )}
              >
                <span className="text-base">{option}</span>
              </button>
            ))}
          </div>
          
          {!isAnswered ? (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleSubmit}
                disabled={!selectedOption}
                className="px-6"
              >
                Submit Answer
              </Button>
            </div>
          ) : (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={handleNext} 
                className="px-6"
              >
                Next Question
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
