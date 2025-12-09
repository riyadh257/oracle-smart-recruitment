import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface CultureFitRadarProps {
  candidateProfile: {
    hierarchy: number;
    innovation: number;
    teamStyle: number;
    communication: number;
    decisionMaking: number;
    workPace: number;
    riskTolerance: number;
    feedbackCulture: number;
  };
  companyProfile: {
    hierarchy: number;
    innovation: number;
    teamStyle: number;
    communication: number;
    decisionMaking: number;
    workPace: number;
    riskTolerance: number;
    feedbackCulture: number;
  };
  matchScore: number;
  className?: string;
}

export default function CultureFitRadar({
  candidateProfile,
  companyProfile,
  matchScore,
  className = '',
}: CultureFitRadarProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Destroy existing chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = [
      'Hierarchy',
      'Innovation',
      'Team Style',
      'Communication',
      'Decision Making',
      'Work Pace',
      'Risk Tolerance',
      'Feedback Culture',
    ];

    const candidateData = [
      candidateProfile.hierarchy,
      candidateProfile.innovation,
      candidateProfile.teamStyle,
      candidateProfile.communication,
      candidateProfile.decisionMaking,
      candidateProfile.workPace,
      candidateProfile.riskTolerance,
      candidateProfile.feedbackCulture,
    ];

    const companyData = [
      companyProfile.hierarchy,
      companyProfile.innovation,
      companyProfile.teamStyle,
      companyProfile.communication,
      companyProfile.decisionMaking,
      companyProfile.workPace,
      companyProfile.riskTolerance,
      companyProfile.feedbackCulture,
    ];

    const options: ChartOptions<'radar'> = {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2,
            font: {
              size: 10,
            },
          },
          pointLabels: {
            font: {
              size: 11,
            },
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            font: {
              size: 12,
            },
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.r;
              return `${label}: ${value.toFixed(1)}/10`;
            },
          },
        },
      },
    };

    chartInstanceRef.current = new ChartJS(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Candidate Profile',
            data: candidateData,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 2,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(59, 130, 246)',
          },
          {
            label: 'Company Profile',
            data: companyData,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 2,
            pointBackgroundColor: 'rgb(16, 185, 129)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(16, 185, 129)',
          },
        ],
      },
      options,
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [candidateProfile, companyProfile]);

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Culture Fit Analysis</h3>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Match Score</div>
          <div className={`text-2xl font-bold ${getMatchColor(matchScore)}`}>
            {matchScore.toFixed(1)}%
          </div>
        </div>
      </div>
      <div style={{ height: '300px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}
