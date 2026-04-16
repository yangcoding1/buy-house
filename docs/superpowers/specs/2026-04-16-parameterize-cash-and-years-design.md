# Design: Parameterize Current Cash and Mortgage Years

## Problem Statement
The current real estate simulator uses fixed or hard-coded initial values for "Current Cash" and "Mortgage Years". To improve flexibility, these should be editable via UI and initializable via URL parameters.

## Proposed Changes

### 1. UI Input Additions (`app/page.tsx`)
In the "Set Variables" (설정 변수) panel, add the following input fields:
- **현재 현금 (만):** Updates `inputs.currentCash`.
- **대출 기간 (년):** Updates `inputs.mortgageYears`.

### 2. URL Parameter Integration
- Use `useSearchParams` from `next/navigation` to read initial values on page load.
- Parameters: `cash` (for currentCash), `years` (for mortgageYears).
- Default values (if not in URL):
  - `currentCash`: 800,000 (8억 KRW)
  - `mortgageYears`: 30 (years)

### 3. Calculation Methodology
- **Mortgage Payment:** Maintain "Principal and Interest Equal Repayment" (원리금 균등 상환) using the existing `calculateMonthlyPayment` formula.
- **State Update:** Ensure all derived values in `useMemo` re-calculate when these inputs change.

## Verification Plan
- **Manual Verification:** 
  - Change "Current Cash" in the UI and verify "Total Available Cash at Settlement" (잔금일 총 가용 현금) updates.
  - Change "Mortgage Years" and verify "Monthly Mortgage Payment" updates.
  - Load page with `?cash=50000&years=40` and verify initial inputs reflect these values.
- **Code Review:** Ensure no hard-coded 800,000 remains and `useSearchParams` is correctly handled (e.g., wrapped in `Suspense` if needed for Next.js 15+).
