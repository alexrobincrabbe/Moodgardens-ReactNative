// src/graphql/billing.ts
import { gql } from "@apollo/client";

export const MARK_USER_PREMIUM_FROM_MOBILE = gql`
  mutation MarkUserPremiumFromMobile {
    markUserPremiumFromMobile {
      id
      isPremium
      premiumSince
      regenerateTokens
    }
  }
`;

export const ADD_REGEN_TOKENS_FROM_MOBILE = gql`
  mutation AddRegenTokensFromMobile($amount: Int!) {
    addRegenTokensFromMobile(amount: $amount) {
      id
      regenerateTokens
      isPremium
    }
  }
`;
