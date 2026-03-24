// utils/storage.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const ROLES = "roles";
const REMEMBERED_EMAIL = "rememberedEmail";
const REMEMBERED_PASSWORD = "rememberedPassword";

export const saveTokens = async (
  accessToken: string,
  refreshToken: string,
  roles: string[]
) => {
  const rolesString = JSON.stringify(roles);

  if (Platform.OS === "web") {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    localStorage.setItem(ROLES, rolesString);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(ROLES, rolesString);
  }
};

export const getAccessToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem(ACCESS_TOKEN);
  } else {
    return await SecureStore.getItemAsync(ACCESS_TOKEN);
  }
};

export const getRefreshToken = async () => {
  if (Platform.OS === "web") {
    return localStorage.getItem(REFRESH_TOKEN);
  } else {
    return await SecureStore.getItemAsync(REFRESH_TOKEN);
  }
};

export const getRoles = async () => {
  if (Platform.OS === "web") {
    const roles = localStorage.getItem(ROLES);
    return roles ? JSON.parse(roles) : null;
  } else {
    const roles = await SecureStore.getItemAsync(ROLES);
    return roles ? JSON.parse(roles) : null;
  }
};

export const deleteTokens = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(ROLES);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(ROLES);
  }
};

// Remember Me functions
export const saveRememberedCredentials = async (email: string, password: string) => {
  if (Platform.OS === "web") {
    localStorage.setItem(REMEMBERED_EMAIL, email);
    localStorage.setItem(REMEMBERED_PASSWORD, password);
  } else {
    await SecureStore.setItemAsync(REMEMBERED_EMAIL, email);
    await SecureStore.setItemAsync(REMEMBERED_PASSWORD, password);
  }
};

export const getRememberedCredentials = async () => {
  if (Platform.OS === "web") {
    const email = localStorage.getItem(REMEMBERED_EMAIL);
    const password = localStorage.getItem(REMEMBERED_PASSWORD);
    return { email: email || "", password: password || "" };
  } else {
    const email = await SecureStore.getItemAsync(REMEMBERED_EMAIL);
    const password = await SecureStore.getItemAsync(REMEMBERED_PASSWORD);
    return { email: email || "", password: password || "" };
  }
};

export const clearRememberedCredentials = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(REMEMBERED_EMAIL);
    localStorage.removeItem(REMEMBERED_PASSWORD);
  } else {
    await SecureStore.deleteItemAsync(REMEMBERED_EMAIL);
    await SecureStore.deleteItemAsync(REMEMBERED_PASSWORD);
  }
};