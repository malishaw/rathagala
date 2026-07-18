"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetOrganizations } from "@/features/organizations/api/use-get-orgs";

// Define organization type
export type Organization = {
  id: string;
  name?: string;
  logo?: string | null;
  verified?: boolean;
  _count?: {
    ads: number;
  };
};

const OrganizationCard = ({ org }: { org: Organization }) => (
  <div
    className="flex items-center space-x-3 p-3 bg-slate-50/60 hover:bg-teal-50/30 border border-slate-150/40 hover:border-teal-500/10 rounded-xl hover:shadow-[0_4px_12px_rgba(2,73,80,0.03)] hover:scale-[1.01] transition-all duration-200 cursor-pointer group/card"
    onClick={() => window.location.href = `/organizations/${org.id}`}
  >
    <div className="w-11 h-11 bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-full flex items-center justify-center overflow-hidden border border-slate-200/50 relative shadow-inner">
      {org.logo ? (
        <Image
          src={org.logo}
          alt={org.name || "Dealer logo"}
          fill
          sizes="44px"
          loading="lazy"
          className="object-cover group-hover/card:scale-105 transition-transform duration-300"
        />
      ) : (
        <span className="text-teal-700 font-bold text-xs uppercase">
          {org.name?.charAt(0) || 'D'}
        </span>
      )}
      {org.verified && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full shadow-sm" title="Verified Dealer"></span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-slate-800 text-sm truncate group-hover/card:text-teal-700 transition-colors">
        {org.name || "Unnamed Dealer"}
      </div>
      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
        {org.verified ? "Verified Partner" : "Dealer"} • {org._count?.ads || 0} listing{org._count?.ads !== 1 ? "s" : ""}
      </div>
    </div>
  </div>
);

export function FeaturedDealers() {
  const [showAllDealers, setShowAllDealers] = useState(false);
  
  const { data, isLoading, error } = useGetOrganizations({
    limit: 3,
  });

  const { data: allOrgsData, isLoading: allOrgsLoading } = useGetOrganizations({
    limit: 50,
  });

  if (isLoading) {
    return (
      <Card className="p-5 bg-white rounded-xl border border-slate-100/80">
        <h3 className="font-bold text-slate-800 mb-4 tracking-tight">Featured Dealers</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-slate-50/50 rounded-xl animate-pulse">
              <div className="w-11 h-11 bg-slate-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3.5 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-2.5 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error || !data?.organizations || data.organizations.length === 0) {
    return (
      <Card className="p-5 bg-white rounded-xl border border-slate-100/80">
        <h3 className="font-bold text-slate-800 mb-4 tracking-tight">Featured Dealers</h3>
        <div className="p-3 text-center text-slate-500 text-sm">
          No dealers available at the moment
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-5 bg-white rounded-xl border border-slate-100/80">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 tracking-tight">Featured Dealers</h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-700 hover:text-teal-800 hover:bg-teal-50 text-xs font-semibold rounded-lg"
            onClick={() => setShowAllDealers(true)}
          >
            View All
          </Button>
        </div>

        <div className="space-y-2.5">
          {data.organizations.map((org: Organization) => (
            <OrganizationCard key={org.id} org={org} />
          ))}
        </div>
      </Card>

      <Dialog open={showAllDealers} onOpenChange={setShowAllDealers}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">All Dealers</DialogTitle>
          </DialogHeader>

          {allOrgsLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : (
            <div className="grid gap-3 py-4">
              {allOrgsData?.organizations?.length ? (
                allOrgsData.organizations.map((org: Organization) => (
                  <OrganizationCard key={org.id} org={org} />
                ))
              ) : (
                <div className="text-center text-slate-500 p-4">
                  No more dealers to display
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
