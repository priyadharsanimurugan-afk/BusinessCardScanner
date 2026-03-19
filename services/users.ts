import { AllUser } from "@/types/users";
import api from "./api";

// Get all users
export const getAllUsers = async (): Promise<AllUser[]> => {
  const res = await api.get("/admin/users");
  return res.data;
};

// Upgrade user to Premium
export const upgradeUser = async (userId: string) => {
  const res = await api.post(`/admin/upgrade/${userId}`);
  return res.data;
};

// Downgrade user to Free
export const downgradeUser = async (userId: string) => {
  const res = await api.post(`/admin/downgrade/${userId}`);
  return res.data;
};
