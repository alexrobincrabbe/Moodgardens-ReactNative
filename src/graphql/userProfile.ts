// src/graphql/user.ts
import { gql } from "@apollo/client";

export const UpdateUserSettings = gql`
  mutation UpdateUserSettings($timezone: String!, $dayRolloverHour: Int!) {
    updateUserSettings(timezone: $timezone, dayRolloverHour: $dayRolloverHour) {
      id
      timezone
      dayRolloverHour
    }
  }
`;

export const UpdateUserProfile = gql`
  mutation UpdateUserProfile($displayName: String!, $email: String!) {
    updateUserProfile(displayName: $displayName, email: $email) {
      id
      displayName
      email
    }
  }
`;

export const ChangePassword = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;
