import React, { useEffect, useState } from 'react';

const ResultsPage = () => {
  const [graphUrl, setGraphUrl] = useState<string | null>(null);
  const [confusionMatrixUrl, setConfusionMatrixUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Optionally trigger the model run (if needed)
    fetch('http://localhost:5001/run-model', { method: 'POST' })
      .then(() => {
        setGraphUrl('http://localhost:5001/get-graph');
        setConfusionMatrixUrl('http://localhost:5001/get-confusion-matrix');
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch results. Make sure the backend is running.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Test Results</h1>
        {loading && <p className="text-lg">Loading results...</p>}
        {error && <p className="text-lg text-red-500">{error}</p>}
        {!loading && !error && (
          <div className="space-y-8">
            {graphUrl && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Cognitive Load Graph</h2>
                <img 
                  src={graphUrl} 
                  alt="Cognitive Load Graph" 
                  className="mx-auto my-6 max-w-full h-auto border rounded-lg shadow" 
                />
              </div>
            )}
            {confusionMatrixUrl && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Confusion Matrix</h2>
                <img 
                  src={confusionMatrixUrl} 
                  alt="Confusion Matrix" 
                  className="mx-auto my-6 max-w-full h-auto border rounded-lg shadow" 
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage; 