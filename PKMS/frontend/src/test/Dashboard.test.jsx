import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import api from "../utils/api";
import { vi } from "vitest";
import { User } from "lucide-react";

vi.mock("../utils/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("redirects to login if no user", async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  test("renders projects after API call", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Venu", role: "admin" }),
    );

    api.get.mockResolvedValueOnce({
      data: [
        { _id: "1", name: "Project A", status: "active" },
        { _id: "2", name: "Project B", status: "inactive" },
      ],
    });
    api.get.mockResolvedValueOnce({ data: [] }); // /audit/recent
    api.get.mockResolvedValueOnce({ data: [] }); // /users

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Project A")).toBeInTheDocument();
      expect(screen.getByText("Project B")).toBeInTheDocument();
    });
  });

  test("logs out user and redirects to login", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Venu", role: "admin" }),
    );

    api.get.mockResolvedValueOnce({ data: [] }); // /projects
    api.get.mockResolvedValueOnce({ data: [] }); // /audit/recent
    api.get.mockResolvedValueOnce({ data: [] }); // /users

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const logoutButton = await screen.findByRole("button", { name: /logout/i });

    fireEvent.click(logoutButton);

    expect(localStorage.getItem("user")).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  test("deletes projects", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({ name: "Venu", role: "admin" }),
    );

    window.confirm = vi.fn(() => true);

    api.get.mockResolvedValueOnce({
      data: [
        { _id: "1", name: "Project A", status: "active" },
        { _id: "2", name: "Project B", status: "inactive" },
      ],
    });
    api.get.mockResolvedValueOnce({ data: [] }); // /audit/recent
    api.get.mockResolvedValueOnce({ data: [] }); // /users
    api.delete.mockResolvedValueOnce({ data: {} });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );
    const project = await screen.findByText("Project A");

    expect(project).toBeInTheDocument();

    const projectRow = project.closest("tr");
    const deleteButton = projectRow.querySelector('button[title="Delete"]');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/projects/1");
    });
  });
});
