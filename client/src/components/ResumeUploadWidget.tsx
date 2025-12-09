import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ResumeUploadWidgetProps {
  candidateId: number;
  onUploadSuccess?: (data: any) => void;
}

export function ResumeUploadWidget({ candidateId, onUploadSuccess }: ResumeUploadWidgetProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "parsing" | "success" | "error">("idle");
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadMutation = trpc.candidate.uploadResume.useMutation({
    onSuccess: (data) => {
      setUploadStatus("success");
      setParsedData(data.parsedData);
      toast.success("Resume uploaded and parsed successfully!");
      onUploadSuccess?.(data);
    },
    onError: (error) => {
      setUploadStatus("error");
      setError(error.message);
      toast.error("Failed to upload resume");
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError("Invalid file type. Please upload PDF, DOCX, or TXT files.");
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadStatus("uploading");
    setError(null);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(",")[1];
        if (!base64Data) {
          throw new Error("Failed to read file");
        }

        setUploadStatus("parsing");

        // Upload and parse
        await uploadMutation.mutateAsync({
          candidateId,
          fileData: base64Data,
          fileName: file.name,
          mimeType: file.type,
        });
      };

      reader.onerror = () => {
        setUploadStatus("error");
        setError("Failed to read file");
      };

      reader.readAsDataURL(file);
    } catch (err: unknown) {
      setUploadStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadStatus("idle");
    setParsedData(null);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Upload
        </CardTitle>
        <CardDescription>
          Upload your resume and let AI extract your information automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadStatus === "idle" || uploadStatus === "error" ? (
          <>
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                ${file ? "bg-green-50 border-green-500" : ""}
              `}
            >
              {file ? (
                <div className="space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetUpload}
                    className="mt-2"
                  >
                    Choose Different File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="text-gray-600 font-medium">
                    Drag and drop your resume here
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse files
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supported formats: PDF, DOCX, TXT (Max 5MB)
                  </p>
                </div>
              )}

              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileInputChange}
                className="hidden"
                id="resume-upload-input"
              />
              {!file && (
                <label htmlFor="resume-upload-input">
                  <Button variant="outline" className="mt-4" asChild>
                    <span className="cursor-pointer">Browse Files</span>
                  </Button>
                </label>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {file && (
              <Button
                onClick={handleUpload}
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload and Parse Resume
              </Button>
            )}
          </>
        ) : uploadStatus === "uploading" || uploadStatus === "parsing" ? (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <div>
              <p className="font-medium text-gray-900">
                {uploadStatus === "uploading" ? "Uploading resume..." : "Parsing resume with AI..."}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {uploadStatus === "parsing" && "This may take a few seconds"}
              </p>
            </div>
          </div>
        ) : uploadStatus === "success" && parsedData ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Resume uploaded and parsed successfully! Your profile has been updated with the extracted information.
              </AlertDescription>
            </Alert>

            {/* Parsed Data Preview */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900">Extracted Information:</h4>
              
              {parsedData.fullName && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Name: </span>
                  <span className="text-sm text-gray-900">{parsedData.fullName}</span>
                </div>
              )}

              {parsedData.email && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Email: </span>
                  <span className="text-sm text-gray-900">{parsedData.email}</span>
                </div>
              )}

              {parsedData.phone && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Phone: </span>
                  <span className="text-sm text-gray-900">{parsedData.phone}</span>
                </div>
              )}

              {parsedData.location && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Location: </span>
                  <span className="text-sm text-gray-900">{parsedData.location}</span>
                </div>
              )}

              {parsedData.yearsOfExperience && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Experience: </span>
                  <span className="text-sm text-gray-900">{parsedData.yearsOfExperience} years</span>
                </div>
              )}

              {parsedData.technicalSkills && parsedData.technicalSkills.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Skills: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {parsedData.technicalSkills.slice(0, 10).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                    {parsedData.technicalSkills.length > 10 && (
                      <span className="text-xs text-gray-500 self-center">
                        +{parsedData.technicalSkills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={resetUpload}
              variant="outline"
              className="w-full"
            >
              Upload Another Resume
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
