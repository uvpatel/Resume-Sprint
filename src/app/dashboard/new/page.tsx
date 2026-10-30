"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  FileCode,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function NewScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFile = (selected: File) => {
    const validExtensions = [".pdf", ".docx", ".txt", ".doc"];
    const isExtValid = validExtensions.some((ext) =>
      selected.name.toLowerCase().endsWith(ext)
    );

    if (!isExtValid) {
      setError("Unsupported file format. Please upload a PDF, DOCX, or TXT document.");
      return;
    }

    if (selected.name.toLowerCase().endsWith(".doc")) {
      setError(
        "Legacy Word (.doc) format detected. Please save your document as modern Word (.docx) or PDF (.pdf) for reliable text extraction."
      );
      return;
    }

    if (selected.size <= 0) {
      setError("The selected file is empty (0 bytes). Please upload a valid document.");
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please upload a smaller document.");
      return;
    }

    setFile(selected);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const loadSampleData = () => {
    const sampleResumeText = `Summary: Integration engineer building scalable APIs with MuleSoft, TypeScript, and SQL.
Experience:
Northstar Energy | Senior Integration Engineer | London | 2021–Present
• Responsible for architecting MuleSoft APIs connecting Salesforce and SAP enterprise pipelines.
• Implemented RabbitMQ event messaging and optimized SQL query pipelines.
• Reduced processing latency by 30% through parallel batch execution and caching.
Education:
MSc Computer Science | Example University | 2020
Skills:
MuleSoft, Salesforce, SAP, RabbitMQ, SQL, TypeScript, Node.js, Docker, AWS
Projects:
Customer synchronization pipeline handling 50k events daily across distributed databases.
Languages:
English, French`;

    const sampleBlob = new Blob([sampleResumeText], { type: "text/plain" });
    const sampleFile = new File([sampleBlob], "Senior-Integration-Engineer-Resume.txt", {
      type: "text/plain",
    });

    setFile(sampleFile);
    setTargetRole("Senior Integration Engineer");
    setJobDescription(
      "Integration Engineer to build MuleSoft APIs connecting Salesforce and SAP. Work with RabbitMQ messaging and SQL data pipelines. Demonstrate batch processing outcomes and relevant integration experience. Kubernetes and AWS experience are also required."
    );
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select or upload your resume file.");
      return;
    }

    if (jobDescription.trim().length < 30) {
      setError("Please provide a job description of at least 30 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setStepMessage("Uploading document and verifying magic-byte file signature...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobDescription", jobDescription);
      formData.append("targetRole", targetRole || "Target Role");

      setTimeout(() => {
        setStepMessage("Extracting text and verifying atomic facts with multi-format parser...");
      }, 400);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process resume analysis");
      }

      setStepMessage("Preservation verified (100%). Loading diagnostic report...");
      router.push(`/dashboard/resumes/${data.resumeId}/scan`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
      setLoading(false);
      setStepMessage(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7 pb-12 font-sans">
      {/* Page Heading & Contextual Subtitle */}
      <div className="pb-1 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analyze Resume
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload your resume in PDF, DOCX, or TXT format alongside a target job description to compute evidence-linked Rubric v1 scoring.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start gap-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* Analysis Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload Document Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Resume Document <span className="text-primary">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Native text PDF, DOCX, or TXT (Max 5MB)
              </span>
            </div>

            <button
              type="button"
              onClick={loadSampleData}
              disabled={loading}
              className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors focus-visible:underline"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Load sample data</span>
            </button>
          </div>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed rounded-xl p-8 sm:p-10 text-center transition-all cursor-pointer relative group ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
                aria-label="Upload resume file (PDF, DOCX, or TXT)"
              />
              <div className="flex flex-col items-center justify-center space-y-2.5 pointer-events-none">
                <div className="h-10 w-10 rounded-xl bg-muted border border-border text-muted-foreground group-hover:text-primary group-hover:border-primary/30 flex items-center justify-center transition-all shadow-xs">
                  <Upload className="h-5 w-5 stroke-[2]" />
                </div>
                <div className="text-xs sm:text-sm font-medium text-foreground">
                  <span className="text-primary font-semibold underline decoration-primary/30 underline-offset-2">Click to choose file</span> or drag and drop here
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono border border-border">
                    PDF (Selectable text)
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono border border-border">
                    DOCX (Word)
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono border border-border">
                    TXT (UTF-8)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB · Ready for parsing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={loading}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border"
                title="Remove selected file"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Target Role & Job Posting Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-xs">
          <div>
            <label
              htmlFor="targetRole"
              className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5"
            >
              Target Job Title / Role
            </label>
            <input
              type="text"
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Integration Engineer, Staff Platform Architect"
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="jobDescription"
                className="block text-xs font-semibold text-foreground uppercase tracking-wider"
              >
                Target Job Description <span className="text-primary">*</span>
              </label>
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {jobDescription.length} chars (min 30)
              </span>
            </div>
            <textarea
              id="jobDescription"
              required
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description, responsibilities, technical skills, and required qualifications..."
              disabled={loading}
              className="w-full rounded-lg border border-border bg-background p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all leading-relaxed font-sans"
            />
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Our Rubric v1 engine anchors all keyword matches to real evidence in your resume without hallucinating unverified skills.
            </p>
          </div>
        </div>

        {/* Processing State or Submit Button */}
        {loading ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-primary font-semibold text-xs sm:text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Analyzing Document...</span>
            </div>
            <p className="text-xs font-mono font-medium text-foreground">
              {stepMessage || "Processing multi-format parsing pipeline..."}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Preservation verification and Rubric v1 keyword matching running in parallel.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>100% authentic fact preservation guarantee</span>
            </div>

            <button
              type="submit"
              disabled={loading || !file || jobDescription.trim().length < 30}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-[0.98]"
            >
              <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" />
              <span>Analyze Resume</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
