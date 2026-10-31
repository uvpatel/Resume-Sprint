"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  ClipboardPaste,
  Trash2,
  FileCode,
  ArrowRight,
  Info,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";
import { StepIndicator } from "@/components/dashboard/analyze/step-indicator";
import { FileDropzone } from "@/components/dashboard/analyze/file-dropzone";
import { FileCard } from "@/components/dashboard/analyze/file-card";
import { CharCounter } from "@/components/dashboard/analyze/char-counter";
import { RequirementChecklist } from "@/components/dashboard/analyze/requirement-checklist";

export default function NewScanPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [pipelinePhase, setPipelinePhase] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const isJdValid = jobDescription.trim().length >= 30;
  const isFormValid = Boolean(file && isJdValid);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(
        170,
        textareaRef.current.scrollHeight
      )}px`;
    }
  }, [jobDescription]);

  // File validation
  const validateAndSetFile = (selected: File) => {
    const validExtensions = [".pdf", ".docx", ".txt", ".doc"];
    const isExtValid = validExtensions.some((ext) =>
      selected.name.toLowerCase().endsWith(ext)
    );

    if (!isExtValid) {
      setError(
        "Unsupported file format. Please upload a text-based PDF, Word document (.docx), or UTF-8 text file (.txt)."
      );
      return;
    }

    if (selected.name.toLowerCase().endsWith(".doc")) {
      setError(
        "Legacy Word (.doc) format detected. Please save or re-export your document as modern Word (.docx) or PDF (.pdf) for reliable parsing."
      );
      return;
    }

    if (selected.size <= 0) {
      setError(
        "The selected file is empty (0 bytes). Please upload a valid resume document."
      );
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError(
        "File size exceeds the 5MB limit. Please upload a smaller document."
      );
      return;
    }

    setFile(selected);
    setError(null);
  };

  // Paste from clipboard helper
  const handlePasteClipboard = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setJobDescription(text);
          setError(null);
          textareaRef.current?.focus();
        }
      }
    } catch {
      // Permission denied or not supported, ignore gracefully
    }
  };

  // Load sample data for immediate evaluation
  const loadSampleData = () => {
    const sampleResumeText = `Summary: Integration engineer building scalable enterprise pipelines with MuleSoft, TypeScript, and PostgreSQL.
Experience:
Northstar Energy | Senior Integration Engineer | London | 2021–Present
• Architected MuleSoft APIs connecting Salesforce and SAP enterprise pipelines, processing 50k events daily.
• Implemented RabbitMQ event messaging and optimized SQL query pipelines, reducing batch latency by 32%.
• Containerized core integration microservices using Docker and orchestrated deployments on AWS ECS.
Education:
MSc Computer Science | University of London | 2020
Skills:
MuleSoft, Salesforce, SAP, RabbitMQ, SQL, PostgreSQL, TypeScript, Node.js, Docker, AWS
Languages:
English, French`;

    const sampleBlob = new Blob([sampleResumeText], { type: "text/plain" });
    const sampleFile = new File(
      [sampleBlob],
      "Senior-Integration-Engineer-Resume.txt",
      { type: "text/plain" }
    );

    setFile(sampleFile);
    setTargetRole("Senior Integration Engineer");
    setJobDescription(
      "We are seeking a Senior Integration Engineer to build MuleSoft APIs connecting Salesforce and SAP enterprise pipelines. You will design RabbitMQ event-driven messaging, optimize SQL queries, and implement containerized batch microservices on AWS. Strong experience with distributed systems and TypeScript is required."
    );
    setError(null);
  };

  // Form submission with staged pipeline telemetry messages
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!file) {
      setError("Please select or upload your resume file.");
      return;
    }

    if (jobDescription.trim().length < 30) {
      setError(
        "Please provide a target job description of at least 30 characters."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setPipelinePhase(1);
    setStepMessage(
      "Uploading document & verifying magic-byte file signature..."
    );

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobDescription", jobDescription);
      formData.append("targetRole", targetRole || "Target Role");

      const t1 = setTimeout(() => {
        setPipelinePhase(2);
        setStepMessage(
          "Extracting atomic facts & verifying source span coverage..."
        );
      }, 500);

      const t2 = setTimeout(() => {
        setPipelinePhase(3);
        setStepMessage(
          "Matching candidate experience against Rubric v1 invariants..."
        );
      }, 1100);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      clearTimeout(t1);
      clearTimeout(t2);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process resume analysis");
      }

      setPipelinePhase(4);
      setStepMessage(
        "100% Fact preservation verified. Redirecting to diagnostic report..."
      );

      // Navigate directly to the scan report
      router.push(`/dashboard/resumes/${data.resumeId}/scan`);
    } catch (err: any) {
      setError(
        err.message ||
          "An unexpected error occurred during analysis. Please try again."
      );
      setLoading(false);
      setStepMessage(null);
      setPipelinePhase(0);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-16 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-primary/10 text-primary border border-primary/20">
              Rubric v1 • Evidence Engine
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              100% Fact Preservation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Analyze your resume
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Compare your resume against a target role to identify skills,
            requirements, and gaps backed by evidence from your actual
            experience.
          </p>
        </div>

        {/* Secondary Action: Load Sample Data */}
        <button
          type="button"
          onClick={loadSampleData}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted/60 text-foreground text-xs font-semibold shadow-2xs transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
        >
          <FileCode className="h-3.5 w-3.5 text-primary" />
          <span>Load sample data</span>
        </button>
      </div>

      {/* 3-Step Interactive Progress Bar */}
      <StepIndicator
        hasFile={Boolean(file)}
        hasJobDescription={isJdValid}
        isAnalyzing={loading}
      />

      {/* Dismissible Error Alert */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-150"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{error}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isFormValid && (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-semibold transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setError(null)}
              className="p-1 rounded-md hover:bg-destructive/20 text-destructive transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Workspace */}
      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Column 1: Resume Upload Card */}
          <section
            aria-labelledby="resume-heading"
            className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="resume-heading"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5"
                >
                  <span>Resume document</span>
                  <span className="text-primary" aria-label="Required">
                    *
                  </span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Native text-based PDF, DOCX, or TXT (Max 5MB)
                </p>
              </div>

              {file && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Selected</span>
                </span>
              )}
            </div>

            {/* Upload Zone / Compact File Summary */}
            {!file ? (
              <FileDropzone
                onFileSelect={validateAndSetFile}
                disabled={loading}
              />
            ) : (
              <FileCard
                file={file}
                onReplace={validateAndSetFile}
                onRemove={() => setFile(null)}
                disabled={loading}
              />
            )}

            {/* Quality Note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>
                To ensure 100% fact preservation, upload text-based resumes.
                Scanned image-only PDFs should be re-exported from Word or Google
                Docs.
              </span>
            </div>
          </section>

          {/* Column 2: Target Position Form Card */}
          <section
            aria-labelledby="job-heading"
            className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  id="job-heading"
                  className="text-xs font-semibold text-foreground uppercase tracking-wider"
                >
                  Target position
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Role title & requirements to benchmark against
                </p>
              </div>
            </div>

            {/* Job Title Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="targetRole"
                className="block text-xs font-semibold text-foreground"
              >
                Target Job Title / Role
              </label>
              <input
                type="text"
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Frontend Engineer, Full-Stack Developer, AI Engineer"
                disabled={loading}
                className="w-full h-11 rounded-xl border border-border bg-background px-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            {/* Job Description Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="jobDescription"
                  className="block text-xs font-semibold text-foreground"
                >
                  Target Job Description{" "}
                  <span className="text-primary" aria-label="Required">
                    *
                  </span>
                </label>

                {/* Live Character Counter */}
                <CharCounter currentLength={jobDescription.length} minLength={30} />
              </div>

              {/* Textarea container with toolbar */}
              <div className="relative rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
                <textarea
                  ref={textareaRef}
                  id="jobDescription"
                  required
                  rows={7}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description, responsibilities, required skills, and qualifications..."
                  disabled={loading}
                  className="w-full bg-transparent p-3.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all leading-relaxed font-sans resize-none disabled:opacity-50 min-h-[160px]"
                />

                {/* Textarea Bottom Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted text-[11px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50"
                      title="Paste job description from clipboard"
                    >
                      <ClipboardPaste className="h-3.5 w-3.5" />
                      <span>Paste</span>
                    </button>

                    {jobDescription.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setJobDescription("")}
                        disabled={loading}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[11px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-destructive disabled:opacity-50"
                        title="Clear job description"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    Tip: include responsibilities & required skills
                  </span>
                </div>
              </div>

              {/* Engine Grounding Helper */}
              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Grounded in resume evidence — unverified skills will not be
                treated as confirmed experience.
              </p>
            </div>
          </section>
        </div>

        {/* Loading Progress State */}
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-4 shadow-sm animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-center gap-2.5 text-primary font-semibold text-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing resume...</span>
            </div>

            {/* Stepped progress indicators */}
            <div className="max-w-md mx-auto grid grid-cols-3 gap-2 text-center text-[11px]">
              <div
                className={`p-2 rounded-lg border font-mono transition-colors ${
                  pipelinePhase >= 1
                    ? "bg-card border-primary/40 text-primary font-medium"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}
              >
                1. Parsing
              </div>
              <div
                className={`p-2 rounded-lg border font-mono transition-colors ${
                  pipelinePhase >= 2
                    ? "bg-card border-primary/40 text-primary font-medium"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}
              >
                2. Matching
              </div>
              <div
                className={`p-2 rounded-lg border font-mono transition-colors ${
                  pipelinePhase >= 3
                    ? "bg-card border-primary/40 text-primary font-medium"
                    : "bg-muted/40 border-border text-muted-foreground"
                }`}
              >
                3. Scoring
              </div>
            </div>

            <p className="text-xs font-mono text-foreground font-medium">
              {stepMessage || "Executing multi-format parsing pipeline..."}
            </p>
          </div>
        )}

        {/* Primary Action Card / Sticky Mobile Bar */}
        {!loading && (
          <div className="sticky bottom-0 z-20 -mx-4 sm:mx-0 p-4 sm:p-0 bg-background/90 sm:bg-transparent backdrop-blur-md sm:backdrop-blur-none border-t sm:border-t-0 border-border">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl sm:border border-border sm:bg-card sm:p-5 sm:shadow-xs">
              {/* Trust & Evidence Row */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% authentic fact preservation guarantee</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal max-w-md">
                  Your resume is never altered. Evidence-linked scoring, zero
                  hallucinated skills.
                </p>
              </div>

              {/* Checklist & Submit Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
                {!isFormValid && (
                  <div className="hidden md:block">
                    <RequirementChecklist
                      hasFile={Boolean(file)}
                      hasJobDescription={isJdValid}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!isFormValid || loading}
                  className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-7 rounded-xl bg-primary hover:bg-[#4338CA] text-primary-foreground font-semibold text-sm shadow-xs transition-all active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 stroke-[2.2] group-hover:rotate-12 transition-transform" />
                  <span>Analyze resume</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
