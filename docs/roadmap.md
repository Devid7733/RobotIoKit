# RobotIoKit Roadmap

## Purpose
This file provides long-term direction so implementation tasks stay aligned with the project goal.

It is not a place for broad rewrites. It is a guide for safe phased progress.

---

## Phase 1 — Architecture Refactor
Goal:
Clean up project structure without breaking existing features.

Targets:
- move DB access into repositories
- move business logic into services
- keep routes thin
- clean up mixed logic in `lib/`

Execution order:
1. product
2. cart
3. order

Success criteria:
- module boundaries are clear
- frontend behavior is preserved
- routes are simpler
- logic is easier to test and maintain

---

## Phase 2 — Backend Cleanup
Goal:
Improve consistency and remove technical debt after the main module refactors.

Targets:
- standardize API structure
- remove duplicated logic
- remove remaining mixed helper logic
- improve auth-related cleanliness
- improve maintainability of shared flows

Success criteria:
- less duplication
- fewer cross-module leaks
- consistent patterns across modules

---

## Phase 3 — Chatbot Modularization
Goal:
Turn the chatbot from a single mixed feature into a modular subsystem.

Target modules:
- intent parser
- rule engine
- product recommender
- optional llm adapter later

Important rules:
- keep chatbot grounded in real app data
- keep rule-based flow as fallback
- do not let AI control transactional truth

Success criteria:
- chatbot logic is easier to extend
- FAQ and product recommendation paths are separated cleanly
- future AI integration becomes easier

---

## Phase 4 — AI Integration
Goal:
Add optional LLM support in a safe way.

Possible model path:
- local model adapter
- grounded product-aware response generation

Rules:
- do not let AI write directly to Prisma
- do not let AI decide checkout totals, payment truth, or admin actions
- keep service layer in control

Success criteria:
- chatbot becomes more natural
- recommendations improve
- deterministic flows remain safe

---

## Phase 5 — UX and Product Improvement
Goal:
Improve the user experience after architecture becomes stable.

Potential targets:
- robot kit detail page
- more consistent storefront behavior
- better user/account polish
- better admin workflow polish

---

## Phase 6 — Thesis / Final Project Preparation
Goal:
Prepare final presentation-quality documentation and system explanation.

Targets:
- architecture diagram
- database explanation
- workflow diagrams
- feature summary
- technical justification
- chatbot explanation

Success criteria:
- project is explainable clearly
- architecture decisions are defendable
- system appears professional and intentional