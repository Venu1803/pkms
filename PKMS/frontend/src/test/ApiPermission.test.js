import { describe, it, expect, vi, beforeEach } from "vitest";
import api from "../utils/api";
import {
  createKey,
  getKey,
  getKeys,
  updateKey,
  deleteKey,
  createEnvironment,
  createModule,
} from "../utils/api";

vi.mock("../utils/api", () => {
  const mockApi = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: mockApi,
    createKey: vi.fn(async (user, data) => {
      if (user.role === "tester") throw new Error("Unauthorized");
      const res = await mockApi.post("/keys", data);
      return res.data;
    }),
    getKeys: vi.fn(async (user, params) => {
      const res = await mockApi.get("/keys", { params });
      return res.data;
    }),
    updateKey: vi.fn(async (user, id, data) => {
      if (user.role === "tester") throw new Error("Unauthorized");
      const res = await mockApi.put(`/keys/${id}`, data);
      return res.data;
    }),
    deleteKey: vi.fn(async (user, id) => {
      if (user.role !== "admin") throw new Error("Unauthorized");
      const res = await mockApi.delete(`/keys/${id}`);
      return res.data;
    }),
    createEnvironment: vi.fn(async (user, data) => {
      if (user.role !== "admin") throw new Error("Unauthorized");
      const res = await mockApi.post("/environments", data);
      return res.data;
    }),
  };
});

describe("Role Permission API Test", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const admin = { role: "admin" };
  const developer = { role: "developer" };
  const tester = { role: "tester" };

  it("admin can create key", async () => {
    api.post.mockResolvedValue({ data: "created" });

    const res = await createKey(admin, { name: "KEY" });

    expect(api.post).toHaveBeenCalledWith("/keys", { name: "KEY" });
    expect(res).toBe("created");
  });

  it("developer can create key", async () => {
    api.post.mockResolvedValue({ data: "created" });

    const res = await createKey(developer, { name: "KEY" });

    expect(api.post).toHaveBeenCalledWith("/keys", { name: "KEY" });
    expect(res).toBe("created");
  });

  it("tester cannot create key", async () => {
    await expect(createKey(tester, {})).rejects.toThrow("Unauthorized");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("all roles can read keys", async () => {
    api.get.mockResolvedValue({ data: ["key1"] });

    const res = await getKeys(tester, {});

    expect(api.get).toHaveBeenCalled();
    expect(res).toEqual(["key1"]);
  });

  it("developer can update key", async () => {
    api.put.mockResolvedValue({ data: "updated" });

    const res = await updateKey(developer, "1", { name: "NEW" });

    expect(api.put).toHaveBeenCalledWith("/keys/1", { name: "NEW" });
    expect(res).toBe("updated");
  });

  it("tester cannot update key", async () => {
    await expect(updateKey(tester, "1", {})).rejects.toThrow("Unauthorized");
  });
  it("admin can delete key", async () => {
    api.delete.mockResolvedValue({ data: "deleted" });

    const res = await deleteKey(admin, "1");

    expect(api.delete).toHaveBeenCalledWith("/keys/1");
    expect(res).toBe("deleted");
  });

  it("developer cannot delete key", async () => {
    await expect(deleteKey(developer, "1")).rejects.toThrow("Unauthorized");
  });

  it("admin can create environment", async () => {
    api.post.mockResolvedValue({ data: "env created" });

    const res = await createEnvironment(admin, { name: "dev" });

    expect(api.post).toHaveBeenCalledWith("/environments", { name: "dev" });
    expect(res).toBe("env created");
  });

  it("developer cannot create environment", async () => {
    await expect(createEnvironment(developer, {})).rejects.toThrow(
      "Unauthorized",
    );
  });
});
