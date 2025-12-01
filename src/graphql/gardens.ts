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