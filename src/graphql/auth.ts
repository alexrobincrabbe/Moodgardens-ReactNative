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
      timezone
      dayRolloverHour
      notifyWeeklyGarden
      notifyMonthlyGarden
      notifyYearlyGarden
    }
  }
`;
