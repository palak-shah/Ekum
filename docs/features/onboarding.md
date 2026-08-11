# Onboarding

## Purpose

First-time setup creates the **company** the person will trade as. Until this completes, the main app is gated.

## Who uses it

Users who verified OTP but have no company membership yet.

## User flows

1. Land on `/onboarding` after login when `needsOnboarding` is true.
2. Enter **business name**, **contact person**, **city**, and at least one **super-category** (Men’s / Women’s apparel, Home furnishing, Accessories, Others).
3. Optional: about, GST, fine buy/sell categories (also editable later on profile).
4. Submit → `POST /companies` → refresh session → Home.

## Business rules

- Super-categories are coarse “what do you deal in” chips — distinct from fine product categories (Sarees, Fabric, …) added later.
- New companies start with **`canPublish: false`**. First catalog publish requires **consent to sell**.
- Trade presence defaults allow buying and selling surfaces; creating catalog content keeps selling enabled.
- Contact person name (e.g. Meena) should stay distinct from business name (e.g. Jaipur Emporium).

## Edge cases / empty states

- Missing required fields → inline validation; no company created.
- User already onboarded → should not stay on this route (auth gate sends them Home).

## Seed walkthrough

Seed companies already exist — skip onboarding for Ravi/Meena phones. To re-test onboarding, use a fresh phone number and create a new business.

## Where it lives

- Web: `apps/web/src/features/onboarding/OnboardingPage.tsx`
- API: `apps/api/src/identity/company.service.ts` (`create`)
- Contracts: `packages/domain-types/src/company.ts`, `SuperCategory` in `enums.ts`
