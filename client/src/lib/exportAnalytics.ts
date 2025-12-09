import * as XLSX from 'xlsx';

interface AnalyticsData {
  stats: {
    totalCandidates: number;
    totalInterviews: number;
    acceptanceRate: number;
    avgTimeToHire: number;
  };
  sourceData: Array<{ source: string; count: number; percentage: number }>;
  trendData: Array<{ month: string; hired: number; rejected: number; pending: number }>;
  jobRates: Array<{ position: string; acceptanceRate: number; totalApplicants: number }>;
}

interface ExportOptions {
  dateRange: string;
  position?: string;
  source?: string;
}

/**
 * تصدير Analytics data إلى Excel
 */
export function exportToExcel(data: AnalyticsData, options: ExportOptions) {
  // إنشاء workbook جديد
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary Stats
  const summaryData = [
    ['إحصائيات عامة', ''],
    ['إجمالي المرشحين', data.stats.totalCandidates],
    ['إجمالي المقابلات', data.stats.totalInterviews],
    ['معدل القبول', `${data.stats.acceptanceRate}%`],
    ['متوسط وقت التوظيف', `${data.stats.avgTimeToHire} يوم`],
    [''],
    ['الفلاتر المطبقة', ''],
    ['الفترة الزمنية', options.dateRange],
    ['الوظيفة', options.position || 'الكل'],
    ['المصدر', options.source || 'الكل'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, ws1, 'ملخص');

  // Sheet 2: Source Effectiveness
  if (data.sourceData && data.sourceData.length > 0) {
    const sourceHeaders = [['المصدر', 'العدد', 'النسبة المئوية']];
    const sourceRows = data.sourceData.map((s: any) => [
      s.source,
      s.count,
      `${s.percentage}%`
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([...sourceHeaders, ...sourceRows]);
    XLSX.utils.book_append_sheet(wb, ws2, 'المصادر');
  }

  // Sheet 3: Monthly Trend
  if (data.trendData && data.trendData.length > 0) {
    const trendHeaders = [['الشهر', 'تم التوظيف', 'مرفوض', 'قيد المراجعة']];
    const trendRows = data.trendData.map((t: any) => [
      t.month,
      t.hired,
      t.rejected,
      t.pending
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([...trendHeaders, ...trendRows]);
    XLSX.utils.book_append_sheet(wb, ws3, 'الاتجاه الشهري');
  }

  // Sheet 4: Job Acceptance Rates
  if (data.jobRates && data.jobRates.length > 0) {
    const jobHeaders = [['الوظيفة', 'معدل القبول', 'إجمالي المتقدمين']];
    const jobRows = data.jobRates.map((j: any) => [
      j.position,
      `${j.acceptanceRate}%`,
      j.totalApplicants
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([...jobHeaders, ...jobRows]);
    XLSX.utils.book_append_sheet(wb, ws4, 'معدلات القبول');
  }

  // تصدير الملف
  const fileName = `analytics-report-${options.dateRange}-${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * تصدير Analytics data إلى CSV
 */
export function exportToCSV(data: AnalyticsData, options: ExportOptions) {
  // إنشاء CSV content
  let csvContent = 'تقرير التحليلات\n\n';
  
  // Summary Stats
  csvContent += 'إحصائيات عامة\n';
  csvContent += `إجمالي المرشحين,${data.stats.totalCandidates}\n`;
  csvContent += `إجمالي المقابلات,${data.stats.totalInterviews}\n`;
  csvContent += `معدل القبول,${data.stats.acceptanceRate}%\n`;
  csvContent += `متوسط وقت التوظيف,${data.stats.avgTimeToHire} يوم\n\n`;
  
  // Filters
  csvContent += 'الفلاتر المطبقة\n';
  csvContent += `الفترة الزمنية,${options.dateRange}\n`;
  csvContent += `الوظيفة,${options.position || 'الكل'}\n`;
  csvContent += `المصدر,${options.source || 'الكل'}\n\n`;
  
  // Source Data
  if (data.sourceData && data.sourceData.length > 0) {
    csvContent += 'فعالية المصادر\n';
    csvContent += 'المصدر,العدد,النسبة المئوية\n';
    data.sourceData.forEach((s: any) => {
      csvContent += `${s.source},${s.count},${s.percentage}%\n`;
    });
    csvContent += '\n';
  }
  
  // Trend Data
  if (data.trendData && data.trendData.length > 0) {
    csvContent += 'الاتجاه الشهري\n';
    csvContent += 'الشهر,تم التوظيف,مرفوض,قيد المراجعة\n';
    data.trendData.forEach((t: any) => {
      csvContent += `${t.month},${t.hired},${t.rejected},${t.pending}\n`;
    });
    csvContent += '\n';
  }
  
  // Job Rates
  if (data.jobRates && data.jobRates.length > 0) {
    csvContent += 'معدلات القبول حسب الوظيفة\n';
    csvContent += 'الوظيفة,معدل القبول,إجمالي المتقدمين\n';
    data.jobRates.forEach((j: any) => {
      csvContent += `${j.position},${j.acceptanceRate}%,${j.totalApplicants}\n`;
    });
  }
  
  // تحويل إلى Blob وتنزيل
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `analytics-report-${options.dateRange}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
