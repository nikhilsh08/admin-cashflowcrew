// App.tsx
import React, { Suspense, lazy, useEffect } from "react";
import { Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import { Provider, useDispatch } from 'react-redux';
import axios from "axios";
import Login from "./components/Login";
import { store } from './_authContext/store';
import type { AppDispatch, RootState } from './_authContext/store';
import { checkAdminAuth, logout } from './_authContext/slice';
import { useSelector } from "react-redux";
import { Toaster } from "sonner";
import RequireAdmin from "./components/RequireAdmin";
import AdminLayout from "./components/AdminLayout";

// Each screen is downloaded the first time it is opened, so the login page
// does not load the blog editor, the charts and every other screen up front.
const Users = lazy(() => import("./components/Users"));
const MasterclassManagement = lazy(() => import("./components/MasterClassManagement"));
const CouponsManagement = lazy(() => import("./components/CouponsManagement"));
const CategoryManagement = lazy(() => import("./components/CategoryManagement"));
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const EmailTemplate = lazy(() => import("./components/EmailTemplate"));
const OrderDetails = lazy(() => import("./components/OrderDetails"));
const ImageManagement = lazy(() => import("./components/ImageManagement"));
const BlogsManagement = lazy(() => import("./components/BlogsManagement"));
const BlogFormPage = lazy(() => import("./components/BlogFormPage"));
const BundleManagement = lazy(() => import("./components/BundleManagement"));
const BatchesManagement = lazy(() => import("./components/BatchesManagement"));
const GuestList = lazy(() => import("./components/GuestList"));
const BatchSettingsPage = lazy(() => import("./components/BatchSettingsPage"));
const LandingPagesPage = lazy(() => import("./components/LandingPagesPage"));

// Shown for screens that have no layout of their own to keep on screen
// (dashboard, blog editor) while they download.
const ScreenLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>
);

const HomePage: React.FC = () => {
  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Login />
    </div>
  );
};

// Login and the session check are excluded: they handle their own 401s.
const SELF_HANDLED_401 = ["/api/auth/login", "/api/admin/session"];

const AppContent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loader } = useSelector((state: RootState) => state.admin);

  useEffect(() => {
    dispatch(checkAdminAuth());
  }, [dispatch]);

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url: string = error?.config?.url ?? "";
        const selfHandled = SELF_HANDLED_401.some((path) => url.endsWith(path));
        const status = error?.response?.status;
        // The admin API answers 403 ("Access denied") when the session has
        // expired or the account is not an admin: same as 401, back to login.
        const sessionEnded = status === 401 || (status === 403 && url.includes("/api/admin/"));
        if (sessionEnded && !selfHandled) {
          dispatch(logout());
          navigate("/", { replace: true });
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(id);
  }, [dispatch, navigate]);

  return (
    <Suspense fallback={<ScreenLoading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/dashboard" element={
          <RequireAdmin>
            <Dashboard
              admin={user ?? undefined}
              loader={loader}
              dispatch={dispatch}
              navigate={navigate}
            />
          </RequireAdmin>
        } />
        <Route path="/admin/users" element={
          <RequireAdmin>
            <AdminLayout title="Users Management">
              <Users />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/emails" element={
          <RequireAdmin>
            <AdminLayout title="Email Templates">
              <EmailTemplate />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/masterclasses" element={
          <RequireAdmin>
            <AdminLayout title="MasterClasses">
              <MasterclassManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/categories" element={
          <RequireAdmin>
            <AdminLayout title="Categories">
              <CategoryManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/coupons" element={
          <RequireAdmin>
            <AdminLayout title="Coupons">
              <CouponsManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/bundles" element={
          <RequireAdmin>
            <AdminLayout title="Bundles">
              <BundleManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/images" element={
          <RequireAdmin>
            <AdminLayout title="Images">
              <ImageManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/blogs" element={
          <RequireAdmin>
            <AdminLayout title="Blogs Management">
              <BlogsManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/batches" element={
          <RequireAdmin>
            <AdminLayout title="Batches">
              <BatchesManagement />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/batches/:id/guests" element={
          <RequireAdmin>
            <AdminLayout title="Guest list">
              <GuestList />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/batch-settings" element={
          <RequireAdmin>
            <AdminLayout title="Batch settings">
              <BatchSettingsPage />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/landing-pages" element={
          <RequireAdmin>
            <AdminLayout title="Landing pages">
              <LandingPagesPage />
            </AdminLayout>
          </RequireAdmin>
        } />
        <Route path="/admin/blogs/new" element={<RequireAdmin><BlogFormPage /></RequireAdmin>} />
        <Route path="/admin/blogs/edit/:id" element={<RequireAdmin><BlogFormPage /></RequireAdmin>} />
        <Route path="/admin/orders/:id" element={
          <RequireAdmin>
            <AdminLayout title="Order Details">
              <OrderDetails />
            </AdminLayout>
          </RequireAdmin>
        } />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <AppContent />
        <Toaster />
      </Router>
    </Provider>
  );
};

export default App;
