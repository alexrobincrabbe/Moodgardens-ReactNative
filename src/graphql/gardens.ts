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
      summary
      period
      periodKey
      progress
      updatedAt
    }
  }
`;