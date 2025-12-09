import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2, Download, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";

interface ExportFilter {
  field: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "between" | "in";
  value: any;
}

interface ExportColumn {
  field: string;
  label: string;
  format?: string;
}

export default function AdvancedExports() {
  const [exportName, setExportName] = useState("");
  const [exportDescription, setExportDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("candidates");
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv");
  const [schedule, setSchedule] = useState<"daily" | "weekly" | "monthly" | "custom">("weekly");
  const [emailRecipients, setEmailRecipients] = useState("");
  const [filters, setFilters] = useState<ExportFilter[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Fetch available filter fields
  const { data: availableFields } = trpc.advancedExport.getAvailableFilterFields.useQuery({
    template: selectedTemplate,
  });

  // Fetch available columns
  const { data: availableColumns } = trpc.advancedExport.getAvailableColumns.useQuery({
    template: selectedTemplate,
  });

  // Fetch scheduled exports
  const { data: scheduledExports, isLoading: exportsLoading } =
    trpc.advancedExport.getScheduledExports.useQuery({});

  const createExportMutation = trpc.advancedExport.createScheduledExport.useMutation();
  const deleteExportMutation = trpc.advancedExport.deleteScheduledExport.useMutation();

  const addFilter = () => {
    if (availableFields && availableFields.length > 0) {
      setFilters([
        ...filters,
        {
          field: availableFields[0].field,
          operator: "equals",
          value: "",
        },
      ]);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<ExportFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const toggleColumn = (field: string) => {
    if (selectedColumns.includes(field)) {
      setSelectedColumns(selectedColumns.filter((c) => c !== field));
    } else {
      setSelectedColumns([...selectedColumns, field]);
    }
  };

  const handleCreateExport = async () => {
    if (!exportName) {
      toast.error("Please enter an export name");
      return;
    }

    if (selectedColumns.length === 0) {
      toast.error("Please select at least one column");
      return;
    }

    const columns: ExportColumn[] = selectedColumns
      .map((field) => {
        const col = availableColumns?.find((c) => c.field === field);
        return col
          ? {
              field: col.field,
              label: col.label,
              format: col.format,
            }
          : null;
      })
      .filter((c): c is ExportColumn => c !== null);

    try {
      await createExportMutation.mutateAsync({
        name: exportName,
        description: exportDescription,
        exportTemplate: selectedTemplate as any,
        exportFormat,
        schedule,
        filters,
        columns,
        emailRecipients: emailRecipients.split(",").map((e) => e.trim()).filter((e) => e),
      });

      toast.success("Scheduled export created successfully");

      // Reset form
      setExportName("");
      setExportDescription("");
      setFilters([]);
      setSelectedColumns([]);
      setEmailRecipients("");
    } catch (error) {
      toast.error("Failed to create scheduled export");
    }
  };

  const handleDeleteExport = async (id: number) => {
    try {
      await deleteExportMutation.mutateAsync({ id });
      toast.success("Scheduled export deleted");
    } catch (error) {
      toast.error("Failed to delete export");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Advanced Exports</h1>
        <p className="text-muted-foreground">
          Create custom scheduled exports with advanced filters
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Export Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Scheduled Export</CardTitle>
            <CardDescription>Configure a new automated export</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Export Name</Label>
              <Input
                id="name"
                placeholder="e.g., Weekly Candidate Report"
                value={exportName}
                onChange={(e) => setExportName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional description"
                value={exportDescription}
                onChange={(e) => setExportDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candidates">Candidates</SelectItem>
                    <SelectItem value="interviews">Interviews</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="campaigns">Campaigns</SelectItem>
                    <SelectItem value="jobs">Jobs</SelectItem>
                    <SelectItem value="applications">Applications</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schedule">Schedule</Label>
              <Select value={schedule} onValueChange={(v: any) => setSchedule(v)}>
                <SelectTrigger id="schedule">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipients">Email Recipients</Label>
              <Input
                id="recipients"
                placeholder="email1@example.com, email2@example.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated email addresses</p>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filters</Label>
                <Button size="sm" variant="outline" onClick={addFilter}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>

              <div className="space-y-2">
                {filters.map((filter, index) => (
                  <div key={index} className="flex gap-2 items-center p-3 border rounded-lg">
                    <Select
                      value={filter.field}
                      onValueChange={(value) => updateFilter(index, { field: value })}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFields?.map((field) => (
                          <SelectItem key={field.field} value={field.field}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value: any) => updateFilter(index, { operator: value })}
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="greaterThan">Greater Than</SelectItem>
                        <SelectItem value="lessThan">Less Than</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      className="flex-1"
                    />

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFilter(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column Selection */}
            <div className="space-y-2">
              <Label>Columns to Export</Label>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto p-3 border rounded-lg">
                {availableColumns?.map((column) => (
                  <div key={column.field} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.field}
                      checked={selectedColumns.includes(column.field)}
                      onCheckedChange={() => toggleColumn(column.field)}
                    />
                    <label
                      htmlFor={column.field}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {column.label}
                      {column.format && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({column.format})
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateExport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Create Scheduled Export
            </Button>
          </CardContent>
        </Card>

        {/* Existing Exports */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Exports</CardTitle>
            <CardDescription>Manage your automated exports</CardDescription>
          </CardHeader>
          <CardContent>
            {exportsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : scheduledExports && scheduledExports.length > 0 ? (
              <div className="space-y-4">
                {scheduledExports.map((exp) => (
                  <div key={exp.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{exp.name}</h4>
                        {exp.description && (
                          <p className="text-sm text-muted-foreground">{exp.description}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteExport(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        {exp.exportTemplate}
                      </Badge>
                      <Badge variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        {exp.exportFormat}
                      </Badge>
                      <Badge variant="outline">
                        <Calendar className="h-3 w-3 mr-1" />
                        {exp.schedule}
                      </Badge>
                      <Badge variant={exp.isActive ? "default" : "secondary"}>
                        {exp.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Filters: {exp.filters?.length || 0}</p>
                      <p>Columns: {exp.columns?.length || 0}</p>
                      <p>Recipients: {exp.emailRecipients?.length || 0}</p>
                      {exp.nextRunAt && (
                        <p>Next run: {new Date(exp.nextRunAt).toLocaleString()}</p>
                      )}
                      {exp.lastRunAt && (
                        <p>Last run: {new Date(exp.lastRunAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No scheduled exports configured
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
