import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ClerkProvider } from '@clerk/clerk-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { ChatPage } from '@/pages/ChatPage';
import { Layout } from '@/components/Layout';
import { ExplorePage } from '@/pages/ExplorePage';
import { ForgePage } from '@/pages/ForgePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SignInPage } from "./pages/SignInPage";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/explore",
        element: <ExplorePage />,
      },
      {
        path: "/signin",
        element: <SignInPage />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "/chat/:sessionId",
            element: <ChatPage />,
          },
          {
            path: "/forge",
            element: <ForgePage />,
          },
          {
            path: "/settings",
            element: <SettingsPage />,
          },
        ]
      }
    ]
  },
]);
const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </ClerkProvider>
  </StrictMode>
);