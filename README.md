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
- **Rich Text / CMS capabilities**: Tiptap Editor for writing, formatting, and publishing detailed Blog posts and Masterclass rich content directly from the admin interface.
- **Data Visualization**: Recharts for rendering the dashboard analytics graphs and trends.
- **Date Utilities**: `date-fns` and `react-day-picker` for handling calendar inputs (especially useful for course scheduling or filtering orders).
- **Form Management**: React Hook Form for complex form state management with validation.

---

## 🔗 2. Relationship with the Main App

This Admin SPA **does not have its own database**. 

Instead, it relies entirely on the Next.js `ai-autual-fund-analysis` application. All API calls made by this Admin dashboard are directed to the `http://localhost:3000/api/admin/*` endpoints.

### Authentication Flow
1. Admin enters credentials on the `<Login />` page (`/`).
2. The app dispatches a Redux thunk (`checkAdminAuth` or similar login action), which POSTs to the Next.js `/api/auth` or specific admin login endpoint.
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
  - `MasterClassManagement.tsx`: The UI for creating `Course` objects, associating TrainerCentral links, and setting pricing. Includes optional rich text editor for detailed course content.
  - `OrderDetails.tsx`: Deep-dive view of a single `Order` and its `PaymentTransaction` history.
  - `BlogsManagement.tsx` & `BlogFormPage.tsx`: The CMS interface utilizing Tiptap to create rich content with full formatting support.
  - `TiptapEditor.tsx`: Reusable rich text editor component supporting:
    - Text formatting (bold, italic, underline, strikethrough)
    - Headings (H1-H4)
    - Lists (ordered and unordered)
    - Block quotes and code blocks with syntax highlighting
    - Image embedding
    - Link insertion
    - Tables
    - Text alignment
    - Color and highlighting
    - Subscript and superscript
    - Undo/redo functionality
  - `CouponsManagement.tsx`: For managing discount codes and limits.
  - `ImageManagement.tsx`: For uploading and managing images used in content.
  - `CategoryManagement.tsx`: For managing product/course categories.
- `/src/lib`: Standard utility functions, class merging helpers (`utils.ts`), UploadThing configs, and custom hooks.
- `/src/components/ui`: Radix UI-based component library for consistent UI elements.

---

## 🚀 4. Getting Started Locally

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
   VITE_SERVER_URL=http://localhost:3000
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
   *(Ensure Axios is configured in components to use these URLs).*

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Access the dashboard at `http://localhost:5173`.

---

## 📝 5. Rich Text Editor (Tiptap)

### Features
The Tiptap editor integrated in the admin panel provides comprehensive text editing capabilities:

- **Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1-H4 support for document structure
- **Lists**: Ordered and unordered lists
- **Code**: Inline code and code blocks with syntax highlighting for JS, TS, CSS, HTML, Python, SQL
- **Content**: Block quotes, horizontal rules
- **Multimedia**: Image embedding with alt text support
- **Links**: Clickable links with proper formatting
- **Tables**: Insert and edit tables with cells
- **Advanced**: Text alignment, color picker, text highlighting
- **Undo/Redo**: Full undo/redo history

### Usage in Components

#### Blogs (BlogFormPage.tsx)
```tsx
<TiptapEditor
    content={formData.content}
    onChange={content => setFormData(prev => ({ ...prev, content }))}
    placeholder="Start writing your amazing blog post here..."
/>
```

#### Masterclass (MasterClassManagement.tsx)
```tsx
<Controller
    name="richContent"
    control={control}
    render={({ field }) => (
        <TiptapEditor
            content={field.value || ''}
            onChange={field.onChange}
            placeholder="Add detailed content here..."
        />
    )}
/>
```

### Output Format
The editor outputs clean HTML that can be safely stored in the database:
```html
<h2>Course Overview</h2>
<p>This is a comprehensive masterclass...</p>
<ul>
  <li>Topic 1</li>
  <li>Topic 2</li>
</ul>
<pre><code class="language-javascript">console.log('Hello');</code></pre>
```

---

## 🧠 6. Development Patterns & Guidelines

- **Protected Routes**: Notice in `App.tsx` how `useEffect` intercepts unauthenticated users. If you build a new page, make sure it sits under the `/admin/` path and is wrapped inside `<AdminLayout>`.
- **API Calls**: Centralize your Axios logic, handling API errors using `sonner` Toaster messages effectively so admins understand failed actions.
- **TypeScript**: We enforce strict types. If you add a new API endpoint in Next.js, define its Interface here first.
- **Form Management**: Use React Hook Form with `register()` for simple fields and `Controller` for complex components like TiptapEditor.
- **Rich Content Storage**: When using TiptapEditor, store the raw HTML output. The backend should serve this as-is.

---

## 🔌 7. API Endpoints Overview

### Authentication
```
POST /api/admin/login
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: AdminUser }
```

### Users
```
GET /api/admin/users
Response: { success: boolean, users: User[] }

GET /api/admin/users/:id
Response: { success: boolean, user: User }
```

### Masterclasses
```
POST /api/admin/masterclass/create
Body: { title, description, richContent, price, ... }
Response: { success: boolean, masterclass: Masterclass }

PATCH /api/admin/masterclass/update/:id
Body: { title, description, richContent, price, ... }
Response: { success: boolean, masterclass: Masterclass }

GET /api/admin/masterclass/all-classes
Response: { success: boolean, courses: Masterclass[] }

GET /api/admin/masterclass/:id
Response: { success: boolean, masterclass: Masterclass, waitlist: WaitlistEntry[] }
```

### Blogs
```
POST /api/admin/blogs
Body: { title, slug, content, excerpt, seoTitle, seoDesc, tags, thumbnail, isPublished }
Response: { success: boolean, blog: Blog }

PUT /api/admin/blogs/:id
Body: { title, slug, content, excerpt, ... }
Response: { success: boolean, blog: Blog }

GET /api/admin/blogs
Response: { success: boolean, blogs: Blog[] }

GET /api/admin/blogs/:id
Response: { success: boolean, blog: Blog }

DELETE /api/admin/blogs/:id
Response: { success: boolean }
```

### Categories
```
GET /api/admin/category
Response: { success: boolean, categories: Category[] }
```

### Coupons
```
GET /api/admin/coupons
POST /api/admin/coupons
PUT /api/admin/coupons/:id
DELETE /api/admin/coupons/:id
```

### Images
```
POST /api/admin/images/upload
Body: FormData with file
Response: { success: boolean, url: string }

GET /api/admin/images
Response: { success: boolean, images: ImageEntry[] }
```

---

## 🛠️ 8. Common Development Tasks

### Adding a New Admin Page
1. Create a new component in `/src/components/`
2. Add the route in `App.tsx`
3. Ensure it's wrapped with `<AdminLayout>`
4. Add navigation link in `AdminSidebar.tsx`

### Creating a Rich Text Form
1. Import TiptapEditor
2. Use React Hook Form's `Controller` component
3. Pass content and onChange to TiptapEditor
4. Store the HTML output in your API payload

### Adding API Integration
1. Create Axios calls in your component
2. Handle success/error with `sonner` toast notifications
3. Define TypeScript interfaces for request/response bodies
4. Use `withCredentials: true` for authenticated requests

---

## 🚢 9. Deployment

### Build Process
```bash
npm run build
```
This generates a production-ready bundle in the `dist/` folder using:
- TypeScript compilation
- Vite bundling
- Tree-shaking for unused code

### Vercel Deployment
The project includes `vercel.json` configuration for seamless Vercel deployment:
```bash
vercel --prod
```

### Environment Variables for Production
```
VITE_SERVER_URL=https://your-api-domain.com
VITE_API_BASE_URL=https://your-api-domain.com/api
```

---

## 📦 10. Dependencies

Key dependencies and their purposes:

| Package | Purpose |
|---------|---------|
| `react` | UI framework |
| `vite` | Build tool |
| `typescript` | Type safety |
| `tailwindcss` | Styling |
| `@radix-ui/*` | Accessible components |
| `react-hook-form` | Form state management |
| `axios` | API client |
| `@tiptap/*` | Rich text editor |
| `lucide-react` | Icons |
| `sonner` | Toast notifications |
| `recharts` | Data visualization |
| `date-fns` | Date utilities |
| `react-router-dom` | Routing |
| `@reduxjs/toolkit` | State management |

---

## 🐛 11. Troubleshooting

### Build Fails with TypeScript Errors
```bash
npm run build
```
Check console output for specific line numbers and type mismatches.

### API Requests Failing
- Verify backend is running on port 3000
- Check `VITE_SERVER_URL` in `.env`
- Ensure authentication token is valid
- Check browser DevTools Network tab for request/response

### Rich Text Editor Not Rendering
- Ensure `@tiptap/react` and extensions are installed
- Verify `TiptapEditor.tsx` component is in correct path
- Check for CSS conflicts with Tailwind

---

## 🤝 Contributing

When adding new features:
1. Follow existing code patterns and component structure
2. Use TypeScript for all new code
3. Add proper error handling and user feedback
4. Test locally with the backend running
5. Update this README if adding new major features

Happy coding!
