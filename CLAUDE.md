# Claude: First Principles Framework

A systematic approach to breaking down any problem, validating assumptions, and building solutions from the ground up.

---

## 1. Define the True Problem

**Goal:** Strip away assumptions and identify what you're actually trying to solve.

### Questions to Ask
- What is the actual pain point or inefficiency?
- Whose problem are you solving? (Be specific about the user/customer)
- What would success look like without this problem?
- What constraints are real vs. assumed?

### Exercise
Write the problem statement in one sentence. If you can't, you don't fully understand it yet.

**Example:** "Teams waste 3+ hours/week coordinating async work across tools" (not "we need better project management")

---

## 2. Identify Core Assumptions

**Goal:** Surface beliefs that could be wrong, then validate them.

### Framework
List every assumption about:
- **User behavior:** How do people actually work? (Test this—don't assume)
- **Market/demand:** Will people pay for this? Is the problem frequent enough?
- **Technical feasibility:** Can it be built with reasonable resources?
- **Business model:** How do you make money? Who pays?
- **Competition:** Why would someone choose you over existing solutions?

### Validation Checklist
- [ ] User interviews or direct observation (not surveys alone)
- [ ] Competitor/alternative analysis (what do they do well/poorly?)
- [ ] Prototype or MVP testing (can you build a working version?)
- [ ] Financial viability check (unit economics work?)

---

## 3. Break Down to Fundamentals

**Goal:** Reduce the problem to irreducible principles—the "building blocks."

### Method
1. **What must be true?** (Non-negotiables for the solution to work)
2. **What are the minimal components?** (What's the absolute minimum to solve this?)
3. **What can be added/optimized later?** (Nice-to-haves vs. need-to-haves)

### Example Decomposition
**Problem:** Build an agentic SaaS platform

Fundamentals:
- Users describe what they want in plain English
- AI interprets the intent and generates code
- Code is deployed to production
- User can iterate and modify (feedback loop)
- System secures user data and API keys

Nice-to-haves initially:
- Beautiful dashboard
- Advanced monitoring
- Multi-team support
- Custom integrations

---

## 4. Challenge Every Assumption

**Goal:** Ask "why?" ruthlessly. Flip assumptions upside down.

### Techniques

**Question Everything**
- Why do it this way and not that way?
- What if we removed this constraint?
- What if cost/time/complexity didn't matter?
- What would an expert in an unrelated field do?

**Inversion**
- Instead of "How do we retain users?" → "How would we drive them away?"
- Instead of "How do we scale?" → "What breaks if we don't scale?"

**Analogies from Other Fields**
- How does a supply chain handle inventory? (applies to data pipelines)
- How does a restaurant manage orders? (applies to async job queues)
- How does a military plan operations? (applies to complex project coordination)

---

## 5. Design the Solution Architecture

**Goal:** Build a clear, defensible blueprint before coding.

### Key Questions
- **What is the flow?** (User → System → Output)
- **What components must talk to each other?** (Dependencies)
- **What can fail, and how do we handle it?** (Error boundaries, fallbacks)
- **What are the bottlenecks?** (Performance constraints)
- **How do we measure success?** (Metrics that matter)

### Simple Framework
```
INPUT → PROCESSING → OUTPUT → FEEDBACK LOOP

Example: Natural English → Claude API → Code generation → Deploy to Cloud → User iteration
```

---

## 6. Validate with a Minimal Viable Version

**Goal:** Test core assumptions with the smallest, scrappiest version possible.

### MVP Checklist
- [ ] Can users articulate the problem they're solving?
- [ ] Does your solution actually solve it (even if imperfectly)?
- [ ] Can you measure whether it works?
- [ ] What's the critical path? (Focus there first)
- [ ] What can you fake/automate to test the concept?

### Anti-Pattern
Building the "beautiful" version before proving the concept works.

---

## 7. Iterate Based on Reality

**Goal:** Use real-world feedback to refine assumptions and direction.

### Feedback Loop
1. **Build** → Minimal version
2. **Measure** → Does it work? (Use metrics, not gut feel)
3. **Learn** → What broke? What surprised you?
4. **Iterate** → Adjust assumptions, rebuild

### What to Track
- User adoption/engagement
- Time to value (how quickly do they benefit?)
- Activation rate (% completing core action)
- Churn rate (are they still using it?)
- Support burden (what do they ask for help with?)

---

## 8. Optimize Strategically

**Goal:** Only optimize what matters. Avoid premature optimization.

### Optimization Criteria
- Is this blocking user growth or satisfaction?
- Is this a technical debt risk?
- What's the ROI of optimizing this vs. building something new?

### Optimization Hierarchy
1. **Core user experience** (Does it work smoothly?)
2. **Performance** (Is it fast enough?)
3. **Reliability** (Does it fail gracefully?)
4. **Scale** (Can it handle growth?)
5. **Polish** (Does it look/feel great?)

---

## 9. Document Decisions and Tradeoffs

**Goal:** Record *why* you built it this way, not just *how*.

### Template
```
## Decision: [What you decided]

**Context:** [The problem or question]

**Alternatives Considered:**
- Option A (Pro: X, Con: Y)
- Option B (Pro: X, Con: Y)

**Decision:** [What you chose]

**Rationale:** [Why this wins]

**Tradeoff:** [What you're giving up]

**Reversibility:** [Is this easy to change later?]
```

---

## 10. Know When to Stop / Pivot

**Goal:** Recognize when you're on the wrong path or solving the wrong problem.

### Red Flags
- Users don't care (low engagement even after iteration)
- Technical debt is crushing progress
- Market conditions changed
- You've learned the problem isn't as big as assumed
- Better solution already exists (and you can't differentiate)

### Decision Framework
- **Pivot if:** The problem is smaller/different than assumed
- **Iterate if:** The problem is real but your solution isn't optimal
- **Double down if:** Metrics are positive and assumptions are validated
- **Stop if:** No evidence the problem exists at scale

---

## Quick Reference: Apply This to Your Current Project

### For [Your Project Name]:

**1. True Problem (1 sentence):**
_[What are you actually solving?]_

**2. Core Assumptions (Top 3):**
- [ ] Assumption 1 - Validated by: ___
- [ ] Assumption 2 - Validated by: ___
- [ ] Assumption 3 - Validated by: ___

**3. Irreducible Fundamentals:**
- Must have:
- Must avoid:
- Can add later:

**4. MVP (Next 2 weeks):**
- What's the critical path?
- What's the minimum experiment?
- How will you measure success?

**5. Key Metric:**
_[The one number that tells you if this is working]_

---

## References & Further Reading

- **"First Principles: What It Is and Why It Matters" (Elon Musk)** – Start from the ground up, not analogy
- **"The Lean Startup" (Eric Ries)** – Build, measure, learn cycles
- **"Jobs to Be Done" (Clayton Christensen)** – Understanding actual customer motivation
- **"Thinking, Fast and Slow" (Daniel Kahneman)** – Cognitive biases that derail thinking

---

## When to Use This Framework

✅ Starting a new project  
✅ Stuck and need to reset  
✅ Major technical or product decision  
✅ Scaling something that works  
✅ Diagnosing why something isn't working  

❌ Quick bug fixes  
❌ Routine maintenance  
❌ When you're deep in execution (keep it for retrospectives)

---

**Last Updated:** May 2026  
**Author:** Carl @ Platfrmr  
**Version:** 1.0
