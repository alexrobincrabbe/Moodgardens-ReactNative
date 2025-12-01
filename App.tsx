import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./src/lib/apollo";

import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { TodayScreen } from "./src/screens/TodayScreen";
import { NewEntryScreen } from "./src/screens/NewEntryScreen";
import { EntryDetailScreen } from "./src/screens/EntryDetailScreen";
import { AccountScreen } from "./src/screens/AccountScreen";

import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SettingsScreen } from "./src/screens/SettingsScreen"; // 👈 add this
import { GardensScreen } from "./src/screens/GardensScreen";

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

const RootStack = createNativeStackNavigator<RootStackParamList>();
const TodayStack = createNativeStackNavigator<TodayStackParamList>();
const Tab = createBottomTabNavigator();

function TodayStackNavigator() {
  return (
    <TodayStack.Navigator>
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

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#666",
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: any;
          
          if (route.name === "TodayTab") {
            iconName = focused ? "leaf" : "leaf-outline";
          } else if (route.name === "Account") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "settings" : "settings-outline";
          } else if (route.name === "Gardens") {
            iconName = focused ? "calendar" : "calendar-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="TodayTab"
        component={TodayStackNavigator}
        options={{ tabBarLabel: "Today" }}
      />
      <Tab.Screen
        name="Gardens"
        component={GardensScreen}
        options={{ tabBarLabel: "Gardens" }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarLabel: "Account" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: "Settings" }}
      />
      
      
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<
    keyof RootStackParamList | null
  >(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await SecureStore.getItemAsync("mg_token");
        setInitialRoute(token ? "App" : "Welcome");
      } catch (e) {
        console.error("[auth] Failed to read token", e);
        setInitialRoute("Welcome");
      }
    }
    bootstrap();
  }, []);

  if (!initialRoute) {
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
          <RootStack.Navigator initialRouteName={initialRoute}>
            <RootStack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ title: "Mood Gardens" }}
            />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Log in" }}
            />
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
