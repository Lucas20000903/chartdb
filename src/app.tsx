import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { TooltipProvider } from './components/tooltip/tooltip';
import { HelmetData } from './helmet/helmet-data';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/context/auth-context/auth-provider';

export const App = () => {
    return (
        <HelmetProvider>
            <AuthProvider>
                <HelmetData />
                <TooltipProvider>
                    <RouterProvider router={router} />
                </TooltipProvider>
            </AuthProvider>
        </HelmetProvider>
    );
};
