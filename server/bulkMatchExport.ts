/**
 * Bulk Match Export Service
 * Handles CSV and Excel export of bulk matching results
 */

import * as XLSX from "xlsx";
import { getDb } from "./db";
import { applications, candidates, jobs } from "../drizzle/schema";
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";

export interface MatchExportFilters {
  jobIds?: number[];
  candidateIds?: number[];
  minMatchScore?: number;
  maxMatchScore?: number;
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface MatchExportRow {
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  jobId: number;
  jobTitle: string;
  overallMatchScore: number;
  skillMatchScore: number;
  cultureFitScore: number;
  wellbeingMatchScore: number;
  status: string;
  appliedAt: string;
  lastUpdated: string;
}

/**
 * Fetch match data based on filters
 */
async function fetchMatchData(filters: MatchExportFilters): Promise<MatchExportRow[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    let query = db
      .select({
        candidateId: candidates.id,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        candidatePhone: candidates.phone,
        jobId: jobs.id,
        jobTitle: jobs.title,
        overallMatchScore: applications.overallMatchScore,
        skillMatchScore: applications.skillMatchScore,
        cultureFitScore: applications.cultureFitScore,
        wellbeingMatchScore: applications.wellbeingMatchScore,
        status: applications.status,
        appliedAt: applications.appliedAt,
        lastUpdated: applications.updatedAt,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.overallMatchScore));

    // Apply filters
    const conditions: any[] = [];

    if (filters.jobIds && filters.jobIds.length > 0) {
      conditions.push(inArray(applications.jobId, filters.jobIds));
    }

    if (filters.candidateIds && filters.candidateIds.length > 0) {
      conditions.push(inArray(applications.candidateId, filters.candidateIds));
    }

    if (filters.minMatchScore !== undefined) {
      conditions.push(gte(applications.overallMatchScore, filters.minMatchScore));
    }

    if (filters.maxMatchScore !== undefined) {
      conditions.push(lte(applications.overallMatchScore, filters.maxMatchScore));
    }

    if (filters.statuses && filters.statuses.length > 0) {
      conditions.push(inArray(applications.status, filters.statuses));
    }

    if (filters.dateFrom) {
      conditions.push(gte(applications.appliedAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(applications.appliedAt, filters.dateTo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.limit(10000); // Safety limit

    return results.map((row) => ({
      candidateId: row.candidateId,
      candidateName: row.candidateName || "N/A",
      candidateEmail: row.candidateEmail || "N/A",
      candidatePhone: row.candidatePhone || "N/A",
      jobId: row.jobId,
      jobTitle: row.jobTitle || "N/A",
      overallMatchScore: row.overallMatchScore || 0,
      skillMatchScore: row.skillMatchScore || 0,
      cultureFitScore: row.cultureFitScore || 0,
      wellbeingMatchScore: row.wellbeingMatchScore || 0,
      status: row.status || "unknown",
      appliedAt: row.appliedAt || "",
      lastUpdated: row.lastUpdated || "",
    }));
  } catch (error) {
    console.error("[BulkMatchExport] Error fetching match data:", error);
    throw error;
  }
}

/**
 * Generate CSV from match data
 */
export async function generateMatchCSV(filters: MatchExportFilters): Promise<string> {
  try {
    const data = await fetchMatchData(filters);

    if (data.length === 0) {
      return "No matching results found";
    }

    // CSV header
    const headers = [
      "Candidate ID",
      "Candidate Name",
      "Email",
      "Phone",
      "Job ID",
      "Job Title",
      "Overall Match Score (%)",
      "Skills Match (%)",
      "Culture Fit (%)",
      "Wellbeing Match (%)",
      "Status",
      "Applied At",
      "Last Updated",
    ];

    // CSV rows
    const rows = data.map((row) => [
      row.candidateId,
      row.candidateName,
      row.candidateEmail,
      row.candidatePhone,
      row.jobId,
      row.jobTitle,
      row.overallMatchScore,
      row.skillMatchScore,
      row.cultureFitScore,
      row.wellbeingMatchScore,
      row.status,
      row.appliedAt,
      row.lastUpdated,
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape commas and quotes in cell content
          const cellStr = String(cell);
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")
      ),
    ].join("\n");

    return csvContent;
  } catch (error) {
    console.error("[BulkMatchExport] Error generating CSV:", error);
    throw new Error("Failed to generate CSV export");
  }
}

/**
 * Generate Excel file from match data
 */
export async function generateMatchExcel(filters: MatchExportFilters): Promise<Buffer> {
  try {
    const data = await fetchMatchData(filters);

    if (data.length === 0) {
      throw new Error("No matching results found");
    }

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Prepare data for Excel
    const excelData = data.map((row) => ({
      "Candidate ID": row.candidateId,
      "Candidate Name": row.candidateName,
      "Email": row.candidateEmail,
      "Phone": row.candidatePhone,
      "Job ID": row.jobId,
      "Job Title": row.jobTitle,
      "Overall Match Score (%)": row.overallMatchScore,
      "Skills Match (%)": row.skillMatchScore,
      "Culture Fit (%)": row.cultureFitScore,
      "Wellbeing Match (%)": row.wellbeingMatchScore,
      "Status": row.status,
      "Applied At": row.appliedAt,
      "Last Updated": row.lastUpdated,
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // Candidate ID
      { wch: 25 }, // Candidate Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 10 }, // Job ID
      { wch: 30 }, // Job Title
      { wch: 20 }, // Overall Match Score
      { wch: 15 }, // Skills Match
      { wch: 15 }, // Culture Fit
      { wch: 18 }, // Wellbeing Match
      { wch: 15 }, // Status
      { wch: 20 }, // Applied At
      { wch: 20 }, // Last Updated
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Match Results");

    // Create summary worksheet
    const summary = {
      "Total Matches": data.length,
      "Average Overall Score": (data.reduce((sum, row) => sum + row.overallMatchScore, 0) / data.length).toFixed(2),
      "Average Skills Score": (data.reduce((sum, row) => sum + row.skillMatchScore, 0) / data.length).toFixed(2),
      "Average Culture Fit": (data.reduce((sum, row) => sum + row.cultureFitScore, 0) / data.length).toFixed(2),
      "Average Wellbeing Score": (data.reduce((sum, row) => sum + row.wellbeingMatchScore, 0) / data.length).toFixed(2),
      "High Quality Matches (≥85%)": data.filter((row) => row.overallMatchScore >= 85).length,
      "Medium Quality Matches (70-84%)": data.filter((row) => row.overallMatchScore >= 70 && row.overallMatchScore < 85).length,
      "Low Quality Matches (<70%)": data.filter((row) => row.overallMatchScore < 70).length,
    };

    const summaryData = Object.entries(summary).map(([key, value]) => ({
      Metric: key,
      Value: value,
    }));

    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Summary");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return buffer;
  } catch (error) {
    console.error("[BulkMatchExport] Error generating Excel:", error);
    throw new Error("Failed to generate Excel export");
  }
}

/**
 * Get export statistics
 */
export async function getExportStats(filters: MatchExportFilters): Promise<{
  totalMatches: number;
  highQualityMatches: number;
  averageScore: number;
}> {
  try {
    const data = await fetchMatchData(filters);

    return {
      totalMatches: data.length,
      highQualityMatches: data.filter((row) => row.overallMatchScore >= 85).length,
      averageScore: data.length > 0
        ? Math.round(data.reduce((sum, row) => sum + row.overallMatchScore, 0) / data.length)
        : 0,
    };
  } catch (error) {
    console.error("[BulkMatchExport] Error getting export stats:", error);
    return { totalMatches: 0, highQualityMatches: 0, averageScore: 0 };
  }
}
