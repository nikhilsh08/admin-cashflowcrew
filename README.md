# Cashflowcrew Admin Dashboard

Welcome to the **Cashflowcrew** Admin Dashboard repository (`admin-cashflowcrew`)! This document provides a detailed technical overview for developers working on the administrative side of the platform.

This application is built as a separate Single Page Application (SPA), completely decoupled from the main user-facing frontend. Its sole purpose is to provide a robust interface for administrators to manage the Cashflowcrew ecosystem.

---

## 🏗️ 1. Architecture & Tech Stack Overview

- **Framework**: React 19 bootstrapped with Vite.
- **Language**: TypeScript (Strict mode).
- **Styling**: Tailwind CSS (v4) with Radix UI Primitives (Accordion, Dialog, Select, Tabs, etc.) to build accessible standard components.
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`). This is crucial for maintaining complex global states like the currently authenticated admin session.
- **Routing**: React Router DOM (v7) for client-side navigation.
- **Data Fetching**: Axios is used extensively to communicate with the Next.js API.
- **Rich Text / CMS capabilities**: Tiptap Editor (and React Quill) for writing, formatting, and publishing detailed Blog posts directly from the admin interface.
- **Data Visualization**: Recharts for rendering the dashboard analytics graphs and trends.
- **Date Utilities**: `date-fns` and `react-day-picker` for handling calendar inputs (especially useful for course scheduling or filtering orders).

---

## 🔗 2. Relationship with the Main App

This Admin SPA **does not have its own database**. 

Instead, it relies entirely on the Next.js `ai-autual-fund-analysis` application. All API calls made by this Admin dashboard are directed to the `http://localhost:3000/api/admin/*` endpoints.

### Authentication Flow
1. Admin enters credentials on the `<Login />` page (`/`).
2. The app dispatches a Redux thunk (`checkAdminAuth` or similar login action in `_authContext/slice.ts`), which POSTs to the Next.js `/api/auth` or specific admin login endpoint.
3. Upon success, a JWT token (or session cookie) is established.
4. The Redux store saves the `user` state. Future Axios requests automatically include necessary session identifiers to pass the Next.js `Role === ADMIN` middleware guard.

---

## 📁 3. Project File Structure (`src`)

The source directory contains the core logic of the application:

- `/src/App.tsx`: The heart of the routing. Maps URLs (e.g., `/admin/users`) to specific Components and handles the `AdminLayout` wrapper.
- `/src/_authContext`: Contains the Redux Toolkit configuration (`store.ts`) and the specific `slice.ts` managing admin session state.
- `/src/components`: The primary views and features:
  - `Dashboard/`: Contains sub-components for rendering Recharts statistics.
  - `AdminLayout.tsx` / `AdminSidebar.tsx`: The consistent structural shell around all admin pages.
  - `Users.tsx`: Renders data grids displaying all `User` and `Lead` objects.
  - `MasterClassManagement.tsx`: The UI for creating `Course` objects, associating TrainerCentral links, and setting pricing.
  - `OrderDetails.tsx`: Deep-dive view of a single `Order` and its `PaymentTransaction` history.
  - `BlogsManagement.tsx` & `BlogFormPage.tsx`: The CMS interface utilizing Tiptap to create rich content.
  - `CouponsManagement.tsx`: For managing discount codes and limits.
- `/src/lib`: Standard utility functions, class merging helpers (`utils.ts`), UploadThing configs, and custom hooks.

---

## 🚀 4. Getting Started locally

To develop the Admin Dashboard, you **must have the Next.js backend running concurrently**.

1. **Start the Next.js backend**
   Follow the setup instructions in the `ai-autual-fund-analysis` repo and ensure it is running on port 3000.

2. **Clone and setup this repo**
   ```bash
   git clone <repo-url>
   cd admin-cashflowcrew
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file (or `.env.local`). The most critical variable is where to point API requests:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
   *(Ensure Axios is configured in `src/lib/utils` or similar to prefix calls with this URL).*

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:5173`.

---

## 🧠 5. Development Patterns & Guidelines

- **Protected Routes**: Notice in `App.tsx` how `useEffect` intercepts unauthenticated users. If you build a new page, make sure it sits under the `/admin/` path and is wrapped inside `<AdminLayout>`.
- **API Calls**: Try to centralize your Axios logic, handling API errors using `sonner` Toaster messages effectively so admins understand failed actions (like failing to create a coupon).
- **TypeScript**: We enforce strict types. If you add a new API endpoint in Next.js, define its Interface here first to ensure your Redux states and component props know exactly what data shape to expect.

Happy coding!
