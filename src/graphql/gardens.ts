import { gql } from "@apollo/client";


export const GardensByMonth = gql`
  query GardensByMonth($monthKey: String!) {
    gardensByMonth(monthKey: $monthKey) {
      id
      period
      periodKey
      status
      imageUrl
      publicId
      summary
      progress
      shareUrl
      updatedAt
      version
    }
  }
`;

export const GetGarden = gql`
  query GetGarden($period: GardenPeriod!, $periodKey: String!) {
    garden(period: $period, periodKey: $periodKey) {
      id
      status
      imageUrl
      publicId
      shareUrl
      summary
      period
      periodKey
      progress
      updatedAt
      version
    }
  }
`;

export const GetGardensByPeriod = gql`
  query GetGardensByPeriod($period: GardenPeriod!) {
    gardensByPeriod(period: $period) {
      id
      status
      imageUrl
      publicId
      shareUrl
      shortTheme
      summary
      period
      periodKey
      progress
      updatedAt
      version
    }
  }
`;

export const RegenerateGarden = gql`
  mutation RegenerateGarden($gardenId: String!) {
    regenerateGarden(gardenId: $gardenId) {
      id
      status
      progress
      publicId
      period
      periodKey
      updatedAt
      version
    }
  }
`;
