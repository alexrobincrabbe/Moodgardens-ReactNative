import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./src/lib/apollo";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as ScreenOrientation from "expo-screen-orientation";
import * as Device from "expo-device";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";
import { Text } from "react-native";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { NewEntryScreen } from "./src/screens/NewEntryScreen";
import { EntryDetailScreen } from "./src/screens/EntryDetailScreen";
import { AccountScreen } from "./src/screens/AccountScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen"; // 👈 add this
import { GardensScreen } from "./src/screens/GardensScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  App: undefined; // tabs
};

export type TodayStackParamList = {
  TodayMain: undefined;
  NewEntry: undefined;
  EntryDetail: undefined;
};

SplashScreen.preventAutoHideAsync().catch(() => {});
// ------------------------------------------------------
// ^ keep splash visible until fonts + token are loaded
// -

const RootStack = createNativeStackNavigator<RootStackParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const GardenStack = createNativeStackNavigator<{ GardensMain: undefined }>();
const HistoryStack = createNativeStackNavigator<{ HistoryMain: undefined }>();
const AccountStack = createNativeStackNavigator<{ AccountMain: undefined }>();
const SettingsStack = createNativeStackNavigator<{ SettingsMain: undefined }>();

const Tab = createBottomTabNavigator();
const StackNavigatorScreenOptions = {
  headerStyle: {
    backgroundColor: "#B4CDC7",
  },
  headerTitle: (props: any) => (
    <Text style={styles.neonText}>{props.children}</Text>
  ),
  headerTintColor: "#ffffff",
};

function TodayStackNavigator() {
  return (
    <TodayStack.Navigator
      screenOptions={StackNavigatorScreenOptions}
    >
      <TodayStack.Screen
        name="TodayMain"
        component={TodayScreen}
        options={{ title: "Today" }}
      />
      <TodayStack.Screen
        name="NewEntry"
        component={NewEntryScreen}
        options={{ title: "New entry" }}
      />
      <TodayStack.Screen
        name="EntryDetail"
        component={EntryDetailScreen}
        options={{ title: "Entry" }}
      />
    </TodayStack.Navigator>
  );
}

function GardensStackNavigator() {
  return (
    <GardenStack.Navigator screenOptions={StackNavigatorScreenOptions}>
      <GardenStack.Screen
        name="GardensMain"
        component={GardensScreen}
        options={{ title: "Hindsight" }}
      />
    </GardenStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={StackNavigatorScreenOptions}>
      <HistoryStack.Screen
        name="HistoryMain"
        component={HistoryScreen}
        options={{ title: "Reflections" }}
      />
    </HistoryStack.Navigator>
  );
}

function AccountStackNavigator() {
  return (
    <AccountStack.Navigator screenOptions={StackNavigatorScreenOptions}>
      <AccountStack.Screen
        name="AccountMain"
        component={AccountScreen}
        options={{ title: "You" }}
      />
    </AccountStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={StackNavigatorScreenOptions}>
      <SettingsStack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: "Choices" }}
      />
    </SettingsStack.Navigator>
  );
}

function AppTabs() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        ZenLoop: require("./src/assets/fonts/ZenLoop-Regular.ttf"),
        PoiretOne: require("./src/assets/fonts/PoiretOne-Regular.ttf"),
        OoohBaby: require("./src/assets/fonts/OoohBaby-Regular.ttf"),
      });

      setFontsLoaded(true);
      SplashScreen.hideAsync();
    }

    loadFonts();
  }, []);

  if (!fontsLoaded) return null;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          paddingVertical: 15,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={["#B4CDC7", "#B4CDC7"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={{ flex: 1 }}
          />
        ),

        // 🔥 custom glowing label:
        tabBarLabel: ({ focused }) => {
          let label = "";

          if (route.name === "TodayTab") label = "Today";
          else if (route.name === "Gardens") label = "Hindsight";
          else if (route.name === "History") label = "Reflections";
          else if (route.name === "Account") label = "You";
          else if (route.name === "Settings") label = "Choices";

          return (
            <Text
              style={[
                styles.tabLabel,
                focused && styles.tabLabelFocused, // add glow when focused
              ]}
            >
              {label}
            </Text>
          );
        },

        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === "Account") {
            return (
              <Image
                source={require("./assets/neon_acc.png")}
                style={{
                  width: size + 6,
                  height: size + 6,
                  opacity: focused ? 1 : 0.6,
                }}
                resizeMode="contain"
              />
            );
          }

          if (route.name === "TodayTab") {
            return (
              <Image
                source={require("./assets/neon_lea.png")}
                style={{
                  width: size + 6,
                  height: size + 6,
                  opacity: focused ? 1 : 0.6,
                }}
                resizeMode="contain"
              />
            );
          } else if (route.name === "Settings") {
            return (
              <Image
                source={require("./assets/neon_set.png")}
                style={{
                  width: size + 6,
                  height: size + 6,
                  opacity: focused ? 1 : 0.6,
                }}
                resizeMode="contain"
              />
            );
          } else if (route.name === "Gardens") {
            return (
              <Image
                source={require("./assets/neon_cal.png")}
                style={{
                  width: size + 6,
                  height: size + 6,
                  opacity: focused ? 1 : 0.6,
                }}
                resizeMode="contain"
              />
            );
          } else if (route.name === "History") {
            return (
              <Image
                source={require("./assets/neon_boo.png")}
                style={{
                  width: size + 6,
                  height: size + 6,
                  opacity: focused ? 1 : 0.6,
                }}
                resizeMode="contain"
              />
            );
          }

          return null;
        },
      })}
    >
      <Tab.Screen name="TodayTab" component={TodayStackNavigator} />
      <Tab.Screen name="Gardens" component={GardensStackNavigator} />
      <Tab.Screen name="History" component={HistoryStackNavigator} />
      <Tab.Screen name="Account" component={AccountStackNavigator} />
      <Tab.Screen name="Settings" component={SettingsStackNavigator} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    async function lockOrientation() {
      if (Device.deviceType === Device.DeviceType.PHONE) {
        // Lock portrait only on phones
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } else {
        // Tablets (e.g., iPad) can rotate
        await ScreenOrientation.unlockAsync();
      }
    }

    lockOrientation();
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        // load fonts + token in parallel
        const [_, token] = await Promise.all([
          Font.loadAsync({
            ZenLoop: require("./src/assets/fonts/ZenLoop-Regular.ttf"),
            PoiretOne: require("./src/assets/fonts/PoiretOne-Regular.ttf"),
          }),
          SecureStore.getItemAsync("mg_token"),
        ]);

        setInitialRoute(token ? "App" : "Welcome");
        setFontsLoaded(true);
      } catch (e) {
        console.error("[bootstrap] error", e);
        setInitialRoute("Welcome");
        setFontsLoaded(true);
      } finally {
        SplashScreen.hideAsync().catch(() => {});
      }
    }

    bootstrap();
  }, []);

  if (!initialRoute || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <RootStack.Navigator
            initialRouteName={initialRoute}
            screenOptions={{
              headerStyle: {
                backgroundColor: "#B4CDC7", // same dark as the gradient edges
              },
              headerTitle: (props) => (
                <Text style={styles.neonText}>{props.children}</Text>
              ),
              headerTintColor: "#ffffff",
            }}
          >
            <RootStack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen
              name="App"
              component={AppTabs}
              options={{ headerShown: false }} // tabs manage their own stacks
            />
          </RootStack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}

const styles = StyleSheet.create({
  neonText: {
    fontSize: 24,
    color: "rgb(255, 255, 255)", // warm neon orange
    fontWeight: "800",

    // Soft glow
    textShadowColor: "rgba(255, 255, 255, 0.75)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tabLabel: {
    fontWeight: 700,
    color: "white", // warm orange text
    fontSize: 12,
    fontFamily: "PoiretOne",
  },

  tabLabelFocused: {
    fontWeight: 900,
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    color: "white", // brighter when active
  },
});
