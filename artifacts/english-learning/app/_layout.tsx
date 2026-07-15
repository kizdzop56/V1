import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { setBaseUrl } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, StyleSheet } from "react-native";
import { useFonts } from "expo-font";

if (Platform.OS === "web" && typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = "input, textarea { outline: none !important; }";
  document.head.appendChild(style);

  // Disable iOS Safari's automatic data detectors (phone numbers, addresses,
  // dates, emails) that turn plain UI text/numbers into tap-to-open links
  // (e.g. Apple/Google Maps, Calendar). The +html.tsx meta tag only applies
  // to static exports, not the Expo dev server, so it must also be injected
  // here at runtime to take effect during development.
  if (!document.querySelector('meta[name="format-detection"]')) {
    const meta = document.createElement("meta");
    meta.name = "format-detection";
    meta.content = "telephone=no, address=no, email=no, date=no, url=no";
    document.head.appendChild(meta);
  }

  // Ensure Feather icon font is available via CSS (fallback for mobile browsers)
  try {
    const featherUrl = require("../assets/fonts/Feather.ttf");
    const iconStyle = document.createElement("style");
    iconStyle.textContent = `@font-face { font-family: 'Feather'; src: url('${featherUrl}') format('truetype'); font-display: block; }`;
    document.head.appendChild(iconStyle);
  } catch (_) {}
}

SplashScreen.preventAutoHideAsync();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const domain = process.env["EXPO_PUBLIC_DOMAIN"];
setBaseUrl(domain ? `https://${domain}` : null);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Feather: require("../assets/fonts/Feather.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // On web, fonts are injected via CSS @font-face above and must not block rendering.
  // On native, wait for font to load (or error) before continuing.
  if (Platform.OS !== "web" && !fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Gradient covers the entire app — all screens are transparent */}
      <LinearGradient
        colors={["#F8F5FF", "#E8DFFF", "#D0C2FF"]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
                animation: "fade",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(main)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
