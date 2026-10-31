"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  FileSearch,
  Compass,
  ArrowRight,
  CornerDownLeft,
  Loader2,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import type {
  SearchResponse,
  SearchResultResume,
  SearchResultScan,
  SearchResultPage,
} from "@/app/api/search/route";

function FormatBadge({ format }: { format: string }) {
  const f = format.toUpperCase();
  if (f === "PDF") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        PDF
      </span>
    );
  }
  if (f === "DOCX") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        DOCX
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
      {f}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      : score >= 60
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`}
    >
      {score}%
    </span>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse["results"]>({
    resumes: [],
    scans: [],
    pages: [],
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Flattened items list for keyboard navigation
  const allItems = [
    ...data.resumes.map((item) => ({ ...item, kind: "resume" as const })),
    ...data.scans.map((item) => ({ ...item, kind: "scan" as const })),
    ...data.pages.map((item) => ({ ...item, kind: "page" as const })),
  ];

  // Perform search fetch with debouncing
  const performSearch = useCallback(async (q: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const json: SearchResponse = await res.json();
        setData(json.results);
        setActiveIndex(-1);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Search fetch failed:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced input change
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 180);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K / '/' to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigate to selected result
  const handleSelect = (url: string) => {
    setIsOpen(false);
    setIsMobileOpen(false);
    router.push(url);
  };

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (allItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % allItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (allItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < allItems.length) {
        handleSelect(allItems[activeIndex].url);
      } else if (allItems.length > 0) {
        handleSelect(allItems[0].url);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setIsMobileOpen(false);
      inputRef.current?.blur();
    }
  };

  const hasResults =
    data.resumes.length > 0 || data.scans.length > 0 || data.pages.length > 0;

  return (
    <>
      {/* Mobile search toggle trigger */}
      <button
        type="button"
        onClick={() => {
          setIsMobileOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
      </button>

      {/* Desktop Search Input Container */}
      <div
        ref={containerRef}
        className="relative flex-1 max-w-sm hidden sm:block"
      >
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              if (allItems.length === 0) {
                performSearch(query);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search resumes, analyses..."
            className="w-full bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border/80 rounded-lg pl-8 pr-16 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs transition-all"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
            ) : query ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="pointer-events-auto p-0.5 rounded text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted border border-border rounded shadow-2xs">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            )}
          </div>
        </div>

        {/* Dropdown Results Box */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border/60 max-h-[460px] flex flex-col animate-in fade-in zoom-in-95 duration-100">
            {/* Scrollable list */}
            <div className="overflow-y-auto p-1.5 space-y-3">
              {/* Resumes Section */}
              {data.resumes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <span>Resumes ({data.resumes.length})</span>
                    <span className="text-[9px] lowercase font-normal">documents</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {data.resumes.map((resume, idx) => {
                      const itemIndex = idx;
                      const isActive = activeIndex === itemIndex;
                      return (
                        <button
                          key={resume.id}
                          type="button"
                          onClick={() => handleSelect(resume.url)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {resume.title}
                              </div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                                <span>{(resume.fileSize / 1024).toFixed(0)} KB</span>
                                {resume.targetRole && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{resume.targetRole}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <FormatBadge format={resume.fileType} />
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Analyses Section */}
              {data.scans.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <span>Scans & Match Results ({data.scans.length})</span>
                    <span className="text-[9px] lowercase font-normal">evaluations</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {data.scans.map((scan, idx) => {
                      const itemIndex = data.resumes.length + idx;
                      const isActive = activeIndex === itemIndex;
                      return (
                        <button
                          key={scan.id}
                          type="button"
                          onClick={() => handleSelect(scan.url)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
                              <FileSearch className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate flex items-center gap-1.5">
                                <span>{scan.targetRole}</span>
                                <span className="text-[10px] text-muted-foreground font-normal truncate">
                                  ({scan.resumeTitle})
                                </span>
                              </div>
                              {scan.snippet && (
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {scan.snippet}
                                </div>
                              )}
                            </div>
                          </div>
                          <ScoreBadge score={scan.score} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Pages */}
              {data.pages.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    <span>Quick Navigation</span>
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {data.pages.map((page, idx) => {
                      const itemIndex =
                        data.resumes.length + data.scans.length + idx;
                      const isActive = activeIndex === itemIndex;
                      return (
                        <button
                          key={page.id}
                          type="button"
                          onClick={() => handleSelect(page.url)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          className={`w-full flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Compass className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <div className="text-xs font-medium truncate">
                              {page.title}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {page.url}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!loading && !hasResults && query.trim() !== "" && (
                <div className="py-6 px-4 text-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                    <Search className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-foreground">
                    No results found for &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Try searching by resume name, format (pdf, docx), or target role.
                  </p>
                </div>
              )}
            </div>

            {/* Footer keyboard hints */}
            <div className="px-3 py-1.5 bg-muted/40 text-[10px] text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CornerDownLeft className="h-2.5 w-2.5" /> to select
              </span>
              <span>↑↓ to navigate</span>
              <span>esc to close</span>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Search Modal Dialog */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 flex flex-col sm:hidden animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Mobile Header input */}
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={mobileInputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search resumes, analyses..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {loading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
              <button
                type="button"
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mobile results list */}
            <div className="overflow-y-auto p-2 space-y-3 flex-1">
              {data.resumes.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
                    Resumes
                  </div>
                  {data.resumes.map((resume) => (
                    <button
                      key={resume.id}
                      type="button"
                      onClick={() => handleSelect(resume.url)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{resume.title}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {(resume.fileSize / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                      <FormatBadge format={resume.fileType} />
                    </button>
                  ))}
                </div>
              )}

              {data.scans.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
                    Scans & Scores
                  </div>
                  {data.scans.map((scan) => (
                    <button
                      key={scan.id}
                      type="button"
                      onClick={() => handleSelect(scan.url)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileSearch className="h-4 w-4 text-amber-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium truncate">{scan.targetRole}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {scan.resumeTitle}
                          </div>
                        </div>
                      </div>
                      <ScoreBadge score={scan.score} />
                    </button>
                  ))}
                </div>
              )}

              {data.pages.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">
                    Pages
                  </div>
                  {data.pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => handleSelect(page.url)}
                      className="w-full flex items-center gap-2 p-2.5 rounded-lg text-left hover:bg-muted transition-colors text-xs font-medium"
                    >
                      <Compass className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{page.title}</span>
                    </button>
                  ))}
                </div>
              )}

              {!loading && !hasResults && query.trim() !== "" && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No matching resumes or analyses found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
