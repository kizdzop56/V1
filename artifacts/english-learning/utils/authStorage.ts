import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// On web: sessionStorage is per-tab, so two different users in two browser
// tabs no longer share the same auth token and won't overwrite each other.
// On native (iOS / Android): AsyncStorage is persistent across app restarts.
const authStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

export default authStorage;
