import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { createEmployee } from './visaComplianceDb';

export interface EmployeeImportRow {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  nationality?: string;
  jobTitle?: string;
  department?: string;
  employmentStatus?: 'active' | 'on_leave' | 'terminated' | 'suspended';
  hireDate?: string;
  isSaudiNational?: string | number;
  // Visa compliance fields
  documentType?: 'visa' | 'work_permit' | 'iqama' | 'passport';
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportValidationError[];
  importedEmployeeIds: number[];
}

/**
 * Validate a single employee row
 */
function validateEmployeeRow(row: EmployeeImportRow, rowIndex: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];
  
  // Required fields
  if (!row.firstName || row.firstName.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'firstName',
      value: row.firstName,
      message: 'First name is required',
    });
  }
  
  if (!row.lastName || row.lastName.trim() === '') {
    errors.push({
      row: rowIndex,
      field: 'lastName',
      value: row.lastName,
      message: 'Last name is required',
    });
  }
  
  // Email validation
  if (row.email && row.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push({
        row: rowIndex,
        field: 'email',
        value: row.email,
        message: 'Invalid email format',
      });
    }
  }
  
  // Employment status validation
  if (row.employmentStatus) {
    const validStatuses = ['active', 'on_leave', 'terminated', 'suspended'];
    if (!validStatuses.includes(row.employmentStatus)) {
      errors.push({
        row: rowIndex,
        field: 'employmentStatus',
        value: row.employmentStatus,
        message: `Invalid employment status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }
  }
  
  // Document type validation
  if (row.documentType) {
    const validDocTypes = ['visa', 'work_permit', 'iqama', 'passport'];
    if (!validDocTypes.includes(row.documentType)) {
      errors.push({
        row: rowIndex,
        field: 'documentType',
        value: row.documentType,
        message: `Invalid document type. Must be one of: ${validDocTypes.join(', ')}`,
      });
    }
  }
  
  // Date validation
  const dateFields: (keyof EmployeeImportRow)[] = ['hireDate', 'issueDate', 'expiryDate'];
  for (const field of dateFields) {
    const value = row[field];
    if (value && typeof value === 'string' && value.trim() !== '') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({
          row: rowIndex,
          field,
          value,
          message: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY',
        });
      }
    }
  }
  
  return errors;
}

/**
 * Parse CSV file content
 */
export function parseCSV(fileContent: string): EmployeeImportRow[] {
  const result = Papa.parse<EmployeeImportRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      // Normalize header names
      return header.trim().replace(/\s+/g, '');
    },
  });
  
  return result.data;
}

/**
 * Parse Excel file buffer
 */
export function parseExcel(fileBuffer: Buffer): EmployeeImportRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const data = XLSX.utils.sheet_to_json<EmployeeImportRow>(worksheet, {
    raw: false,
    defval: '',
  });
  
  return data;
}

/**
 * Import employees from parsed data
 */
export async function importEmployees(
  data: EmployeeImportRow[],
  employerId: number
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    totalRows: data.length,
    successCount: 0,
    errorCount: 0,
    errors: [],
    importedEmployeeIds: [],
  };
  
  // Validate all rows first
  const allErrors: ImportValidationError[] = [];
  data.forEach((row, index) => {
    const rowErrors = validateEmployeeRow(row, index + 1);
    allErrors.push(...rowErrors);
  });
  
  if (allErrors.length > 0) {
    result.success = false;
    result.errors = allErrors;
    result.errorCount = allErrors.length;
    return result;
  }
  
  // Import each employee
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Convert isSaudiNational to number
      let isSaudiNational = 0;
      if (row.isSaudiNational !== undefined) {
        if (typeof row.isSaudiNational === 'string') {
          const normalized = row.isSaudiNational.toLowerCase().trim();
          isSaudiNational = (normalized === 'yes' || normalized === 'true' || normalized === '1') ? 1 : 0;
        } else {
          isSaudiNational = row.isSaudiNational ? 1 : 0;
        }
      }
      
      // Create employee
      const employee = await createEmployee({
        employerId,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: row.email?.trim() || undefined,
        phoneNumber: row.phoneNumber?.trim() || undefined,
        nationality: row.nationality?.trim() || undefined,
        jobTitle: row.jobTitle?.trim() || undefined,
        department: row.department?.trim() || undefined,
        employmentStatus: row.employmentStatus || 'active',
        hireDate: row.hireDate || undefined,
        isSaudiNational,
      });
      
      result.importedEmployeeIds.push(employee.id);
      result.successCount++;
      
      // If visa compliance data is provided, create compliance record
      if (row.documentType && row.expiryDate) {
        const { createVisaCompliance } = await import('./visaComplianceDb');
        await createVisaCompliance({
          employeeId: employee.id,
          documentType: row.documentType,
          documentNumber: row.documentNumber?.trim() || undefined,
          issueDate: row.issueDate || undefined,
          expiryDate: row.expiryDate,
          renewalStatus: 'not_started',
        });
      }
    } catch (error) {
      result.errorCount++;
      result.errors.push({
        row: i + 1,
        field: 'general',
        value: row,
        message: error instanceof Error ? error.message : 'Unknown error during import',
      });
    }
  }
  
  result.success = result.errorCount === 0;
  return result;
}

/**
 * Generate CSV template for employee import
 */
export function generateImportTemplate(): string {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'phoneNumber',
    'nationality',
    'jobTitle',
    'department',
    'employmentStatus',
    'hireDate',
    'isSaudiNational',
    'documentType',
    'documentNumber',
    'issueDate',
    'expiryDate',
  ];
  
  const sampleRow = [
    'Ahmed',
    'Al-Rashid',
    'ahmed@example.com',
    '+966501234567',
    'Egyptian',
    'Software Engineer',
    'Engineering',
    'active',
    '2023-01-15',
    'no',
    'work_permit',
    'WP123456',
    '2023-01-01',
    '2025-01-01',
  ];
  
  const csv = Papa.unparse({
    fields: headers,
    data: [sampleRow],
  });
  
  return csv;
}
