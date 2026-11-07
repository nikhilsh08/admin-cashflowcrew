// App.tsx
import React, { useEffect } from "react";
import { Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import { Provider, useDispatch } from 'react-redux';
import axios from "axios";
import Login from "./components/Login";
import { store } from './_authContext/store';
import type { AppDispatch, RootState } from './_authContext/store';
import { checkAdminAuth, logout } from './_authContext/slice';
import { useSelector } from "react-redux";
import Users from "./components/Users";
import MasterclassManagement from "./components/MasterClassManagement";
import { Toaster } from "sonner";
import CouponsManagement from "./components/CouponsManagement";
import CategoryManagement from "./components/CategoryManagement";
import Dashboard from "./components/Dashboard/Dashboard";
import EmailTemplate from "./components/EmailTemplate";
import OrderDetails from "./components/OrderDetails";
import ImageManagement from "./components/ImageManagement";
import BlogsManagement from "./components/BlogsManagement";
import BlogFormPage from "./components/BlogFormPage";
import BundleManagement from "./components/BundleManagement";
import RequireAdmin from "./components/RequireAdmin";

import AdminLayout from "./components/AdminLayout";

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
        if (error?.response?.status === 401 && !selfHandled) {
          dispatch(logout());
          navigate("/", { replace: true });
        }
        return Promise.reject(error);
      },
    );
    return () => axios.interceptors.response.eject(id);
  }, [dispatch, navigate]);

  return (
    <>
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
    </>
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
