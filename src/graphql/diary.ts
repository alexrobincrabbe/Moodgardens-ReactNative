// src/graphql/diary.ts
import { gql } from "@apollo/client";

export const CreateDiaryEntry = gql`
  mutation CreateDiaryEntry($text: String!) {
    createDiaryEntry(text: $text) {
      id
      createdAt
    }
  }
`;

export const GetDiaryEntry = gql`
  query DiaryEntry($dayKey: String!) {
    diaryEntry(dayKey: $dayKey) {
      id
      dayKey
      text
      createdAt
    }
  }
`;

export const PaginatedDiaryEntries = gql`
  query PaginatedDiaryEntries($limit: Int!, $offset: Int!) {
    paginatedDiaryEntries(limit: $limit, offset: $offset) {
      id
      text
      dayKey
      createdAt
      garden {
        id
        status
        imageUrl
        publicId
        shareUrl
        progress
        periodKey
        updatedAt
      }
    }
  }
`;

export const RequestGenerateGarden = gql`
  mutation RequestGenerateGarden(
    $period: GardenPeriod!
    $periodKey: String
    $gardenType: String
  ) {
    requestGenerateGarden(
      period: $period
      periodKey: $periodKey
      gardenType: $gardenType
    ) {
      id
      status
      period
      periodKey
      imageUrl
      publicId
      shareUrl
      progress
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



export const TodayMetaQuery = gql`
  query TodayMeta {
    currentDiaryDayKey
  }
`;
