// src/lib/apollo.ts
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as SecureStore from "expo-secure-store";

// TODO: replace with your real API URL
// e.g. "https://api.mymoodgardens.com/graphql"
const GRAPHQL_URL = "https://api.mymoodgardens.com/graphql";

const httpLink = createHttpLink({
  uri: GRAPHQL_URL,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await SecureStore.getItemAsync("mg_token");
  return {
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
