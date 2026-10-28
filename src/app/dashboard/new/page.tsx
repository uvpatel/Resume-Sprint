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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-[#E8E8E8] pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#252525]">
          New Scan
        </h1>
        <p className="text-sm text-[#626262] mt-1">
          Upload your resume and target job description to compute evidence-linked Rubric v1 scores.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Box */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#252525]">
              Resume Document <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={loadSampleData}
              disabled={loading}
              className="text-xs font-semibold text-[#2996F3] hover:text-[#147DD8] flex items-center gap-1.5 transition-colors"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Load sample data</span>
            </button>
          </div>

          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border border-dashed border-[#E8E8E8] hover:border-[#2996F3] rounded-xl p-8 text-center transition-all bg-[#F8FAFC] cursor-pointer relative group"
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="h-10 w-10 rounded-xl bg-[#EAF4FF] text-[#2996F3] flex items-center justify-center transition-transform group-hover:scale-105">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-[#252525]">
                  <span className="text-[#2996F3]">Click to upload</span> or drag and drop
                </div>
                <p className="text-xs text-[#626262]">
                  PDF, DOCX, or TXT (Max 5MB)
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#E8E8E8] bg-[#F8FAFC]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-[#EAF4FF] border border-[#2996F3]/20 text-[#2996F3] flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#252525] truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-[#626262] font-mono">
                    {(file.size / 1024).toFixed(1)} KB · Ready for server extraction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={loading}
                className="p-1.5 text-[#9CA3AF] hover:text-[#252525] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-[#E8E8E8]"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Target Role & Job Description */}
        <div className="rounded-xl border border-[#E8E8E8] bg-white p-5 sm:p-6 space-y-4 shadow-xs">
          <div>
            <label
              htmlFor="targetRole"
              className="block text-xs font-bold text-[#252525] mb-2"
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
              className="w-full rounded-lg border border-[#E8E8E8] bg-white px-3.5 py-2.5 text-sm text-[#252525] placeholder:text-[#9CA3AF] focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="jobDescription"
                className="block text-xs font-bold text-[#252525]"
              >
                Job Description <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs font-mono text-[#9CA3AF]">
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
              className="w-full rounded-lg border border-[#E8E8E8] bg-white p-3.5 text-sm text-[#252525] placeholder:text-[#9CA3AF] focus:border-[#2996F3] focus:ring-2 focus:ring-[#2996F3]/20 outline-none transition-all leading-relaxed font-sans"
            />
            <p className="text-xs text-[#626262] mt-1.5">
              Minimum 30 characters. The engine maps requirements directly against your extracted resume facts.
            </p>
          </div>
        </div>

        {/* Progress or Submit */}
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
              Server extraction runs in an isolated sandbox. Your raw facts remain immutable.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[#2996F3] hover:bg-[#147DD8] text-white px-5 py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all active:scale-[0.99]"
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
