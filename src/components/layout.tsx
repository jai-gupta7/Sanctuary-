import { NavLink, Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../lib/auth";
import { Badge, Button, ButtonLink, InlineNotice } from "./ui";

function NavigationLink({ to, children }: { to: string; children: string }) {
  return (
    <NavLink className={({ isActive }) => `app-nav-link${isActive ? " app-nav-link-active" : ""}`} to={to}>
      {children}
    </NavLink>
  );
}

export function PublicLayout() {
  return <Outlet />;
}

export function AppLayout() {
  const { currentUser, logout, isAdmin } = useAuth();

  return (
    <div className="product-shell">
      <header className="product-header">
        <div className="product-header-left">
          <NavLink className="brand" to="/">
            <span className="brand-badge">S</span>
            <span className="brand-text">
              <strong>Shared Living OS</strong>
              <small>MVP 1</small>
            </span>
          </NavLink>
          <nav className="app-nav desktop-app-nav">
            <NavigationLink to="/dashboard">Dashboard</NavigationLink>
            <NavigationLink to="/explore">Explore</NavigationLink>
            <NavigationLink to="/my-listings">My Listings</NavigationLink>
            <NavigationLink to="/applications">Applications</NavigationLink>
            <NavigationLink to="/conversations">Chat</NavigationLink>
            <NavigationLink to="/notifications">Notifications</NavigationLink>
          </nav>
        </div>

        <div className="product-header-right">
          {currentUser?.verification?.status === "verified" ? <Badge tone="success">Verified</Badge> : null}
          <ButtonLink to="/profile" tone="secondary">
            {currentUser?.profile?.fullName || "Profile"}
          </ButtonLink>
          {isAdmin ? (
            <ButtonLink to="/admin/verifications" tone="secondary">
              Admin
            </ButtonLink>
          ) : null}
          <Button
            tone="tertiary"
            onClick={() => {
              void logout();
            }}
            type="button"
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="product-main">
        {currentUser && !currentUser.eligibility.eligible ? (
          <InlineNotice tone="warning">
            Your profile is not interaction-ready yet. Add your essentials and a profile photo on the profile page before
            publishing, applying, or starting chats.
          </InlineNotice>
        ) : null}
        <Outlet />
      </main>

      <nav className="mobile-app-nav">
        <NavigationLink to="/dashboard">Home</NavigationLink>
        <NavigationLink to="/explore">Explore</NavigationLink>
        <NavigationLink to="/my-listings">Listings</NavigationLink>
        <NavigationLink to="/conversations">Chat</NavigationLink>
        <NavigationLink to="/profile">Profile</NavigationLink>
      </nav>
    </div>
  );
}

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="route-state">Loading your account...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/auth/login" />;
  }

  return <Outlet />;
}

export function RequireAdmin() {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return <div className="route-state">Loading admin access...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/auth/login" />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}
