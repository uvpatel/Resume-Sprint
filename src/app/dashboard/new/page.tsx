"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  X,
  FileCode,
} from "lucide-react";

export default function NewScanPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepMessage, setStepMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validExtensions = [".pdf", ".docx", ".txt"];
      const isExtValid = validExtensions.some((ext) =>
        selected.name.toLowerCase().endsWith(ext)
      );

      if (!isExtValid) {
        setError("Unsupported file format. Please upload a PDF, DOCX, or TXT file.");
        return;
      }

      if (selected.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.");
        return;
      }

      setFile(selected);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      const validExtensions = [".pdf", ".docx", ".txt"];
      const isExtValid = validExtensions.some((ext) =>
        selected.name.toLowerCase().endsWith(ext)
      );

      if (!isExtValid) {
        setError("Unsupported file format. Please upload a PDF, DOCX, or TXT file.");
        return;
      }

      if (selected.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.");
        return;
      }

      setFile(selected);
      setError(null);
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
    setTargetRole("Integration Engineer");
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

      setTimeout(() => setStepMessage("2/4 Parsing document and reconciling factual inventory..."), 600);
      setTimeout(() => setStepMessage("3/4 Running canonical Rubric v1 evidence match..."), 1200);

      const res = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process scan");
      }

      setStepMessage("4/4 Saving report and opening workspace...");
      router.push(`/dashboard/resumes/${data.resumeId}/scan`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
      setStepMessage(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-200 pb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-mono font-medium text-blue-700 mb-2">
          <Sparkles className="h-3 w-3" />
          <span>CANONICAL SCAN & PROPOSAL PIPELINE</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          New Resume Scan
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Upload your authentic resume and target job description. The engine extracts verifiable evidence and diagnoses keyword and role alignment.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Box */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-900">
              Resume Document <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={loadSampleData}
              disabled={loading}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <FileCode className="h-3 w-3" />
              <span>Load sample data</span>
            </button>
          </div>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-zinc-200 hover:border-blue-400 rounded-xl p-8 text-center transition-colors bg-zinc-50/50 cursor-pointer relative"
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-xs font-medium text-zinc-800">
                  <span className="text-blue-600 font-semibold">Click to upload</span> or drag and drop
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  PDF, DOCX, or TXT (Max 5MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB · Ready for server extraction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={loading}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-md transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Target Role & Job Description */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
          <div>
            <label
              htmlFor="targetRole"
              className="block text-xs font-semibold text-zinc-900 mb-1.5"
            >
              Target Job Title / Position
            </label>
            <input
              type="text"
              id="targetRole"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Integration Engineer, Full Stack Lead"
              disabled={loading}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="jobDescription"
                className="block text-xs font-semibold text-zinc-900"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-400">
                {jobDescription.length} characters
              </span>
            </div>
            <textarea
              id="jobDescription"
              required
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting requirements, responsibilities, and qualifications..."
              disabled={loading}
              className="w-full rounded-lg border border-zinc-200 p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-colors leading-relaxed font-sans"
            />
            <p className="text-[11px] text-zinc-400 mt-1">
              Minimum 30 characters. The engine maps requirements directly against your extracted resume facts.
            </p>
          </div>
        </div>

        {/* Progress or Submit */}
        {loading ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Analyzing Document...</span>
            </div>
            <p className="text-xs font-mono text-blue-800">
              {stepMessage || "Processing..."}
            </p>
            <p className="text-[11px] text-zinc-500">
              Server extraction runs in an isolated sandbox. Your raw facts remain immutable.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition-colors active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Scan & Generate Report</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
