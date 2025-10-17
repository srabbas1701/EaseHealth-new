import React from 'react';
import { Navigate } from 'react-router-dom';

interface RoleBasedRouteProps {
    children: React.ReactNode;
    allowedRoles: ('patient' | 'doctor' | 'admin')[];
    userRole: 'patient' | 'doctor' | 'admin' | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
    children,
    allowedRoles,
    userRole,
    isAuthenticated,
    isLoading
}) => {
    // Show loading state while authentication/role is being determined
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075A2] mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to home if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Redirect to home if user role is not in allowed roles
    if (!userRole || !allowedRoles.includes(userRole)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        You don't have permission to access this page.
                    </p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-[#0075A2] hover:bg-[#0A2647] text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    // User has the required role, render the protected content
    return <>{children}</>;
};

export default RoleBasedRoute;

