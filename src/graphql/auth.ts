// src/graphql/auth.ts
import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        displayName
      }
    }
  }
`;

export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    user {
      id
      email
      displayName
      isPremium
      premiumSince
      regenerateTokens   # 👈 new
      createdAt
    }
  }
`;



export interface CurrentUserData {
  user: User
}

export type User= {
    id: string;
    email: string;
    displayName: string | null;
    isPremium?: boolean | null;
    premiumSince?: string | null;
    createdAt?: string | null;
    regenerateTokens?: number | null; // 👈 new
  } | null;
