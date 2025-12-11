// app.config.ts
import "dotenv/config";

export default {
  expo: {
    name: "Mood Gardens",
    slug: "mood-gardens-mobile",
    scheme: "moodgardens", // optional but nice for deep links
    "plugins": [
    "expo-font"
  ],
    ios: {
      bundleIdentifier: "com.alex.moodgardens",
    },
    android: {
    package: "com.alex.moodgardens",
    },
    updates: {
      url: "https://u.expo.dev/6e7870bb-0683-47e5-93c8-98029a31e417",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    extra: {
        eas: {
        projectId: "6e7870bb-0683-47e5-93c8-98029a31e417",
      },
    },
  },
};
