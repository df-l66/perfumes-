# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A business management system (inventory, sales, purchases, clients, suppliers) originally built for a perfumery ("perfumes-"), with fields in the data model that also support a generic/clothing business (`giro`: `general` | `perfumeria` | `moda`). UI text, comments, and commit messages are in Spanish. It's a two-package monorepo:

- `backend/` — Express + TypeScript API, using Supabase (Postgres) as the database via the service-role key (RLS bypassed server-side).
- `frontend/` — React 19 + TypeScript + Vite SPA, styled with Tailwind CSS v4, using Supabase directly for auth and realtime subscriptions, and calling the backend for all data CRUD.

## Token-heavy tasks

For large refactors, bulk code generation, or any task that would otherwise burn a lot of tokens on boilerplate and long explanations, invoke the `ponytail` skill (`/ponytail` or `/ponytail ultra` for the most aggressive mode). It forces minimal, stdlib/native-first solutions and caps explanations to a few lines, which keeps both the diff and the response short. Skip it for tasks that genuinely need the full version (security-sensitive code, anything the user explicitly asked to be thorough about).

## Commands

Backend (run from `backend/`):
- `npm run dev` — start the API with nodemon/ts-node (reads `backend/.env`)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server (`dist/index.js`)
- `npm run seed` — populate Supabase with mock proveedores/productos/clientes/materias primas (`src/seed.ts`)
- There is no real test suite (`npm test` is a placeholder)

Frontend (run from `frontend/`):
- `npm run dev` — start Vite dev server
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

Both packages need their own `.env` (see `backend/.env.example` for the backend's required vars: `PORT`, `SUPABASE_URL`, `SUPABASE_KEY`; the frontend's `.env` needs `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_N8N_CHAT_WEBHOOK_URL` for the chatbot widget).

## Architecture

### Auth and roles
- Two roles: `admin` and `vendedor` (seller). The frontend keeps role in `AuthContext` (`frontend/src/context/AuthContext.tsx`), sourced from Supabase's `profiles` table (not just `auth.users`), and gates routes in `App.tsx` via `<ProtectedRoute adminOnly>`.
- The backend's `authMiddleware` (`backend/src/middlewares/auth.middleware.ts`) verifies the Supabase JWT from the `Authorization: Bearer` header and looks up the caller's role in `profiles`. **Important quirk:** any `GET` request with a missing/invalid/expired token is treated as an authenticated `system`/`admin` user rather than rejected — only non-GET requests are hard-blocked without a valid token. Keep this in mind when reasoning about what's actually protected.
- `adminMiddleware` currently allows both `admin` and `vendedor` roles (plus the synthetic `system` user) — it does not yet enforce a strict admin-only boundary at that layer; route-level composition (`authMiddleware, adminMiddleware`) is what backend routes use for the "administrative" routes in `backend/src/index.ts`.
- `frontend/src/api/apiClient.ts`'s `fetchWithAuth` attaches the Supabase session token to every request and falls back to reading a token out of `localStorage` if no live session is found.

### Backend structure
- Routes (`backend/src/routes/*.routes.ts`) are thin and map HTTP verbs to controllers; all business logic lives in `backend/src/controllers/*.controller.ts`.
- Controllers talk to Supabase directly via `getSupabaseClient()` (`backend/src/config/supabase.ts`) — there is no ORM. Table names mirror the domain: `productos`, `proveedores`, `clientes`, `ventas`/`venta_detalles`, `compras`, `materias_primas`, `movimientos_kardex`, `movimientos_materias_primas`, `abonos`, `gastos`, `profiles`.
- `backend/src/index.ts` is the single place where route mounting + middleware layering happens; it also configures a permissive CORS policy (any `localhost` or `*.vercel.app` origin, plus `FRONTEND_URL`).
- Stock/inventory bookkeeping is done manually in controllers (no DB triggers): every sale/purchase/void mutates `stock` on `productos` or `materias_primas` directly and inserts a corresponding audit row into `movimientos_kardex` (finished products) or `movimientos_materias_primas` (raw materials/ingredients). See `ventas.controller.ts`'s `createVenta`/`anularVenta` for the canonical pattern — it must stay symmetric (voiding a sale must reverse every stock and financial side effect the sale created, including credit balances and FIFO payment allocation).
- Credit sales (`metodo_pago: 'credito'`) run a simple FIFO settlement algorithm after any abono (payment) is recorded: outstanding `ventas` for a client are marked `completada`/`pendiente` in chronological order based on cumulative payments received. This logic is duplicated in both `createVenta` and `anularVenta` in `ventas.controller.ts` — if you change the allocation rule, update both places.
- Products can be "por encargo" (made-to-order), flagged via a `[POR_ENCARGO]` marker embedded in the `descripcion` string rather than a dedicated column; such products don't go negative on stock and always report `estado: 'activo'`.
- Perfume sale items can be `es_preparado` (a custom-mixed fragrance) carrying a `receta` (recipe) of raw-material quantities instead of a `producto_id`; these decrement `materias_primas` stock instead of `productos` stock.
- `/api/public/registro-cliente` is the only unauthenticated route — a public self-registration form for new clients (see `RegistroCliente.tsx`), which the frontend also listens for via a Supabase realtime subscription (`clientes-inserts` channel in `AppDataContext.tsx`) to raise an in-app notification when a new client registers.

### Frontend structure
- `AppDataContext` (`frontend/src/context/AppDataContext.tsx`) is the single global store for all domain data (products, clients, sales, purchases, kardex, raw materials, config, logs, users) — it fetches everything on mount and exposes CRUD actions that call `frontend/src/api/*.ts`, then optimistically patch local state from the API response. Every mutation action also writes an audit-trail entry via `addLog(...)` to the `logs`/`activity_logs` backend endpoint. New domain data should follow this same fetch-on-mount + context-exposed-mutator pattern rather than fetching ad hoc from pages.
- `frontend/src/api/*.ts` files are one-per-domain thin wrappers around `fetchWithAuth`, mirroring the backend's route/controller split.
- Routing and role gating live in `frontend/src/App.tsx`; pages are lazy-loaded per route. `vendedor` users land on `/ventas`, `admin` users land on `/dashboard`.
- `frontend/src/types/index.ts` is the single source of truth for domain shapes shared across pages/context/api — keep it in sync with the Supabase schema when adding columns.
- Multi-tenant-ish customization comes from `CompanyConfig.giro` (`general`/`perfumeria`/`moda`) plus optional per-giro fields on `Producto` (e.g. `mililitros`/`familia_olfativa` for perfumery, `talla`/`color` for clothing) — features specific to perfumery (like "Preparar Triple AAA" custom-mix flow in `PrepararTripleAaaModal.tsx`) should stay conditional on `giro` rather than assumed globally.
- `ChatbotWidget.tsx` integrates an external n8n webhook chat flow, configured via `VITE_N8N_CHAT_WEBHOOK_URL`; it degrades to an in-UI warning message if that env var is unset.
- Excel import/export (`ExcelImportModal.tsx`, `utils/excelUtils.ts`, `utils/exportToCSV.ts`) and PDF export (via `jspdf`/`jspdf-autotable`/`html2canvas`) are used for bulk product loading and invoice/report generation.
