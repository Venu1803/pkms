import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import UserManagement from "../pages/UserManagement";
import api from "../utils/api";

vi.mock("../utils/api");

describe("UserManagement Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupApi = () => {
    api.get
      .mockResolvedValueOnce({
        data: [
          {
            _id: "1",
            name: "Venu",
            email: "venu@test.com",
            role: "admin",
            status: "active",
          },
        ],
      }) // /users
      .mockResolvedValueOnce({
        data: [
          {
            name: "admin",
            permissions: ["viewKeys", "editKeys"],
          },
        ],
      }); // /roles
  };

  it("should fetch and display users", async () => {
    setupApi();

    render(<UserManagement />);

    expect(await screen.findByText("Venu")).toBeInTheDocument();
    expect(await screen.findByText("venu@test.com")).toBeInTheDocument();
  });

  it("should filter users by search", async () => {
    setupApi();

    render(<UserManagement />);

    const searchInput = await screen.findByPlaceholderText("Search users...");

    await userEvent.type(searchInput, "venu");

    expect(await screen.findByText("Venu")).toBeInTheDocument();
  });

  it("should open add user modal", async () => {
    setupApi();

    render(<UserManagement />);

    const addBtn = await screen.findByText("Add User");

    await userEvent.click(addBtn);

    const addUserElements = await screen.findAllByText("Add User");
    expect(addUserElements.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByPlaceholderText("Enter full name")).toBeInTheDocument();
  });

  it("should show validation error if required fields missing", async () => {
    setupApi();

    render(<UserManagement />);

    const addBtn = await screen.findByText("Add User");
    await userEvent.click(addBtn);

    const submitBtns = screen.getAllByText("Add User");
    await userEvent.click(submitBtns[submitBtns.length - 1]);

    expect(
      await screen.findByText("Name and email are required."),
    ).toBeInTheDocument();
  });

  it("should create a new user", async () => {
    setupApi();

    api.post.mockResolvedValueOnce({
      data: {
        _id: "2",
        name: "Aravind",
        email: "aravind@test.com",
        role: "admin",
        status: "active",
      },
    });

    render(<UserManagement />);

    const addBtn = await screen.findByText("Add User");
    await userEvent.click(addBtn);

    await userEvent.type(
      screen.getByPlaceholderText("Enter full name"),
      "Aravind",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Enter email address"),
      "aravind@test.com",
    );

    await userEvent.type(screen.getByPlaceholderText("e.g. 001"), "002");

    await userEvent.type(
      screen.getByPlaceholderText("e.g. Developer"),
      "Developer",
    );

    await userEvent.type(
      screen.getByPlaceholderText("Create a password"),
      "Password@123",
    );

    const submitBtns = screen.getAllByText("Add User");
    await userEvent.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/users", expect.any(Object));
    });

    expect(await screen.findByText("Aravind")).toBeInTheDocument();
  });

  it("should delete a user", async () => {
    setupApi();

    vi.spyOn(window, "confirm").mockReturnValue(true);

    api.delete.mockResolvedValueOnce({});

    render(<UserManagement />);

    const deleteBtn = await screen.findByTitle("Delete");

    await userEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/users/1");
    });
  });

  it("should open user details modal", async () => {
    setupApi();

    render(<UserManagement />);

    const viewBtn = await screen.findByTitle("View");

    await userEvent.click(viewBtn);

    expect(await screen.findByText("User Details")).toBeInTheDocument();
    const venuElements = screen.getAllByText("Venu");
    expect(venuElements.length).toBeGreaterThanOrEqual(1);
  });
});
