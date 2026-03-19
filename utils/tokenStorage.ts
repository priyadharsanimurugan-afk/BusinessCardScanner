import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const ROLES = "roles";

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
