# Parameterize Current Cash and Mortgage Years Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make "Current Cash" and "Mortgage Years" editable via UI and initializable via URL parameters.

**Architecture:** 
1. Use `useSearchParams` from `next/navigation` to read `cash` and `years` parameters.
2. Initialize `inputs` state with these values (defaulting to 800,000 and 30 if absent).
3. Add `Input` components for both variables in the "Set Variables" panel.
4. Wrap the component in `Suspense` as required by Next.js when using `useSearchParams` in a client component.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, shadcn/ui.

---

### Task 1: Setup Search Params and Suspense

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Import `useSearchParams` and `Suspense`**

```tsx
import React, { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
```

- [ ] **Step 2: Create a wrapper component for Suspense**
The current `RealEstateSimulator` uses `useSearchParams`. To avoid issues with static export and server-side rendering, wrap it in a separate component.

```tsx
function SimulatorContent() {
  const searchParams = useSearchParams();
  const initialCash = Number(searchParams.get("cash")) || 800000;
  const initialYears = Number(searchParams.get("years")) || 30;

  const [inputs, setInputs] = useState({
    mySalary: 450,
    wifeSalary: 400,
    aptPrice: 145000,
    currentCash: initialCash,
    mortgageAmount: 60000,
    mortgageRate: 5.0,
    mortgageYears: initialYears,
    creditLoanRate: 5.5,
    monthsUntilPurchase: 10,
    livingExpense: 250,
  });
  // ... rest of the component
}

export default function RealEstateSimulator() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
```

- [ ] **Step 3: Verify build**
Run: `npm run build`
Expected: Build passes without "useSearchParams() should be wrapped in a suspense boundary" error.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add URL parameter support for cash and years"
```

### Task 2: Add UI Inputs for Cash and Mortgage Years

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add "현재 현금" input field**
Place it before or after the salary inputs in the "Set Variables" card.

```tsx
<div className="space-y-1">
  <Label className="text-xs text-slate-500">현재 현금 (만)</Label>
  <Input
    type="number"
    value={inputs.currentCash}
    onChange={(e) => setInputs({ ...inputs, currentCash: +e.target.value })}
  />
</div>
```

- [ ] **Step 2: Add "대출 기간" input field**
Place it near the mortgage amount/rate inputs.

```tsx
<div className="space-y-1">
  <Label className="text-xs text-slate-500">대출 기간 (년)</Label>
  <Input
    type="number"
    value={inputs.mortgageYears}
    onChange={(e) => setInputs({ ...inputs, mortgageYears: +e.target.value })}
  />
</div>
```

- [ ] **Step 3: Update the summary box text to be consistent**
Ensure the summary box `formatKRW(inputs.currentCash)` reflects the change.

- [ ] **Step 4: Verify UI**
Run `npm run dev` and manually check if inputs work and calculations update.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add UI inputs for current cash and mortgage years"
```

### Task 3: Final Verification and Cleanup

- [ ] **Step 1: Test with URL parameters**
Open `http://localhost:3000/?cash=50000&years=40`
Expected: "현재 현금" shows 50,000 and "대출 기간" shows 40.

- [ ] **Step 2: Check responsiveness**
Ensure the new inputs don't break the layout on mobile.

- [ ] **Step 3: Run lint**
Run: `npm run lint`
Expected: No lint errors.

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "chore: final verification complete"
```
