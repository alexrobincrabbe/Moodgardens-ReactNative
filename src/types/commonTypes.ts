type CalendarDay = {
  dateString: string;
  day: number;
  month: number;
  year: number;
};

type GardensByMonthData = {
  gardensByMonth: {
    id: string;
    period: string;
    periodKey: string; // e.g. "2025-11-03"
    status: "PENDING" | "READY" | "FAILED";
    imageUrl?: string | null;
    publicId: string;
    shortTheme: string | null;
    summary?: string | null;
    progress?: number | null;
    shareUrl?: string | null;
    updatedAt: string;
    version?: number | null;
  }[];
};

type GardensByMonthVars = {
  monthKey: string; // e.g. "2025-11"
};
