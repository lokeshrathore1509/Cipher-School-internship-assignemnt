"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AttemptEntity,
  EvaluatorType,
  ProblemEntity,
  StructuredSubmissionPayload,
} from "@/domain/types";
import { STARTER_TEMPLATES } from "@/domain/templates/starterTemplates";
import { DifficultyBadge } from "@/components/ui/Badge";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Download,
  Info,
  Layers,
  Loader2,
  Save,
  Send,
  Sparkles,
} from "lucide-react";

interface PracticeWorkspaceProps {
  problem: ProblemEntity;
  attempt: AttemptEntity;
}

export default function PracticeWorkspace({
  problem,
  attempt,
}: PracticeWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const initialContent = attempt.submission?.content || {
    requirementsUnderstanding: "",
    assumptions: "",
    coreClasses: "",
    responsibilities: "",
    relationships: "",
    importantMethods: "",
    designPatterns: "",
    edgeCases: "",
    tradeOffs: "",
    solutionNotes: "",
  };

  const [formData, setFormData] = useState<StructuredSubmissionPayload>(initialContent);
  const [evaluatorType, setEvaluatorType] = useState<EvaluatorType>("RULE_BASED");
  const [activeTab, setActiveTab] = useState<"workspace" | "requirements">("workspace");

  // UI status
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Autosave to localStorage
  const storageKey = `lld_draft_${problem.slug}_attempt_${attempt.id}`;

  useEffect(() => {
    // Check if there is a more recent draft in localStorage
    const savedLocal = localStorage.getItem(storageKey);
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        // Only load if current database content was empty
        if (!initialContent.coreClasses && parsed.coreClasses) {
          setFormData(parsed);
          setSaveStatus("Restored draft from local storage");
        }
      } catch (e) {
        console.error("Failed to restore local draft:", e);
      }
    }
  }, []);

  const handleChange = (field: keyof StructuredSubmissionPayload, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    setErrorMessage(null);

    // Save locally
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setSaveStatus("Saved locally");
    } catch (e) {}
  };

  const handleLoadTemplate = () => {
    const template = STARTER_TEMPLATES[problem.slug] || STARTER_TEMPLATES["parking-lot"];
    if (
      formData.coreClasses &&
      !window.confirm("Loading the starter template will overwrite your current draft inputs. Proceed?")
    ) {
      return;
    }
    setFormData(template);
    setValidationErrors({});
    setErrorMessage(null);
    setSaveStatus("Loaded starter template");
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/attempts/${attempt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: formData }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save draft.");
      }

      setSaveStatus("Draft saved to database at " + new Date().toLocaleTimeString());
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side quick check
    const errors: Record<string, string> = {};
    if (!formData.requirementsUnderstanding || formData.requirementsUnderstanding.trim().length < 15) {
      errors.requirementsUnderstanding = "Please provide at least 15 characters explaining your understanding.";
    }
    if (!formData.coreClasses || formData.coreClasses.trim().length < 15) {
      errors.coreClasses = "Please list your core classes, interfaces, and enums.";
    }
    if (!formData.responsibilities || formData.responsibilities.trim().length < 15) {
      errors.responsibilities = "Please define class responsibilities (Single Responsibility Principle).";
    }
    if (!formData.relationships || formData.relationships.trim().length < 10) {
      errors.relationships = "Please describe inheritance and composition relationships.";
    }
    if (!formData.importantMethods || formData.importantMethods.trim().length < 10) {
      errors.importantMethods = "Please define key public methods and behaviors.";
    }
    if (!formData.designPatterns || formData.designPatterns.trim().length < 5) {
      errors.designPatterns = "Please note any design patterns or abstractions used.";
    }
    if (!formData.edgeCases || formData.edgeCases.trim().length < 10) {
      errors.edgeCases = "Please explain how edge cases and concurrency are handled.";
    }
    if (!formData.tradeOffs || formData.tradeOffs.trim().length < 10) {
      errors.tradeOffs = "Please outline design trade-offs and decisions.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setErrorMessage("Please fill out all required design sections before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      setSubmittingStep("Persisting submitted design to database...");

      const res = await fetch(`/api/attempts/${attempt.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: formData,
          evaluatorType,
        }),
      });

      setSubmittingStep("Analyzing class responsibilities and 8 rubric dimensions...");

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Submission failed.");
      }

      setSubmittingStep("Generating explainable rubric feedback...");
      localStorage.removeItem(storageKey);

      // Successfully evaluated! Redirect to feedback review page
      router.push(`/attempts/${attempt.id}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(
        err.message ||
          "An error occurred during evaluation. Your design has been safely stored. You can retry submission."
      );
      setIsSubmitting(false);
      setSubmittingStep("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Workspace Header Bar */}
      <div className="sticky top-16 z-30 bg-card/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/problems/${problem.slug}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Back to Problem Overview"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white line-clamp-1">
                {problem.title}
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Attempt #{attempt.attemptNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{saveStatus || "Draft in progress"}</span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Evaluator Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-400 font-medium">Evaluator:</span>
            <select
              value={evaluatorType}
              onChange={(e) => setEvaluatorType(e.target.value as EvaluatorType)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="RULE_BASED" className="bg-slate-900 text-white">
                Rule-Based (Deterministic)
              </option>
              <option value="AI" className="bg-slate-900 text-white">
                AI Evaluator (OpenAI / LLM)
              </option>
            </select>
          </div>

          {/* Load Starter Template button */}
          <button
            type="button"
            onClick={handleLoadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Pre-fill with a structured example template"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            Load Starter Template
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition disabled:opacity-50"
          >
            {isSavingDraft ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5 text-slate-400" />
            )}
            Save Draft
          </button>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Submit for Evaluation
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3 shadow-md">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Submission Notice:</span>
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Evaluating in Progress Modal / Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-slate-800 text-center space-y-5 shadow-2xl">
            <div className="relative mx-auto h-16 w-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="h-7 w-7 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                Evaluating Your Low-Level Design
              </h3>
              <p className="text-xs text-slate-400">
                {submittingStep || "Running architectural analysis..."}
              </p>
            </div>
            <div className="space-y-2 text-left bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Single Responsibility & God-Class check</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Abstraction & Strategy pattern verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Coupling, cohesion & interface contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Generating evidence quotes & suggestions</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Requirements & Invariants Reference Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-36 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
          <div className="p-5 rounded-xl border border-slate-800 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-400" />
                Requirements Checklist
              </h2>
              <DifficultyBadge difficulty={problem.difficulty} />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {problem.shortDescription}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Functional Requirements:
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {problem.functionalRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 p-2 rounded bg-slate-900/60 border border-slate-800/60">
                    <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Key Constraints & Edges:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {problem.constraints.concat(problem.sampleEdgeCases.slice(0, 2)).map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Side: Structured LLD Design Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section A: Requirements Understanding */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    A
                  </span>
                  Requirements Understanding & Scope
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                Briefly summarize how you interpret the system's core purpose and key functional expectations.
              </p>
              <textarea
                value={formData.requirementsUnderstanding}
                onChange={(e) => handleChange("requirementsUnderstanding", e.target.value)}
                rows={3}
                placeholder="e.g. The system manages multi-level parking, allocates spots based on vehicle size, and computes fees upon exit..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.requirementsUnderstanding && (
                <p className="text-xs text-rose-400">{validationErrors.requirementsUnderstanding}</p>
              )}
            </div>

            {/* Section B: Assumptions */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    B
                  </span>
                  Assumptions & System Boundaries
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                State your architectural assumptions (e.g. payment collection timing, sensor signals, floor limits).
              </p>
              <textarea
                value={formData.assumptions}
                onChange={(e) => handleChange("assumptions", e.target.value)}
                rows={3}
                placeholder="e.g. 1. Floor count is fixed at 4. 2. Payments happen at exit gate via integrated card reader..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.assumptions && (
                <p className="text-xs text-rose-400">{validationErrors.assumptions}</p>
              )}
            </div>

            {/* Section C: Core Classes / Interfaces */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    C
                  </span>
                  Core Classes, Interfaces & Enums
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                List the classes, interfaces, abstract classes, and enums that make up your domain model.
              </p>
              <textarea
                value={formData.coreClasses}
                onChange={(e) => handleChange("coreClasses", e.target.value)}
                rows={5}
                placeholder={`Entities:
- class ParkingLot, ParkingFloor, ParkingSpot
- class Vehicle, Car, Motorcycle, Truck
- class Ticket, Payment

Interfaces:
- interface SpotAllocationStrategy
- interface PricingStrategy`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
              {validationErrors.coreClasses && (
                <p className="text-xs text-rose-400">{validationErrors.coreClasses}</p>
              )}
            </div>

            {/* Section D: Responsibilities (SRP) */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    D
                  </span>
                  Class Responsibilities (Single Responsibility Principle)
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                Define what each class is responsible for. Crucial: Avoid creating god classes that handle both business calculations and orchestration.
              </p>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => handleChange("responsibilities", e.target.value)}
                rows={4}
                placeholder={`- ParkingLot: Top-level coordinator managing entry/exit gates and floor state.
- SpotAllocationStrategy: Responsible solely for finding and reserving optimal parking spot.
- PricingStrategy: Responsible solely for calculating fees based on duration and vehicle type.`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.responsibilities && (
                <p className="text-xs text-rose-400">{validationErrors.responsibilities}</p>
              )}
            </div>

            {/* Section E: Relationships */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    E
                  </span>
                  Relationships (Composition, Inheritance, Association)
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                Describe how classes are connected. Favor composition over deep inheritance.
              </p>
              <textarea
                value={formData.relationships}
                onChange={(e) => handleChange("relationships", e.target.value)}
                rows={3}
                placeholder={`- ParkingLot HAS-A List<ParkingFloor> (Composition)
- ParkingFloor HAS-A List<ParkingSpot> (Composition)
- ParkingLot HAS-A SpotAllocationStrategy (Aggregation / Strategy injection)
- Car, Motorcycle EXTEND Vehicle (Inheritance)`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.relationships && (
                <p className="text-xs text-rose-400">{validationErrors.relationships}</p>
              )}
            </div>

            {/* Section F: Important Methods & Contracts */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    F
                  </span>
                  Important Methods & Behavioral Contracts
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                Specify primary method signatures and what contracts they fulfill.
              </p>
              <textarea
                value={formData.importantMethods}
                onChange={(e) => handleChange("importantMethods", e.target.value)}
                rows={4}
                placeholder={`- ParkingLot.enter(Vehicle v): Ticket
- ParkingLot.exit(Ticket t): Receipt
- SpotAllocationStrategy.allocate(List<ParkingFloor> floors, VehicleType type): ParkingSpot
- PricingStrategy.calculateFee(Ticket t, Date exitTime): number`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
              {validationErrors.importantMethods && (
                <p className="text-xs text-rose-400">{validationErrors.importantMethods}</p>
              )}
            </div>

            {/* Section G: Design Patterns */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    G
                  </span>
                  Design Patterns & Abstractions Used
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                State which patterns you chose (e.g. Strategy, State, Factory, Observer) and the exact problem each pattern solves.
              </p>
              <textarea
                value={formData.designPatterns}
                onChange={(e) => handleChange("designPatterns", e.target.value)}
                rows={3}
                placeholder={`- Strategy Pattern: Used for SpotAllocationStrategy and PricingStrategy to allow swapping algorithms at runtime.
- Factory Pattern: Used for Vehicle and Spot instantiation based on requested types.`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.designPatterns && (
                <p className="text-xs text-rose-400">{validationErrors.designPatterns}</p>
              )}
            </div>

            {/* Section H: Edge Cases & Concurrency */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    H
                  </span>
                  Edge Cases, Concurrency & Failure Handling
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                How does your design handle race conditions, full capacity, lost tickets, or hardware sensor failures?
              </p>
              <textarea
                value={formData.edgeCases}
                onChange={(e) => handleChange("edgeCases", e.target.value)}
                rows={3}
                placeholder={`- Concurrency: Synchronized spot allocation block / atomic reservation on ParkingSpot to prevent double-booking.
- Lot Full: Barrier refuses entry if available spot count for that vehicle type is 0.
- Lost Ticket: Fallback lost ticket flow applying flat penalty rate.`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.edgeCases && (
                <p className="text-xs text-rose-400">{validationErrors.edgeCases}</p>
              )}
            </div>

            {/* Section I: Trade-offs & Design Decisions */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="h-5 w-5 rounded bg-blue-950 text-blue-400 border border-blue-800 flex items-center justify-center text-xs">
                    I
                  </span>
                  Trade-offs & Architectural Decisions
                </label>
                <span className="text-xs text-slate-500">Mandatory</span>
              </div>
              <p className="text-xs text-slate-400">
                Explain what trade-offs you made (e.g. why you favored extensibility over simplicity, or memory vs lookup speed).
              </p>
              <textarea
                value={formData.tradeOffs}
                onChange={(e) => handleChange("tradeOffs", e.target.value)}
                rows={3}
                placeholder={`- Strategy interfaces vs hardcoded pricing: Added more classes, but enables new weekend or surge pricing without editing core parking lot code.
- Pre-indexing spots by type vs dynamic filtering: Uses extra Map memory per floor for O(1) spot queries.`}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
              {validationErrors.tradeOffs && (
                <p className="text-xs text-rose-400">{validationErrors.tradeOffs}</p>
              )}
            </div>

            {/* Free-form Solution Notes */}
            <div className="p-6 rounded-xl border border-slate-800 bg-card space-y-2.5">
              <label className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-400" />
                Additional Solution Notes / Future Extensions (Optional)
              </label>
              <textarea
                value={formData.solutionNotes || ""}
                onChange={(e) => handleChange("solutionNotes", e.target.value)}
                rows={3}
                placeholder="Any further notes, class diagrams in text, or future microservice migration considerations..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            {/* Bottom Submit CTA Banner */}
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 space-y-0.5">
                <div className="font-bold text-slate-200">Ready for evaluation?</div>
                <div>Your submission will be scored across all 8 rubric dimensions with explainable feedback.</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                >
                  Save Draft
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit for Evaluation
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
