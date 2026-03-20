import { Platform } from "react-native";
import { deleteTokens } from "./tokenStorage";
import { router } from "expo-router";

let logoutHandler: (() => void) | null = null;
let isLoggingOut = false;

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

export const getIsLoggingOut = () => isLoggingOut;

export const triggerLogout = async () => {
  isLoggingOut = true;

  await deleteTokens();

  if (logoutHandler) {
    await logoutHandler();
  } else {
    if (Platform.OS === "web") {
      window.location.href = "/login";
    } else {
      router.replace("/login");
    }
  }
};
