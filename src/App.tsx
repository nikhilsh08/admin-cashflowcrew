// App.tsx
import React, { useEffect } from "react";
import { Route, BrowserRouter as Router, Routes, useNavigate } from "react-router-dom";
import { Provider, useDispatch } from 'react-redux';
import Login from "./components/Login";
import { store } from './_authContext/store';
import type { AppDispatch, RootState } from './_authContext/store';
import { checkAdminAuth } from './_authContext/slice';
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

import AdminLayout from "./components/AdminLayout";

// ... existing imports

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Check if admin is already authenticated on app load
    dispatch(checkAdminAuth());
  }, [dispatch]);

  return (
    <div className="p-4 flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Login />
    </div>
  );
};

const AppContent: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loader } = useSelector((state: RootState) => state.admin);
  // Pass user directly as AdminUser | null
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/dashboard" element={
          <Dashboard
            admin={user ?? undefined}
            loader={loader}
            dispatch={dispatch}
            navigate={navigate}
          />
        } />
        <Route path="/admin/users" element={
          <AdminLayout title="Users Management">
            <Users />
          </AdminLayout>
        } />
        <Route path="/admin/emails" element={
          <AdminLayout title="Email Templates">
            <EmailTemplate />
          </AdminLayout>
        } />
        <Route path="/admin/masterclasses" element={
          <AdminLayout title="MasterClasses">
            <MasterclassManagement />
          </AdminLayout>
        } />
        <Route path="/admin/categories" element={
          <AdminLayout title="Categories">
            <CategoryManagement />
          </AdminLayout>
        } />
        <Route path="/admin/coupons" element={
          <AdminLayout title="Coupons">
            <CouponsManagement />
          </AdminLayout>
        } />
        <Route path="/admin/images" element={
          <AdminLayout title="Images">
            <ImageManagement />
          </AdminLayout>
        } />
        <Route path="/admin/blogs" element={
          <AdminLayout title="Blogs Management">
            <BlogsManagement />
          </AdminLayout>
        } />
        <Route path="/admin/blogs/new" element={<BlogFormPage />} />
        <Route path="/admin/blogs/edit/:id" element={<BlogFormPage />} />
        <Route path="/admin/orders/:id" element={
          <AdminLayout title="Order Details">
            <OrderDetails />
          </AdminLayout>
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