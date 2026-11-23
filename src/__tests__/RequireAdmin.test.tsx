import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { adminSlice } from "../_authContext/slice";
import RequireAdmin from "../components/RequireAdmin";

type AdminState = ReturnType<typeof adminSlice.reducer>;

function renderGuarded(admin: Partial<AdminState>) {
  const store = configureStore({
    reducer: { admin: adminSlice.reducer },
    preloadedState: {
      admin: {
        user: null,
        isAuthenticated: false,
        loader: false,
        error: null,
        authChecked: false,
        ...admin,
      },
    },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route path="/" element={<p>login page</p>} />
          <Route
            path="/admin/users"
            element={
              <RequireAdmin>
                <p>admin content</p>
              </RequireAdmin>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("RequireAdmin (M2)", () => {
  it("shows a holding state until the session check has run", () => {
    renderGuarded({ authChecked: false });
    expect(screen.getByText(/checking session/i)).toBeTruthy();
    expect(screen.queryByText("admin content")).toBeNull();
  });

  it("redirects to login when not authenticated", () => {
    renderGuarded({ authChecked: true, isAuthenticated: false });
    expect(screen.getByText("login page")).toBeTruthy();
    expect(screen.queryByText("admin content")).toBeNull();
  });

  it("renders the protected route when authenticated", () => {
    renderGuarded({
      authChecked: true,
      isAuthenticated: true,
      user: {
        id: "u1",
        email: "admin@cashflowcrew.in",
        name: "Ada",
        role: "admin",
        isAdmin: true,
        permissions: ["read"],
      },
    });
    expect(screen.getByText("admin content")).toBeTruthy();
  });
});
