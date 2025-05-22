import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Question } from "@/services/dataService";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface QuestionCardProps {
  question: Question;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  onNext: () => void;
}

export const QuestionCard = ({ question, onAnswer, onNext }: QuestionCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    onAnswer(correct, selectedAnswer);
  };

  const handleNext = () => {
    setSelectedAnswer('');
    setShowFeedback(false);
    onNext();
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
          
          {question.type === 'multiple-choice' && question.options && (
            <RadioGroup
              value={selectedAnswer}
              onValueChange={setSelectedAnswer}
              className="space-y-4 mb-6"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === 'text-input' && (
            <Input
              type="text"
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="mb-6"
            />
          )}
          
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 ${
                isCorrect ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}
            >
              {isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`}
            </motion.div>
          )}
          
          <div className="mt-6 flex justify-end">
            {!showFeedback ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedAnswer}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next Question
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
