import { Question } from './dataService';
import { easyQuestionsPool, hardQuestionsPool } from './sampleTestService';

interface CognitiveState {
    load: 'High Load' | 'Low Load' | 'unknown';
    confidence: number;
    last_update: string;
}

class DynamicTestService {
    private currentQuestions: Question[] = [];
    private currentIndex: number = 0;
    private cognitiveState: CognitiveState = {
        load: 'unknown',
        confidence: 0,
        last_update: new Date().toISOString()
    };
    private updateInterval: NodeJS.Timeout | null = null;
    private lastQuestionChange: number = 0;
    private readonly MIN_TIME_BETWEEN_CHANGES = 5000; // 5 seconds

    constructor() {
        this.startCognitiveStateUpdates();
    }

    private async updateCognitiveState() {
        try {
            const response = await fetch('http://localhost:6000/cognitive_state');
            if (response.ok) {
                this.cognitiveState = await response.json();
                this.adjustQuestionDifficulty();
            }
        } catch (error) {
            console.error('Failed to fetch cognitive state:', error);
        }
    }

    private startCognitiveStateUpdates() {
        // Update cognitive state every 3 seconds
        this.updateInterval = setInterval(() => this.updateCognitiveState(), 3000);
    }

    private adjustQuestionDifficulty() {
        // Only adjust if we have high confidence in the cognitive load measurement
        if (this.cognitiveState.confidence < 0.7) {
            return;
        }

        const currentQuestion = this.getCurrentQuestion();
        if (!currentQuestion) return;

        // Check if enough time has passed since last change
        const now = Date.now();
        if (now - this.lastQuestionChange < this.MIN_TIME_BETWEEN_CHANGES) {
            return;
        }

        // If high cognitive load, switch to easier questions
        if (this.cognitiveState.load === 'High Load' && currentQuestion.difficulty === 'hard') {
            this.switchToEasierQuestion();
            this.lastQuestionChange = now;
        }
        // If low cognitive load, switch to harder questions
        else if (this.cognitiveState.load === 'Low Load' && currentQuestion.difficulty === 'easy') {
            this.switchToHarderQuestion();
            this.lastQuestionChange = now;
        }
    }

    private switchToEasierQuestion() {
        const easyQuestion = this.getRandomQuestion(easyQuestionsPool);
        if (easyQuestion) {
            this.currentQuestions[this.currentIndex] = easyQuestion;
            console.log('Switched to easier question:', easyQuestion.id);
        }
    }

    private switchToHarderQuestion() {
        const hardQuestion = this.getRandomQuestion(hardQuestionsPool);
        if (hardQuestion) {
            this.currentQuestions[this.currentIndex] = hardQuestion;
            console.log('Switched to harder question:', hardQuestion.id);
        }
    }

    private getRandomQuestion(pool: Question[]): Question {
        const randomIndex = Math.floor(Math.random() * pool.length);
        return { ...pool[randomIndex] }; // Return a copy to avoid modifying the original
    }

    public initializeTest(totalQuestions: number = 15) {
        console.log('Initializing test with', totalQuestions, 'questions');
        console.log('Available easy questions:', easyQuestionsPool.length);
        console.log('Available hard questions:', hardQuestionsPool.length);

        // Start with a mix of easy and hard questions
        const easyCount = Math.floor(totalQuestions * 0.6);
        const hardCount = totalQuestions - easyCount;

        console.log('Selecting', easyCount, 'easy questions and', hardCount, 'hard questions');

        const selectedEasy = this.getRandomQuestions(easyQuestionsPool, easyCount);
        const selectedHard = this.getRandomQuestions(hardQuestionsPool, hardCount);

        this.currentQuestions = [...selectedEasy, ...selectedHard];
        this.currentIndex = 0;
        this.lastQuestionChange = Date.now();

        console.log('Test initialized with', this.currentQuestions.length, 'questions');
        console.log('Question IDs:', this.currentQuestions.map(q => q.id));
    }

    private getRandomQuestions(pool: Question[], count: number): Question[] {
        if (count > pool.length) {
            console.warn(`Requested ${count} questions but only ${pool.length} available`);
            count = pool.length;
        }
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(q => ({ ...q })); // Return copies
    }

    public getCurrentQuestion(): Question | null {
        if (this.currentIndex < this.currentQuestions.length) {
            return this.currentQuestions[this.currentIndex];
        }
        return null;
    }

    public moveToNextQuestion(): boolean {
        if (this.currentIndex < this.currentQuestions.length - 1) {
            this.currentIndex++;
            this.lastQuestionChange = Date.now(); // Reset the timer when moving to next question
            console.log('Moving to question', this.currentIndex + 1, 'of', this.currentQuestions.length);
            console.log('Current question ID:', this.currentQuestions[this.currentIndex].id);
            return true;
        }
        console.log('Reached end of test');
        return false;
    }

    public getProgress(): { current: number; total: number } {
        return {
            current: this.currentIndex + 1,
            total: this.currentQuestions.length
        };
    }

    public cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

export const dynamicTestService = new DynamicTestService(); 