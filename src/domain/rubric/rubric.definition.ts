import { RubricDimensionKey, RubricDimensionMeta } from "../types";

export const RUBRIC_DIMENSIONS: Record<RubricDimensionKey, RubricDimensionMeta> = {
  REQUIREMENT_UNDERSTANDING: {
    key: "REQUIREMENT_UNDERSTANDING",
    label: "Requirement Understanding",
    weight: 12.5,
    description: "Evaluates how thoroughly the solution addresses functional requirements, assumptions, and constraints.",
    evaluationCriteria: "Check if all mandatory system behaviors are captured, assumptions are realistic, and constraints are explicitly acknowledged.",
  },
  CLASS_RESPONSIBILITIES: {
    key: "CLASS_RESPONSIBILITIES",
    label: "Class Responsibilities (SRP)",
    weight: 12.5,
    description: "Evaluates whether classes adhere to the Single Responsibility Principle and avoid monolithic 'God classes'.",
    evaluationCriteria: "Classes should have a single well-defined reason to change. Check for classes doing orchestration + persistence + pricing + validation all at once.",
  },
  COUPLING_COHESION: {
    key: "COUPLING_COHESION",
    label: "Coupling & Cohesion",
    weight: 12.5,
    description: "Evaluates whether closely related functionality is grouped together while keeping dependencies between modules minimal.",
    evaluationCriteria: "High cohesion within domain boundaries and low coupling between independent modules. Avoid tight cyclic dependencies.",
  },
  ENCAPSULATION_INTERFACES: {
    key: "ENCAPSULATION_INTERFACES",
    label: "Encapsulation & Interfaces",
    weight: 12.5,
    description: "Evaluates data hiding, clean interfaces, and programming to abstractions rather than concrete classes.",
    evaluationCriteria: "Public interfaces expose only required behaviors. Internal state is protected. Interfaces and abstract classes define clean contracts.",
  },
  ABSTRACTION_DESIGN_PATTERNS: {
    key: "ABSTRACTION_DESIGN_PATTERNS",
    label: "Abstraction & Design Patterns",
    weight: 12.5,
    description: "Evaluates appropriate use of recognized design patterns (Strategy, State, Factory, Observer, etc.) where genuinely beneficial.",
    evaluationCriteria: "Patterns should solve real extensibility/variability problems, not be forced or over-engineered.",
  },
  EXTENSIBILITY: {
    key: "EXTENSIBILITY",
    label: "Extensibility (Open-Closed)",
    weight: 12.5,
    description: "Evaluates how easily the design accommodates new requirements (e.g. new vehicle types, pricing models, dispatch strategies) without modifying existing code.",
    evaluationCriteria: "Adherence to Open-Closed Principle. New behaviors should be addable via extension or strategy substitution.",
  },
  EDGE_CASES_TESTABILITY: {
    key: "EDGE_CASES_TESTABILITY",
    label: "Edge Cases & Testability",
    weight: 12.5,
    description: "Evaluates consideration of concurrency, race conditions, failure recovery, resource exhaustion, and ease of unit testing.",
    evaluationCriteria: "Examines handling of boundary states (full capacity, hardware failure, duplicate actions) and whether dependencies can be mocked.",
  },
  EXPLANATION_QUALITY: {
    key: "EXPLANATION_QUALITY",
    label: "Quality of Explanation & Trade-offs",
    weight: 12.5,
    description: "Evaluates the clarity of design rationale, justification of architectural decisions, and honest articulation of trade-offs.",
    evaluationCriteria: "Demonstrates engineering maturity by explaining why certain patterns were chosen, alternatives considered, and inherent trade-offs.",
  },
};

export const RUBRIC_DIMENSION_KEYS = Object.keys(RUBRIC_DIMENSIONS) as RubricDimensionKey[];
