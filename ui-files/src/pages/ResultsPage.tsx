import React, { useEffect, useState } from 'react';
import { CognitiveLoadGraph } from '@/components/CognitiveLoadGraph';
import { useNavigate } from 'react-router-dom';

interface CognitiveLoadData {
  timestamp: string;
  load: 'Low' | 'Medium' | 'High';
}

interface TestScore {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  isSampleTest: boolean;
}

const ResultsPage = () => {
  const navigate = useNavigate();
  const [cognitiveLoadData, setCognitiveLoadData] = useState<CognitiveLoadData[]>([]);
  const [testScore, setTestScore] = useState<TestScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelGraph, setModelGraph] = useState<string | null>(null);
  const [confusionMatrix, setConfusionMatrix] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get test score from localStorage
        const storedScore = localStorage.getItem('testScore');
        
        if (storedScore) {
          const parsedScore = JSON.parse(storedScore);
          console.log('Parsed Test Score:', parsedScore);
          setTestScore(parsedScore);

          // For sample test, fetch model results
          if (parsedScore.isSampleTest) {
            try {
              // Run the model
              await fetch('http://localhost:5001/run-model', { method: 'POST' });
              
              // Get the graphs
              setModelGraph('http://localhost:5001/get-graph');
              setConfusionMatrix('http://localhost:5001/get-confusion-matrix');
            } catch (err) {
              console.error('Error running model:', err);
            }
          } else {
            // For real test, get cognitive load history
            const storedData = localStorage.getItem('cognitiveLoadHistory');
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              setCognitiveLoadData(parsedData);
            }
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load test data.');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleNewTest = () => {
    // Clear localStorage
    localStorage.removeItem('cognitiveLoadHistory');
    localStorage.removeItem('testScore');
    // Navigate back to home
    navigate('/');
  };

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Test Results</h1>
          <button
            onClick={handleNewTest}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Start New Test
          </button>
        </div>
        
        {loading && (
          <div className="text-center">
            <p className="text-lg">Loading results...</p>
          </div>
        )}
        
        {error && (
          <div className="text-center">
            <p className="text-lg text-red-500">{error}</p>
          </div>
        )}
        
        {!loading && !error && (
          <div className="space-y-8">
            {testScore && (
              <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
                <h2 className="text-2xl font-semibold mb-6">Test Score</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Score</h3>
                    <p className="text-2xl font-bold">{testScore.score.toFixed(1)}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Correct Answers</h3>
                    <p className="text-2xl font-bold">
                      {testScore.correctAnswers} / {testScore.totalQuestions}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Test Type</h3>
                    <p className="text-2xl font-bold">
                      {testScore.isSampleTest ? 'Sample Test' : 'Full Test'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {testScore?.isSampleTest && modelGraph && confusionMatrix && (
              <div className="space-y-8">
                <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
                  <h2 className="text-2xl font-semibold mb-6">Model Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Cognitive Load Graph</h3>
                      <img 
                        src={modelGraph} 
                        alt="Model Graph" 
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Confusion Matrix</h3>
                      <img 
                        src={confusionMatrix} 
                        alt="Confusion Matrix" 
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {!testScore?.isSampleTest && cognitiveLoadData.length > 0 && (
              <>
                <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
                  <h2 className="text-2xl font-semibold mb-6">Cognitive Load Over Time</h2>
                  <CognitiveLoadGraph data={cognitiveLoadData} />
                </div>
                
                <div className="bg-card rounded-lg p-6 shadow-lg border border-border">
                  <h2 className="text-2xl font-semibold mb-4">Cognitive Load Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Total Questions</h3>
                      <p className="text-2xl font-bold">{cognitiveLoadData.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-lg font-medium mb-2">High Load Questions</h3>
                      <p className="text-2xl font-bold">
                        {cognitiveLoadData.filter(d => d.load === 'High').length}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="text-lg font-medium mb-2">Average Load</h3>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const loadValues = cognitiveLoadData.map(d => 
                            d.load === 'High' ? 2 : d.load === 'Medium' ? 1 : 0
                          );
                          const avg = loadValues.reduce((a, b) => a + b, 0) / (loadValues.length*2);
                          return avg.toFixed(2);
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {!cognitiveLoadData.length && !testScore && (
              <div className="text-center">
                <p className="text-lg">No test data available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage; 