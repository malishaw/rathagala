import { client } from "@/lib/rpc";
import { useQuery } from "@tanstack/react-query";

export const useGetAdSummary = () => {
  return useQuery({
    queryKey: ["analytics", "ad-summary"],
    queryFn: async () => {
      const response = await client.api.analytics.summary.$get({});
      if (!response.ok) {
        throw new Error("Failed to fetch ad summary");
      }
      return response.json();
    },
  });
};

export const useGetAdCreationReport = (params?: {
  startDate?: string;
  endDate?: string;
  period?: "daily" | "monthly" | "range";
}) => {
  return useQuery({
    queryKey: ["analytics", "ad-creation", params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append("startDate", params.startDate);
      if (params?.endDate) queryParams.append("endDate", params.endDate);
      if (params?.period) queryParams.append("period", params.period);

      const response = await client.api.analytics["ad-creation"].$get({
        query: params as any,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch ad creation report");
      }
      return response.json();
    },
  });
};

export const useGetAdDeletionReport = (params?: {
  startDate?: string;
  endDate?: string;
  period?: "daily" | "monthly" | "range";
}) => {
  return useQuery({
    queryKey: ["analytics", "ad-deletion", params],
    queryFn: async () => {
      const response = await client.api.analytics["ad-deletion"].$get({
        query: params as any,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch ad deletion report");
      }
      return response.json();
    },
  });
};

export const useGetAdCreationByEntity = () => {
  return useQuery({
    queryKey: ["analytics", "ad-creation-by-entity"],
    queryFn: async () => {
      const response = await client.api.analytics["ad-creation-by-entity"].$get({});
      if (!response.ok) {
        throw new Error("Failed to fetch ad creation by entity");
      }
      return response.json();
    },
  });
};

export const useGetAdAdvancedSummary = (type?: string) => {
  return useQuery({
    queryKey: ["analytics", "ad-advanced-summary", type],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append("type", type);

      const response = await fetch(`/api/analytics/ad-advanced-summary?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch ad advanced summary");
      }
      return response.json();
    },
  });
};

export const useGetUserSummary = () => {
  return useQuery({
    queryKey: ["analytics", "user-summary"],
    queryFn: async () => {
      const response = await client.api.analytics["user-summary"].$get({});
      if (!response.ok) {
        throw new Error("Failed to fetch user summary");
      }
      return response.json();
    },
  });
};

export const useSearchAnalyticsUsers = (query: string) => {
  return useQuery({
    queryKey: ["analytics", "search-users", query],
    enabled: query.length >= 2,
    queryFn: async () => {
      const response = await client.api.analytics["search-users"].$get({
        query: { q: query },
      });
      if (!response.ok) {
        throw new Error("Failed to search users");
      }
      return response.json();
    },
  });
};

export const useGetEntityHistory = (params: {
  id?: string;
  type?: "user" | "organization";
  startDate?: string;
  endDate?: string;
  period?: "daily" | "monthly" | "range";
}) => {
  return useQuery({
    queryKey: ["analytics", "entity-history", params],
    enabled: !!params.id && !!params.type,
    queryFn: async () => {
      if (!params.id || !params.type) return null;

      const response = await client.api.analytics["entity-history"].$get({
        query: params as any,
      });
      if (!response.ok) {
        throw new Error("Failed to fetch entity history");
      }
      return response.json();
    },
  });
};
