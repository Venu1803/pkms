import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Login from "../pages/Login.jsx";
import api from "../utils/api";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../utils/api", () => ({
  default: { post: vi.fn() },
}));

global.alert = vi.fn();

const renderLogin = () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>,
  );
};

describe("Login", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders form", () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it.each([
    ["no uppercase", "test@12"],
    ["no lowercase", "TEST@123"],
    ["no number", "Test@Test"],
    ["no special char", "Test1234"],
    ["too short", "T@1a"],
  ])("shows error for invalid password: %s", (_, password) => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: password },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /login/i }).closest("form"),
    );

    expect(api.post).not.toHaveBeenCalled();

    expect(global.alert).toHaveBeenCalledWith(
      "Password must include uppercase, lowercase, number, special character and be at least 6 characters",
    );
  });

  it("accepts strong password and logs in", async () => {
    api.post.mockResolvedValueOnce({
      data: { token: "token123", user: { name: "Test" } },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Test@123" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /login/i }).closest("form"),
    );

    await waitFor(() => expect(api.post).toHaveBeenCalled());

    expect(localStorage.getItem("token")).toBe("token123");
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error on invalid credentials", async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } },
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "wrong@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "Test@123" },
    });

    fireEvent.submit(
      screen.getByRole("button", { name: /login/i }).closest("form"),
    );

    await waitFor(() => expect(api.post).toHaveBeenCalled());

    expect(global.alert).toHaveBeenCalledWith("Invalid credentials");
  });
});
