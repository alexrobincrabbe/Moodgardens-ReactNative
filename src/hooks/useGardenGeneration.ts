import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GetGarden } from "../graphql/gardens";

type GardenStatus = "PENDING" | "READY" | "FAILED";

interface GardenData {
  garden: {
    id: string;
    status: GardenStatus;
    progress?: number | null;
    imageUrl?: string | null;
    publicId?: string | null;
    shareUrl?: string | null;
    summary?: string | null;
    period: string;
    periodKey: string;
    updatedAt: string;
  } | null;
}

export function useGardenGeneration(dayKey: string | null, active: boolean) {
  const [isGenerating, setIsGenerating] = useState(active);

  const { data, loading, error, stopPolling } = useQuery<GardenData>(
    GetGarden,
    {
      variables: { period: "DAY", periodKey: dayKey as string },
      skip: !dayKey || !isGenerating,
      fetchPolicy: "network-only",
      pollInterval: 2000,
      notifyOnNetworkStatusChange: true,
    }
  );

  const garden = data?.garden ?? null;
  const status = garden?.status;
  const progress =
    typeof garden?.progress === "number"
      ? Math.round(garden.progress as number)
      : null;

  // Stop polling when READY or FAILED
  useEffect(() => {
    if (!isGenerating || !status) return;
    if (status === "READY" || status === "FAILED") {
      stopPolling?.();
      setIsGenerating(false);
    }
  }, [isGenerating, status, stopPolling]);

  return {
    garden,
    status,
    progress,
    loading,
    error,
    isGenerating,
    setIsGenerating,
  };
}
