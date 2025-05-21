
import { useEffect, useState } from 'react';
import { formatTime } from '@/utils/timeUtils';
import { BCIMetrics } from '@/services/dataService';
import { MetricsChart } from './MetricsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SessionSidebarProps {
  questionCount: number;
  totalQuestions: number;
  metricsHistory: BCIMetrics[];
}

export const SessionSidebar = ({ 
  questionCount, 
  totalQuestions, 
  metricsHistory 
}: SessionSidebarProps) => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full md:w-64 lg:w-80 bg-sidebar p-4 border-r border-border">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Session Info</h2>
      
      <Card className="mb-4 bg-card/50 border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Time Elapsed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatTime(timer)}</div>
        </CardContent>
      </Card>
      
      <Card className="mb-4 bg-card/50 border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Question Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{questionCount} <span className="text-base font-normal text-muted-foreground">of {totalQuestions}</span></div>
          <div className="w-full bg-muted h-2 rounded-full mt-2">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${(questionCount / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card/50 border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Metrics History</CardTitle>
        </CardHeader>
        <CardContent>
          {metricsHistory.length > 0 ? (
            <MetricsChart data={metricsHistory} />
          ) : (
            <div className="text-muted-foreground text-sm text-center py-12">
              No data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
