# Rate all quote — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Same/Each chips with top **Rate all** + always per-line rates.

**Architecture:** Client-only UI in `OrderDetailPage`; keep `ratesWithSharedValue`.

**Tech Stack:** React, existing kit Field/TextInput.

---

### Task 1: UI + docs

**Files:** `OrderDetailPage.tsx`, `quoteSameRate.ts`, completeness/design/orders.md/gap matrix

**Done when:** No chips; Rate all fills open lines; unit test still passes.
