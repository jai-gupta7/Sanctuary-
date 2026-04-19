import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout, PublicLayout, RequireAdmin, RequireAuth } from "./components/layout";
import { AuthProvider } from "./lib/auth";
import { ToastProvider } from "./lib/toast";
import {
  AdminListingsPage,
  AdminUsersPage,
  AdminVerificationsPage,
  ApplicationsPage,
  ConversationDetailPage,
  ConversationsPage,
  DashboardPage,
  ListingEditorPage,
  MyListingsPage,
  NotificationsPage,
  ProfilePage,
  VerificationPage
} from "./pages/app-pages";
import { LoginPage, VerifyPage } from "./pages/auth-pages";
import { ExplorePage, HomePage, ListingDetailPage } from "./pages/public-pages";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/listings/:id" element={<ListingDetailPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/verify" element={<VerifyPage />} />
              </Route>

              <Route element={<RequireAuth />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/verification" element={<VerificationPage />} />
                  <Route path="/my-listings" element={<MyListingsPage />} />
                  <Route path="/listings/new" element={<ListingEditorPage />} />
                  <Route path="/listings/:id/edit" element={<ListingEditorPage />} />
                  <Route path="/applications" element={<ApplicationsPage />} />
                  <Route path="/conversations" element={<ConversationsPage />} />
                  <Route path="/conversations/:id" element={<ConversationDetailPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                </Route>
              </Route>

              <Route element={<RequireAdmin />}>
                <Route element={<AppLayout />}>
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/listings" element={<AdminListingsPage />} />
                  <Route path="/admin/verifications" element={<AdminVerificationsPage />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
