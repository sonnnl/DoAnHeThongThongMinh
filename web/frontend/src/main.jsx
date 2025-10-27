/**
 * FILE: web/frontend/src/main.jsx
 * MỤC ĐÍCH: Entry point của React application
 * LIÊN QUAN:
 *   - web/frontend/src/App.jsx
 *   - web/frontend/src/index.css
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

// Google OAuth Client ID từ env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

// Create a react-query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#363636",
                color: "#fff",
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#36d399",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: "#f87272",
                  secondary: "#fff",
                },
              },
            }}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
