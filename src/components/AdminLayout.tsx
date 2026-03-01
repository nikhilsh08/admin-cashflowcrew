import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { DesktopSidebar, MobileSidebar, SidebarProvider, useSidebar } from './AdminSidebar';
import type { RootState } from '@/_authContext/store';
import { logout } from '@/_authContext/slice';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    actions?: React.ReactNode;
}

const AdminLayoutContent: React.FC<AdminLayoutProps> = ({ children, title, actions }) => {
    const { collapsed } = useSidebar();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.admin);

    const handleLogout = () => {
        localStorage.removeItem('authjs.csrf-token');
        dispatch(logout());
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <DesktopSidebar
                user={user ?? undefined}
                onLogout={handleLogout}
                onNavigate={navigate}
            />

            <div className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                {/* Mobile-optimized header */}
                <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b bg-background px-3 sm:px-4 md:px-6 shadow-sm">
                    <MobileSidebar
                        user={user ?? undefined}
                        onLogout={handleLogout}
                        onNavigate={navigate}
                    />
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                        <h1 className="text-base sm:text-lg md:text-2xl font-semibold text-foreground truncate">
                            {title || 'Admin Panel'}
                        </h1>
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>
                </header>

                <main className="flex-1 space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

const AdminLayout: React.FC<AdminLayoutProps> = (props) => {
    return (
        <SidebarProvider>
            <AdminLayoutContent {...props} />
        </SidebarProvider>
    );
};

export default AdminLayout;
