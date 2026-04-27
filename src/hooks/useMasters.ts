"use client";
import axios from "axios";
import { useEffect, useState } from "react";

export type AssetType = "FX" | "STOCK";

export interface Master {
  id: number;
  symbol: string;
  displayName: string;
  assetType: AssetType;
  market: string;
}

export const useMasters = (filter?: AssetType) => {
  const [masters, setMasters] = useState<Master[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    axios
      .get<Master[]>("/api/masters", { params: filter ? { assetType: filter } : {} })
      .then((res) => {
        if (active) setMasters(res.data);
      })
      .catch((err) => {
        if (active) setError(`${err}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  return { masters, loading, error };
};

export const INTERVALS_BY_ASSET: Record<AssetType, string[]> = {
  FX: ["5m", "1h", "4h"],
  STOCK: ["1h", "1d"],
};
