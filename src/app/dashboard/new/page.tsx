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
    const validExtensions = [".pdf", ".docx", ".txt"];
    const isExtValid = validExtensions.some((ext) =>
      selected.name.toLowerCase().endsWith(ext)
    );

    if (!isExtValid) {
      setError("Unsupported file format. Please upload a PDF, DOCX, or TXT document.");
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
    const sampleResumeText = `Summary: Integration engineer building APIs with MuleSoft and SQL.
Experience:
Northstar Energy | Integration Engineer | London | 2021–Present
• Responsible for building MuleSoft APIs connecting Salesforce and SAP.
• Worked on RabbitMQ messaging and SQL data pipelines.
• Reduced processing time by 30% through batch processing.
Education:
MSc Computer Science | Example University | 2020
Skills:
MuleSoft, Salesforce, SAP, RabbitMQ, SQL, batch processing
Projects:
Customer data synchronization using APIs and RabbitMQ.
Languages:
English, Marathi`;

    const sampleBlob = new Blob([sampleResumeText], { type: "text/plain" });
    const sampleFile = new File([sampleBlob], "Integration-Engineer-Resume.txt", {
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
      setStepMessage("1/4 Uploading resume and target criteria...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobDescription", jobDescription);
      formData.append("targetRole", targetRole || "Target Role");

      setTimeout(
        () => setStepMessage("2/4 Parsing document and extracting atomic blocks..."),
        600
      );
      setTimeout(
        () => setStepMessage("3/4 Computing canonical Rubric v1 evidence match..."),
        1200
      );

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process scan");
      }

      setStepMessage("4/4 Generating analysis report...");
      router.push(`/dashboard/resumes/${data.resumeId}/scan`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
      setStepMessage(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Heading & Contextual Subtitle */}
      <div className="border-b border-[#E8E8E8] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
          Analyze Resume
        </h1>
        <p className="text-sm text-[#626262] mt-1">
          Upload your resume alongside target job criteria to compute evidence-linked Rubric v1 scores and review anchored recommendations.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Analysis Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Upload Document Section */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-[#252525] block">
                Resume Document <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-[#626262]">
                Supported formats: PDF, DOCX, or TXT (Max 5MB)
              </span>
            </div>

            <button
              type="button"
              onClick={loadSampleData}
              disabled={loading}
              className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] flex items-center gap-1.5 transition-colors focus-visible:underline"
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
              className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer relative group ${
                isDragging
                  ? "border-[#2996F3] bg-[#EAF4FF]/40"
                  : "border-[#E8E8E8] hover:border-[#2996F3]/50 bg-[#F8FAFC]"
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
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="h-10 w-10 rounded-lg bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center transition-transform group-hover:scale-105">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-[#252525]">
                  <span className="text-[#2996F3] underline decoration-[#2996F3]/30">Click to select file</span> or drag and drop here
                </div>
                <p className="text-xs text-[#9CA3AF]">
                  Text is extracted server-side. Original facts remain immutable.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8E8E8] bg-[#F8FAFC]">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-[#EAF4FF] border border-[#2996F3]/20 text-[#2996F3] flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#252525] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#626262] font-mono mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB · Ready for parsing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={loading}
                className="p-1.5 text-[#9CA3AF] hover:text-[#252525] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E8E8E8] focus-visible:ring-2 focus-visible:ring-[#2996F3]"
                title="Remove selected file"
                aria-label="Remove selected file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Target Role & Job Posting Section */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
          <div>
            <label
              htmlFor="targetRole"
              className="block text-xs font-bold text-[#252525] mb-1.5"
            >
              Target Job Title / Position
            </label>
            <input
              type="text"
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Integration Engineer, Staff Platform Lead"
              disabled={loading}
              className="w-full rounded-lg border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-sm text-[#252525] placeholder:text-[#9CA3AF] focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="jobDescription"
                className="block text-xs font-bold text-[#252525]"
              >
                Target Job Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-mono text-[#9CA3AF]">
                {jobDescription.length} characters (min 30)
              </span>
            </div>
            <textarea
              id="jobDescription"
              required
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description, responsibilities, technical requirements, and qualifications..."
              disabled={loading}
              className="w-full rounded-lg border border-[#E8E8E8] bg-white p-3.5 text-sm text-[#252525] placeholder:text-[#9CA3AF] focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20 outline-none transition-all leading-relaxed font-sans"
            />
            <p className="text-xs text-[#626262] mt-1.5">
              The engine matches extracted keywords against your resume blocks without fabricating missing experience.
            </p>
          </div>
        </div>

        {/* Processing State or Submit Button */}
        {loading ? (
          <div className="rounded-xl border border-[#2996F3]/30 bg-[#EAF4FF]/40 p-6 text-center space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-[#2996F3] font-semibold text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#2996F3]" />
              <span>Analyzing Document...</span>
            </div>
            <p className="text-xs font-mono font-medium text-[#252525]">
              {stepMessage || "Processing..."}
            </p>
            <p className="text-xs text-[#626262]">
              Sandboxed server extraction in progress. Preservation gates are verified before reporting.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#626262]">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>100% authentic fact preservation guarantee</span>
            </div>

            <button
              type="submit"
              disabled={loading || !file || jobDescription.trim().length < 30}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 text-sm font-semibold shadow-xs transition-all active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2996F3]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Analyze Resume</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
