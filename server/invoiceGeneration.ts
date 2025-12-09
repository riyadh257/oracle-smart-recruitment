import { getDb } from "./db";
import { billingRecords, employers, applications } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { storagePut } from "../storage";

/**
 * Automated Invoice Generation System
 * Generates monthly invoices based on pay-for-performance billing model
 */

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  periodStart: string;
  periodEnd: string;
  employer: {
    companyName: string;
    contactEmail: string;
    contactPhone?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

/**
 * Calculate billing for a specific period
 */
export async function calculateBillingForPeriod(
  employerId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<{ qualifiedApplications: number; scheduledInterviews: number; totalAmount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Count qualified applications (reached interviewing stage)
  const qualifiedApps = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(
      and(
        eq(applications.employerId, employerId),
        eq(applications.qualifiesForBilling, true),
        gte(applications.createdAt, periodStart),
        lte(applications.createdAt, periodEnd)
      )
    );

  const qualifiedApplications = Number(qualifiedApps[0]?.count || 0);

  // Count scheduled interviews (additional metric)
  const scheduledInterviews = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(
      and(
        eq(applications.employerId, employerId),
        eq(applications.status, "interviewing"),
        gte(applications.updatedAt, periodStart),
        lte(applications.updatedAt, periodEnd)
      )
    );

  const interviewCount = Number(scheduledInterviews[0]?.count || 0);

  // Pricing: $50 per qualified application + $25 per scheduled interview
  const applicationFee = qualifiedApplications * 50;
  const interviewFee = interviewCount * 25;
  const totalAmount = applicationFee + interviewFee;

  return {
    qualifiedApplications,
    scheduledInterviews: interviewCount,
    totalAmount,
  };
}

/**
 * Generate invoice PDF using HTML template
 */
async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 0;
      padding: 40px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 20px;
    }
    .company-info {
      font-size: 24px;
      font-weight: bold;
      color: #3B82F6;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #1E40AF;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 14px;
      color: #666;
    }
    .billing-details {
      margin-bottom: 30px;
    }
    .billing-details h3 {
      margin-bottom: 10px;
      color: #1E40AF;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #3B82F6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #ddd;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
      margin-top: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .totals-row.total {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #333;
      padding-top: 12px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-info">
      Oracle Smart Recruitment
    </div>
    <div class="invoice-info">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${invoiceData.invoiceNumber}</div>
      <div class="invoice-number">Date: ${invoiceData.invoiceDate}</div>
    </div>
  </div>

  <div class="billing-details">
    <h3>Bill To:</h3>
    <div>${invoiceData.employer.companyName}</div>
    <div>${invoiceData.employer.contactEmail}</div>
    ${invoiceData.employer.contactPhone ? `<div>${invoiceData.employer.contactPhone}</div>` : ""}
  </div>

  <div class="billing-details">
    <h3>Billing Period:</h3>
    <div>${invoiceData.periodStart} to ${invoiceData.periodEnd}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="text-right">Quantity</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${invoiceData.lineItems
        .map(
          (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">$${item.unitPrice.toFixed(2)}</td>
          <td class="text-right">$${item.total.toFixed(2)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>$${invoiceData.subtotal.toFixed(2)}</span>
    </div>
    <div class="totals-row">
      <span>Tax (0%):</span>
      <span>$${invoiceData.tax.toFixed(2)}</span>
    </div>
    <div class="totals-row total">
      <span>Total:</span>
      <span>$${invoiceData.total.toFixed(2)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>Oracle Smart Recruitment System - Pay-for-Performance Billing</p>
    <p>Questions? Contact us at billing@oraclesmart.com</p>
  </div>
</body>
</html>
  `;

  // Use WeasyPrint to convert HTML to PDF
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const fs = await import("fs");
  const path = await import("path");
  const os = await import("os");

  const tempDir = os.tmpdir();
  const htmlPath = path.join(tempDir, `invoice-${Date.now()}.html`);
  const pdfPath = path.join(tempDir, `invoice-${Date.now()}.pdf`);

  // Write HTML to temp file
  fs.writeFileSync(htmlPath, html);

  // Convert to PDF using manus-md-to-pdf utility (which uses WeasyPrint)
  try {
    // Create a simple markdown wrapper for the HTML
    await execAsync(`echo '${html.replace(/'/g, "'\\''")}' | weasyprint - ${pdfPath}`);
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Clean up temp files
    fs.unlinkSync(htmlPath);
    fs.unlinkSync(pdfPath);

    return pdfBuffer;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate invoice PDF");
  }
}

/**
 * Generate and store invoice for a billing period
 */
export async function generateInvoice(
  employerId: number,
  periodStart: Date,
  periodEnd: Date
): Promise<{ invoiceUrl: string; billingRecordId: number; invoiceNumber: string; total: number; period: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get employer details
  const employer = await db.select().from(employers).where(eq(employers.id, employerId)).limit(1);
  if (!employer[0]) throw new Error("Employer not found");

  // Calculate billing
  const billing = await calculateBillingForPeriod(employerId, periodStart, periodEnd);

  // Create billing record
  const billingRecord = await db.insert(billingRecords).values({
    employerId,
    periodStart,
    periodEnd,
    qualifiedApplications: billing.qualifiedApplications,
    scheduledInterviews: billing.scheduledInterviews,
    totalAmount: billing.totalAmount,
    status: "pending",
  });

  const billingRecordId = Number(billingRecord.insertId);

  // Generate invoice number
  const invoiceNumber = `INV-${employerId}-${Date.now()}`;

  // Prepare invoice data
  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate: new Date().toISOString().split("T")[0],
    periodStart: periodStart.toISOString().split("T")[0],
    periodEnd: periodEnd.toISOString().split("T")[0],
    employer: {
      companyName: employer[0].companyName,
      contactEmail: employer[0].contactEmail || "",
      contactPhone: employer[0].contactPhone || undefined,
    },
    lineItems: [
      {
        description: "Qualified Applications (Pay-for-Performance)",
        quantity: billing.qualifiedApplications,
        unitPrice: 50,
        total: billing.qualifiedApplications * 50,
      },
      {
        description: "Scheduled Interviews",
        quantity: billing.scheduledInterviews,
        unitPrice: 25,
        total: billing.scheduledInterviews * 25,
      },
    ],
    subtotal: billing.totalAmount,
    tax: 0,
    total: billing.totalAmount,
  };

  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoiceData);

  // Upload to S3
  const fileKey = `invoices/${employerId}/${invoiceNumber}.pdf`;
  const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

  return {
    invoiceUrl: url,
    billingRecordId,
    invoiceNumber,
    total: billing.totalAmount,
    period: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
  };
}

/**
 * Generate invoices for all employers for the previous month
 * This should be called by a scheduled task on the 1st of each month
 */
export async function generateMonthlyInvoices(): Promise<{
  successCount: number;
  errorCount: number;
  totalAmount: number;
  invoices: Array<{ employerId: number; amount: number; invoiceNumber: string; period: string; url: string; dueDate: string; totalAmount: number; id: number }>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all active employers
  const activeEmployers = await db.select().from(employers).where(eq(employers.accountStatus, "active"));

  // Calculate previous month period
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
  const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // First day of previous month

  let successCount = 0;
  let errorCount = 0;
  let totalAmount = 0;
  const invoices: Array<{ employerId: number; amount: number; invoiceNumber: string; period: string; url: string; dueDate: string; totalAmount: number; id: number }> = [];

  // Generate invoice for each employer
  for (const employer of activeEmployers) {
    try {
      const result = await generateInvoice(employer.id, periodStart, periodEnd);
      console.log(`Invoice generated for employer ${employer.id} (${employer.companyName})`);
      successCount++;
      totalAmount += result.total;
      
      // Calculate due date (30 days from invoice date)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      invoices.push({
        employerId: employer.id,
        amount: result.total,
        invoiceNumber: result.invoiceNumber,
        period: result.period,
        url: result.invoiceUrl,
        dueDate: dueDate.toISOString(),
        totalAmount: result.total,
        id: result.billingRecordId,
      });
    } catch (error) {
      console.error(`Failed to generate invoice for employer ${employer.id}:`, error);
      errorCount++;
    }
  }

  return {
    successCount,
    errorCount,
    totalAmount,
    invoices,
  };
}
