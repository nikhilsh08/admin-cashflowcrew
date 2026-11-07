import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  checkAdminAuth,
  loginAdmin,
  loginFailure,
  loginStart,
  loginSuccess,
} from "../_authContext/slice";

vi.mock("axios");

const sessionUser = {
  id: "u1",
  email: "admin@cashflowcrew.in",
  name: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  role: "admin",
  isAdmin: true,
};

describe("checkAdminAuth (M1)", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    dispatch.mockReset();
    vi.mocked(axios.get).mockReset();
  });

  it("restores the session from GET /api/admin/session using the cookie", async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: { user: sessionUser } });

    await checkAdminAuth()(dispatch);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/admin\/session$/),
      expect.objectContaining({ withCredentials: true }),
    );
    expect(dispatch).toHaveBeenNthCalledWith(1, loginStart());
    expect(dispatch).toHaveBeenNthCalledWith(
      2,
      loginSuccess(expect.objectContaining({ id: "u1", email: sessionUser.email, isAdmin: true })),
    );
  });

  it("fails quietly on 401 without touching cookies", async () => {
    vi.mocked(axios.get).mockRejectedValue({ response: { status: 401 } });

    await checkAdminAuth()(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith(loginFailure(""));
  });
});

describe("loginAdmin", () => {
  const dispatch = vi.fn();

  beforeEach(() => {
    dispatch.mockReset();
    vi.mocked(axios.get).mockReset();
    vi.mocked(axios.post).mockReset();
  });

  it("rejects a valid login that is not an admin", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    vi.mocked(axios.get).mockRejectedValue({
      response: { status: 401 },
      config: { url: "http://x/api/admin/session" },
    });

    await loginAdmin({ email: "user@example.com", password: "pw" })(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith(
      loginFailure("This account does not have admin access."),
    );
  });

  it("surfaces the login endpoint's error on bad credentials", async () => {
    vi.mocked(axios.post).mockRejectedValue({
      response: { status: 401, data: { error: "Invalid credentials" } },
      config: { url: "http://x/api/auth/login" },
    });

    await loginAdmin({ email: "user@example.com", password: "pw" })(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith(loginFailure("Invalid credentials"));
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("logs in when the session endpoint confirms the admin role", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
    vi.mocked(axios.get).mockResolvedValue({ data: { user: sessionUser } });

    await loginAdmin({ email: sessionUser.email, password: "pw" })(dispatch);

    expect(dispatch).toHaveBeenLastCalledWith(
      loginSuccess(expect.objectContaining({ id: "u1", isAdmin: true })),
    );
  });
});
