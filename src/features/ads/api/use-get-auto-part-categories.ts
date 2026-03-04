import { useQuery } from "@tanstack/react-query";

export interface AutoPartCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useGetAutoPartCategories = (onlyActive = false) => {
  return useQuery<AutoPartCategory[]>({
    queryKey: ["auto-part-categories", onlyActive],
    queryFn: async () => {
      const url = onlyActive
        ? "/api/auto-part-category?isActive=true&limit=200"
        : "/api/auto-part-category?limit=200";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch auto part categories");
      const data = await res.json();
      return data.categories as AutoPartCategory[];
    },
  });
};
