import { describe, expect, vi, it, beforeEach, afterEach } from "vitest";
import api, { loginUser } from "../utils/api";

describe("API Test", () => {
  let postSpy;

  beforeEach(() => {
    postSpy = vi.spyOn(api, "post");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call login API", async () => {
    postSpy.mockResolvedValue({
      data: { token: "1234567890" },
    });

    const result = await loginUser({
      email: "test@test.com",
      password: "Test@123",
    });

    expect(postSpy).toHaveBeenCalledWith("/auth/login", {
      email: "test@test.com",
      password: "Test@123",
    });

    expect(result).toEqual({ token: "1234567890" });
  });
});
