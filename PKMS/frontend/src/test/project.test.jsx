import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import Projects from "../pages/Projects";
import api from "../utils/api";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../utils/api");

describe("Projects Advanced Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    localStorage.setItem(
      "user",
      JSON.stringify({ id: "1", role: "admin", name: "Venu" }),
    );
  });

  const setupApiMocks = () => {
    api.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });
  };

  it("should add a new project", async () => {
    setupApiMocks();

    api.post.mockResolvedValueOnce({
      data: {
        _id: "123",
        name: "New Project",
        description: "Test Desc",
        status: "active",
      },
    });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );

    const addBtn = await screen.findByText("+ Add Project");
    await userEvent.click(addBtn);

    await userEvent.type(
      screen.getByPlaceholderText("Enter the project name"),
      "New Project",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Enter the project description"),
      "Test Desc",
    );

    await userEvent.click(screen.getByText("Add Project"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/projects", expect.any(Object));
    });

    expect(await screen.findByText("New Project")).toBeInTheDocument();
  });

  it("should delete a project", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);

    api.get
      .mockResolvedValueOnce({
        data: [{ _id: "1", name: "Project A", status: "active" }],
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    api.delete.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );

    const menuBtn = await screen.findByRole("button", { name: "" });
    await userEvent.click(menuBtn);

    const deleteBtn = await screen.findByText("Delete Project");
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/projects/1");
    });
  });

  it("should open edit form with project data", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: "1",
            name: "Project A",
            description: "Old Desc",
            status: "active",
          },
        ],
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );

    const menuBtn = await screen.findByRole("button", { name: "" });
    await userEvent.click(menuBtn);

    const editBtn = await screen.findByText("Edit Project");
    await userEvent.click(editBtn);

    expect(await screen.findByDisplayValue("Project A")).toBeInTheDocument();

    expect(await screen.findByDisplayValue("Old Desc")).toBeInTheDocument();
  });

  it("should navigate to project keys page", async () => {
    api.get
      .mockResolvedValueOnce({
        data: [{ _id: "1", name: "Project A", status: "active" }],
      })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>,
    );

    const menuBtn = await screen.findByRole("button", { name: "" });
    await userEvent.click(menuBtn);

    const viewBtn = await screen.findByText("View Keys");
    await userEvent.click(viewBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/projects/1/keys");
  });
});
