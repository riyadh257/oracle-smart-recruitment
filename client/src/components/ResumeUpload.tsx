import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ResumeUploadProps {
  candidateId: number;
  candidateName: string;
  onUploadComplete?: (url: string) => void;
}

export function ResumeUpload({ candidateId, candidateName, onUploadComplete }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [screening, setScreening] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const uploadMutation = trpc.candidate.uploadResume.useMutation({
    onSuccess: (data) => {
      setUploadSuccess(true);
      toast.success("Resume uploaded successfully!");
      onUploadComplete?.(data.url);
      utils.candidate.getById.invalidate({ id: candidateId });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const screenMutation = trpc.candidate.screenWithAI.useMutation({
    onSuccess: () => {
      toast.success("AI screening completed!");
      setScreening(false);
      utils.candidate.getById.invalidate({ id: candidateId });
    },
    onError: (error) => {
      toast.error(`Screening failed: ${error.message}`);
      setScreening(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target?.result as string;
        const base64Content = base64.split(",")[1];

        await uploadMutation.mutateAsync({
          candidateId,
          fileName: file.name,
          fileData: base64Content,
          mimeType: file.type || "application/pdf",
        });

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      console.error("Upload error:", error);
      setUploading(false);
    }
  };

  const handleScreenWithAI = async () => {
    setScreening(true);
    await screenMutation.mutateAsync({ candidateId });
  };

  const handleUploadAndScreen = async () => {
    if (!file) return;

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target?.result as string;
        const base64Content = base64.split(",")[1];

        await uploadMutation.mutateAsync({
          candidateId,
          fileName: file.name,
          fileData: base64Content,
          mimeType: file.type || "application/pdf",
        });

        setUploading(false);
        setScreening(true);
        await screenMutation.mutateAsync({ candidateId });
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      console.error("Upload and screen error:", error);
      setUploading(false);
      setScreening(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Upload</CardTitle>
        <CardDescription>
          Upload resume for {candidateName} and optionally run AI screening
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || screening}
            className="flex-1"
          >
            <Upload className="mr-2 h-4 w-4" />
            Choose File
          </Button>
        </div>

        {file && (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="truncate">{file.name}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {(file.size / 1024).toFixed(1)} KB
              </span>
            </AlertDescription>
          </Alert>
        )}

        {uploadSuccess && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Resume uploaded successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading || screening}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Only
              </>
            )}
          </Button>

          <Button
            onClick={handleUploadAndScreen}
            disabled={!file || uploading || screening}
            variant="default"
            className="flex-1"
          >
            {uploading || screening ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploading ? "Uploading..." : "Screening..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Screen with AI
              </>
            )}
          </Button>
        </div>

        {uploadSuccess && !screening && (
          <Button
            onClick={handleScreenWithAI}
            variant="secondary"
            className="w-full"
            disabled={screening}
          >
            {screening ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running AI Screening...
              </>
            ) : (
              "Run AI Screening Now"
            )}
          </Button>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>• Accepted formats: PDF, DOC, DOCX</p>
          <p>• Maximum file size: 10MB</p>
          <p>• AI screening analyzes candidate fit against job requirements</p>
        </div>
      </CardContent>
    </Card>
  );
}
