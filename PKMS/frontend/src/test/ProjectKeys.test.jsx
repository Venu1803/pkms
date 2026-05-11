import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ProjectKeys from "../pages/ProjectKeys";
import api from "../utils/api";
import { MemoryRouter } from "react-router-dom";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ projectId: "123" }),
  };
});

vi.mock("../utils/api");

describe("ProjectKeys Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const setupApi = () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/projects/")) {
        return Promise.resolve({ data: { name: "Test Project" } });
      }
      if (url.includes("/environments")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/keyTypes")) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes("/keys")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error("Unknown URL: " + url));
    });
  };

  it("should redirect to login if no user", async () => {
    setupApi();

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should display project name", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));

    setupApi();

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Test Project", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("should show select environment message", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));

    setupApi();

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Select an Environment"),
    ).toBeInTheDocument();
  });

  it("should open Add Key modal", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));

    setupApi();

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    const btn = await screen.findByText("Add New Key");

    await userEvent.click(btn);

    expect(await screen.findByText("Create New Key")).toBeInTheDocument();
  });

  it("should update search input", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));

    setupApi();

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    const input = await screen.findByPlaceholderText("Search keys...");

    await userEvent.type(input, "API_KEY");

    expect(input).toHaveValue("API_KEY");
  });

  it("should create environment", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));

    api.get.mockImplementation((url) => {
      if (url.includes("/projects/"))
        return Promise.resolve({ data: { name: "Test Project" } });
      if (url.includes("/environments")) return Promise.resolve({ data: [] });
      if (url.includes("/keyTypes")) return Promise.resolve({ data: [] });
      if (url.includes("/keys")) return Promise.resolve({ data: [] });
      return Promise.reject(new Error("Unknown URL: " + url));
    });

    api.post.mockResolvedValueOnce({
      data: { _id: "env1", name: "Dev" },
    });

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    const select = await screen.findByRole("combobox");
    await userEvent.selectOptions(select, "add_new");

    const input = await screen.findByPlaceholderText("Env name");

    await userEvent.type(input, "Dev");

    await userEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/environments",
        expect.any(Object),
      );
    });
  });

  it("should delete a key", async () => {
    localStorage.setItem("user", JSON.stringify({ id: "1", role: "admin" }));

    vi.spyOn(window, "confirm").mockReturnValue(true);

    api.get.mockImplementation((url) => {
      if (url.includes("/projects/"))
        return Promise.resolve({ data: { name: "Test Project" } });
      if (url.includes("/environments"))
        return Promise.resolve({ data: [{ _id: "env1", name: "Dev" }] });
      if (url.includes("/keyTypes")) return Promise.resolve({ data: [] });
      if (url.includes("/keys")) {
        return Promise.resolve({
          data: [
            {
              _id: "1",
              name: "API_KEY",
              key: "123",
              keyType: "auth",
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });

    api.delete.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <ProjectKeys />
      </MemoryRouter>,
    );

    // Wait for environments to load
    await screen.findByText("Dev");

    const select = await screen.findByRole("combobox");
    await userEvent.selectOptions(select, "env1");

    const deleteBtn = await screen.findByTitle("Delete");

    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/keys/1");
    });
  });
});
