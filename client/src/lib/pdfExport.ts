import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * PDF Export Utility for Saudization Reports
 * 
 * Generates comprehensive PDF reports with charts, metrics, and recommendations
 */

interface SaudizationSnapshot {
  snapshotDate: Date | null;
  totalEmployees: number | null;
  saudiMales: number | null;
  saudiFemales: number | null;
  expatMales: number | null;
  expatFemales: number | null;
  saudiDisabled: number | null;
  saudiTrainees: number | null;
  partTimeEmployees: number | null;
  totalSaudis: number | null;
  totalExpats: number | null;
  rawSaudizationRate: number | null;
  adjustedSaudiCount: number | null;
  adjustedTotalCount: number | null;
  adjustedSaudizationRate: number | null;
  nitaqatColor: string | null;
  nitaqatCategory: string | null;
  requiredSaudizationRate: number | null;
  isCompliant: boolean | null;
  marginToNextBand: number | null;
  marginToRedZone: number | null;
  saudisNeededForGreen: number | null;
  saudisNeededForPlatinum: number | null;
  expatsCanHire: number | null;
}

/**
 * Export Saudization report to PDF
 */
export async function exportSaudizationReportToPDF(
  snapshot: SaudizationSnapshot,
  chartElements?: {
    trendChart?: HTMLElement;
    compositionChart?: HTMLElement;
    growthChart?: HTMLElement;
  }
) {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Saudization Compliance Report', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`,
    pageWidth / 2,
    yPosition,
    { align: 'center' }
  );
  
  yPosition += 15;
  pdf.setTextColor(0, 0, 0);

  // Executive Summary Section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Executive Summary', 15, yPosition);
  yPosition += 10;

  // Compliance Status Box
  const boxX = 15;
  const boxWidth = pageWidth - 30;
  const boxHeight = 25;
  
  if (snapshot.isCompliant) {
    pdf.setFillColor(220, 252, 231); // Green background
    pdf.setDrawColor(34, 197, 94); // Green border
  } else {
    pdf.setFillColor(254, 226, 226); // Red background
    pdf.setDrawColor(239, 68, 68); // Red border
  }
  
  pdf.rect(boxX, yPosition, boxWidth, boxHeight, 'FD');
  
  yPosition += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(
    snapshot.isCompliant ? '✓ Compliant' : '⚠ Non-Compliant',
    boxX + 5,
    yPosition
  );
  
  yPosition += 6;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Nitaqat Band: ${snapshot.nitaqatColor?.toUpperCase()} | ` +
    `Saudization Rate: ${snapshot.adjustedSaudizationRate}% | ` +
    `Category: ${snapshot.nitaqatCategory}`,
    boxX + 5,
    yPosition
  );
  
  yPosition += 6;
  pdf.text(
    `Total Employees: ${snapshot.totalEmployees} (${snapshot.totalSaudis} Saudis, ${snapshot.totalExpats} Expats)`,
    boxX + 5,
    yPosition
  );
  
  yPosition += 15;

  // Key Metrics Table
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Metrics', 15, yPosition);
  yPosition += 8;

  const metrics = [
    ['Metric', 'Value'],
    ['Raw Saudization Rate', `${snapshot.rawSaudizationRate}%`],
    ['Adjusted Saudization Rate', `${snapshot.adjustedSaudizationRate}%`],
    ['Required Rate', `${snapshot.requiredSaudizationRate}%`],
    ['Margin to Red Zone', `${snapshot.marginToRedZone}%`],
    ['Expats Can Hire', `${snapshot.expatsCanHire}`]
  ];

  const cellWidth = (pageWidth - 30) / 2;
  const cellHeight = 8;

  metrics.forEach((row, index) => {
    if (index === 0) {
      pdf.setFillColor(59, 130, 246);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
    } else {
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
    }

    pdf.rect(15, yPosition, cellWidth, cellHeight, 'F');
    pdf.rect(15 + cellWidth, yPosition, cellWidth, cellHeight, 'F');
    
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(15, yPosition, cellWidth, cellHeight);
    pdf.rect(15 + cellWidth, yPosition, cellWidth, cellHeight);

    pdf.text(row[0], 17, yPosition + 5.5);
    pdf.text(row[1], 17 + cellWidth, yPosition + 5.5);

    yPosition += cellHeight;
  });

  yPosition += 10;

  // Employee Breakdown
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Employee Breakdown', 15, yPosition);
  yPosition += 8;

  const breakdown = [
    ['Category', 'Count', 'Multiplier', 'Adjusted'],
    ['Saudi Males', `${snapshot.saudiMales}`, '1x', `${snapshot.saudiMales}`],
    ['Saudi Females', `${snapshot.saudiFemales}`, '2x', `${(snapshot.saudiFemales || 0) * 2}`],
    ['Saudi Disabled', `${snapshot.saudiDisabled}`, '4x', `${(snapshot.saudiDisabled || 0) * 4}`],
    ['Saudi Trainees', `${snapshot.saudiTrainees}`, '0.5x', `${(snapshot.saudiTrainees || 0) * 0.5}`],
    ['Expat Males', `${snapshot.expatMales}`, '1x', `${snapshot.expatMales}`],
    ['Expat Females', `${snapshot.expatFemales}`, '1x', `${snapshot.expatFemales}`],
    ['Part-time', `${snapshot.partTimeEmployees}`, '0.5x', `${(snapshot.partTimeEmployees || 0) * 0.5}`]
  ];

  const colWidths = [(pageWidth - 30) * 0.4, (pageWidth - 30) * 0.2, (pageWidth - 30) * 0.2, (pageWidth - 30) * 0.2];

  breakdown.forEach((row, index) => {
    if (index === 0) {
      pdf.setFillColor(59, 130, 246);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
    } else {
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
      } else {
        pdf.setFillColor(255, 255, 255);
      }
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
    }

    let xPos = 15;
    row.forEach((cell, colIndex) => {
      pdf.rect(xPos, yPosition, colWidths[colIndex], cellHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(xPos, yPosition, colWidths[colIndex], cellHeight);
      pdf.text(cell, xPos + 2, yPosition + 5.5);
      xPos += colWidths[colIndex];
    });

    yPosition += cellHeight;
  });

  yPosition += 10;

  // Add new page for charts
  if (chartElements && Object.keys(chartElements).length > 0) {
    pdf.addPage();
    yPosition = 20;

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Visual Analytics', 15, yPosition);
    yPosition += 10;

    // Add charts as images
    if (chartElements.trendChart) {
      try {
        const canvas = await html2canvas(chartElements.trendChart, {
          scale: 2,
          backgroundColor: '#ffffff' as any
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error adding trend chart to PDF:', error);
      }
    }

    if (chartElements.compositionChart && yPosition < pageHeight - 60) {
      try {
        const canvas = await html2canvas(chartElements.compositionChart, {
          scale: 2,
          backgroundColor: '#ffffff' as any
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error('Error adding composition chart to PDF:', error);
      }
    }
  }

  // Add new page for recommendations
  pdf.addPage();
  yPosition = 20;

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Recommendations', 15, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const recommendations = [
    {
      title: 'Prioritize Saudi Female Hiring',
      description: 'Each Saudi female employee counts as 2 employees in Saudization calculations, providing the highest impact on your compliance rate.'
    },
    {
      title: 'Monitor Hiring Capacity',
      description: `You can currently hire up to ${snapshot.expatsCanHire} expat employees without affecting your Nitaqat band status.`
    },
    {
      title: 'Maintain Safety Margin',
      description: `Your current margin to red zone is ${snapshot.marginToRedZone}%. Maintain at least 10% margin for safety.`
    },
    {
      title: 'Regular Monitoring',
      description: 'Set up automated weekly syncs to track your Saudization rate and catch any declining trends early.'
    }
  ];

  recommendations.forEach((rec, index) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${index + 1}. ${rec.title}`, 15, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(rec.description, pageWidth - 35);
    pdf.text(lines, 20, yPosition);
    yPosition += lines.length * 5 + 5;
  });

  // Footer
  const footerY = pageHeight - 10;
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(
    'Oracle Smart Recruitment System - Saudization Compliance Report',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  // Save PDF
  const filename = `Saudization_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}
