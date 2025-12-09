import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface CultureFitRadarChartProps {
  candidateScores: {
    hierarchy: number;
    innovation: number;
    teamStyle: number;
    communication: number;
    workLifeBalance: number;
    riskTolerance: number;
    decisionMaking: number;
    feedback: number;
  };
  companyScores?: {
    hierarchy: number;
    innovation: number;
    teamStyle: number;
    communication: number;
    workLifeBalance: number;
    riskTolerance: number;
    decisionMaking: number;
    feedback: number;
  };
  height?: number;
}

export function CultureFitRadarChart({ candidateScores, companyScores, height = 300 }: CultureFitRadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const labels = [
      "Hierarchy",
      "Innovation",
      "Team Style",
      "Communication",
      "Work-Life Balance",
      "Risk Tolerance",
      "Decision Making",
      "Feedback Culture",
    ];

    const candidateData = [
      candidateScores.hierarchy,
      candidateScores.innovation,
      candidateScores.teamStyle,
      candidateScores.communication,
      candidateScores.workLifeBalance,
      candidateScores.riskTolerance,
      candidateScores.decisionMaking,
      candidateScores.feedback,
    ];

    const datasets: any[] = [
      {
        label: "Candidate Preferences",
        data: candidateData,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(59, 130, 246)",
      },
    ];

    if (companyScores) {
      const companyData = [
        companyScores.hierarchy,
        companyScores.innovation,
        companyScores.teamStyle,
        companyScores.communication,
        companyScores.workLifeBalance,
        companyScores.riskTolerance,
        companyScores.decisionMaking,
        companyScores.feedback,
      ];

      datasets.push({
        label: "Company Culture",
        data: companyData,
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(16, 185, 129)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgb(16, 185, 129)",
      });
    }

    chartRef.current = new Chart(ctx, {
      type: "radar",
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
            },
            grid: {
              color: "rgba(0, 0, 0, 0.1)",
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
            position: "bottom",
            labels: {
              padding: 15,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.r}/100`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [candidateScores, companyScores]);

  return (
    <div style={{ height: `${height}px`, position: "relative" }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
