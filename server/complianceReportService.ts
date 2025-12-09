import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  getComplianceAnalytics,
  getComplianceTrends,
  getActiveAlerts,
  getExpiringDocuments,
} from './visaComplianceDb';

export interface ComplianceReportData {
  analytics: Awaited<ReturnType<typeof getComplianceAnalytics>>;
  trends: Awaited<ReturnType<typeof getComplianceTrends>>;
  alerts: Awaited<ReturnType<typeof getActiveAlerts>>;
  expiringDocs: Awaited<ReturnType<typeof getExpiringDocuments>>;
  generatedAt: Date;
  employerId: number;
}

/**
 * Generate compliance report data
 */
export async function generateReportData(employerId: number): Promise<ComplianceReportData> {
  const [analytics, trends, alerts, expiringDocs] = await Promise.all([
    getComplianceAnalytics(employerId),
    getComplianceTrends(employerId, 90),
    getActiveAlerts(),
    getExpiringDocuments(30),
  ]);
  
  return {
    analytics,
    trends,
    alerts,
    expiringDocs,
    generatedAt: new Date(),
    employerId,
  };
}

/**
 * Generate PDF compliance report
 */
export async function generatePDFReport(data: ComplianceReportData): Promise<Buffer> {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Visa Compliance Report', 14, 20);
  
  // Report metadata
  doc.setFontSize(10);
  doc.text(`Generated: ${data.generatedAt.toLocaleString()}`, 14, 30);
  doc.text(`Employer ID: ${data.employerId}`, 14, 35);
  
  // Overview section
  doc.setFontSize(14);
  doc.text('Compliance Overview', 14, 45);
  
  doc.setFontSize(10);
  const overviewData = [
    ['Total Employees', data.analytics.totalEmployees.toString()],
    ['Valid Documents', data.analytics.validDocuments.toString()],
    ['Expiring Soon (30 days)', data.analytics.expiringSoon.toString()],
    ['Expired Documents', data.analytics.expired.toString()],
    ['Pending Renewals', data.analytics.pendingRenewal.toString()],
    ['Critical Alerts', data.analytics.criticalAlerts.toString()],
    ['Warning Alerts', data.analytics.warningAlerts.toString()],
  ];
  
  autoTable(doc, {
    startY: 50,
    head: [['Metric', 'Value']],
    body: overviewData,
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Active Alerts section
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.setFontSize(14);
  doc.text('Active Compliance Alerts', 14, finalY + 10);
  
  if (data.alerts.length > 0) {
    const alertsData = data.alerts.slice(0, 20).map(item => [
      `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`,
      item.alert.severity,
      item.alert.alertType.replace(/_/g, ' '),
      item.alert.message.substring(0, 50) + (item.alert.message.length > 50 ? '...' : ''),
    ]);
    
    autoTable(doc, {
      startY: finalY + 15,
      head: [['Employee', 'Severity', 'Type', 'Message']],
      body: alertsData,
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68] },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 40 },
        3: { cellWidth: 80 },
      },
    });
  } else {
    doc.setFontSize(10);
    doc.text('No active alerts', 14, finalY + 20);
  }
  
  // Expiring Documents section
  const alertsFinalY = (doc as any).lastAutoTable?.finalY || finalY + 30;
  
  // Add new page if needed
  if (alertsFinalY > 250) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Expiring Documents (Next 30 Days)', 14, 20);
    
    if (data.expiringDocs.length > 0) {
      const expiringData = data.expiringDocs.slice(0, 20).map(item => [
        `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`,
        item.compliance?.documentType || '',
        item.compliance?.expiryDate ? new Date(item.compliance.expiryDate).toLocaleDateString() : '',
        item.compliance?.daysUntilExpiry?.toString() || '',
      ]);
      
      autoTable(doc, {
        startY: 25,
        head: [['Employee', 'Document Type', 'Expiry Date', 'Days Remaining']],
        body: expiringData,
        theme: 'striped',
        headStyles: { fillColor: [251, 146, 60] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('No documents expiring in the next 30 days', 14, 30);
    }
  } else {
    doc.setFontSize(14);
    doc.text('Expiring Documents (Next 30 Days)', 14, alertsFinalY + 10);
    
    if (data.expiringDocs.length > 0) {
      const expiringData = data.expiringDocs.slice(0, 20).map(item => [
        `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`,
        item.compliance?.documentType || '',
        item.compliance?.expiryDate ? new Date(item.compliance.expiryDate).toLocaleDateString() : '',
        item.compliance?.daysUntilExpiry?.toString() || '',
      ]);
      
      autoTable(doc, {
        startY: alertsFinalY + 15,
        head: [['Employee', 'Document Type', 'Expiry Date', 'Days Remaining']],
        body: expiringData,
        theme: 'striped',
        headStyles: { fillColor: [251, 146, 60] },
      });
    } else {
      doc.setFontSize(10);
      doc.text('No documents expiring in the next 30 days', 14, alertsFinalY + 20);
    }
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} | Oracle Smart Recruitment System`,
      14,
      doc.internal.pageSize.height - 10
    );
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate Excel compliance report
 */
export async function generateExcelReport(data: ComplianceReportData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();
  
  // Overview sheet
  const overviewData = [
    ['Visa Compliance Report'],
    ['Generated', data.generatedAt.toLocaleString()],
    ['Employer ID', data.employerId],
    [],
    ['Metric', 'Value'],
    ['Total Employees', data.analytics.totalEmployees],
    ['Valid Documents', data.analytics.validDocuments],
    ['Expiring Soon (30 days)', data.analytics.expiringSoon],
    ['Expired Documents', data.analytics.expired],
    ['Pending Renewals', data.analytics.pendingRenewal],
    ['Critical Alerts', data.analytics.criticalAlerts],
    ['Warning Alerts', data.analytics.warningAlerts],
    ['Info Alerts', data.analytics.infoAlerts],
  ];
  
  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');
  
  // Active Alerts sheet
  const alertsData = [
    ['Employee Name', 'Severity', 'Alert Type', 'Message', 'Document Type', 'Expiry Date', 'Created At'],
    ...data.alerts.map(item => [
      `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`,
      item.alert.severity,
      item.alert.alertType,
      item.alert.message,
      item.compliance?.documentType || '',
      item.compliance?.expiryDate ? new Date(item.compliance.expiryDate).toLocaleDateString() : '',
      new Date(item.alert.createdAt).toLocaleString(),
    ]),
  ];
  
  const alertsSheet = XLSX.utils.aoa_to_sheet(alertsData);
  XLSX.utils.book_append_sheet(workbook, alertsSheet, 'Active Alerts');
  
  // Expiring Documents sheet
  const expiringData = [
    ['Employee Name', 'Document Type', 'Document Number', 'Issue Date', 'Expiry Date', 'Days Remaining', 'Status'],
    ...data.expiringDocs.map(item => [
      `${item.employee?.firstName || ''} ${item.employee?.lastName || ''}`,
      item.compliance?.documentType || '',
      item.compliance?.documentNumber || '',
      item.compliance?.issueDate ? new Date(item.compliance.issueDate).toLocaleDateString() : '',
      item.compliance?.expiryDate ? new Date(item.compliance.expiryDate).toLocaleDateString() : '',
      item.compliance?.daysUntilExpiry || '',
      item.compliance?.status || '',
    ]),
  ];
  
  const expiringSheet = XLSX.utils.aoa_to_sheet(expiringData);
  XLSX.utils.book_append_sheet(workbook, expiringSheet, 'Expiring Documents');
  
  // Trends sheet
  const trendsData = [
    ['Date', 'Document Type', 'Status', 'Expiry Date'],
    ...data.trends.map(item => [
      new Date(item.createdAt).toLocaleDateString(),
      item.documentType,
      item.status,
      new Date(item.expiryDate).toLocaleDateString(),
    ]),
  ];
  
  const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
  XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Trends (90 days)');
  
  // Generate buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return excelBuffer;
}
