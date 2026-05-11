import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor: handle 401 (unauthorized) responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const createKey = async (user, data) => {
  if (user.role === "tester") throw new Error("Unauthorized");
  const response = await api.post("/keys", data);
  return response.data;
};

export const getKeys = async (user, params) => {
  const response = await api.get("/keys", { params });
  return response.data;
};

export const getKey = async (user, id) => {
  const response = await api.get(`/keys/${id}`);
  return response.data;
};

export const updateKey = async (user, id, data) => {
  if (user.role === "tester") throw new Error("Unauthorized");
  const response = await api.put(`/keys/${id}`, data);
  return response.data;
};

export const deleteKey = async (user, id) => {
  if (user.role !== "admin") throw new Error("Unauthorized");
  const response = await api.delete(`/keys/${id}`);
  return response.data;
};

export const createEnvironment = async (user, data) => {
  if (user.role !== "admin") throw new Error("Unauthorized");
  const response = await api.post("/environments", data);
  return response.data;
};

export const createModule = async (user, data) => {
  if (user.role !== "admin") throw new Error("Unauthorized");
  const response = await api.post("/modules", data);
  return response.data;
};

export default api;
