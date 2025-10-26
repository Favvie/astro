"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import CreateCampaignDrawer from "../../_components/create-campaign-drawer";
import TableRow from "../../_components/table-row";
import { ArrowDown, BrushCleaning, Search } from "lucide-react";
import GlobalStats from "~~/components/GlobalStats";
import { AdvertisedCampaigns } from "~~/components/sliding-campaigns";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { Skeleton } from "~~/components/ui/skeleton";
import { useAllCampaignsWithDetails } from "~~/hooks/envioDataQueries/useAllCampaignsWithDetails";

type SortOption = "live" | "active" | "all" | "cancelled";

export function ExplorerContent() {
  const [sortBy, setSortBy] = useState<SortOption>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all campaigns from Envio (real-time) + Contract (full details)
  const { data: allCampaigns, isLoading } = useAllCampaignsWithDetails();

  console.log("allCampaigns:", allCampaigns);
  console.log("isLoading:", isLoading);

  const campaigns = useMemo(() => {
    if (!allCampaigns || allCampaigns.length === 0) return [];

    // Filter by status first
    let filteredCampaigns = allCampaigns.filter(campaign => {
      switch (sortBy) {
        case "active":
          return campaign.isActive;
        case "live":
          return campaign.isFundingComplete === true;
        case "cancelled":
          return campaign.isCancelled;
        default:
          return true; // Show all for other sort options
      }
    });

    // Filter by search query (campaign name or creator address)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredCampaigns = filteredCampaigns.filter(
        campaign => campaign.name.toLowerCase().includes(query) || campaign.creator.toLowerCase().includes(query),
      );
    }

    // Sort the filtered campaigns
    return [...filteredCampaigns].sort((a, b) => {
      switch (sortBy) {
        case "live":
        case "active":
        case "cancelled":
          return b.blockNumberCreated - a.blockNumberCreated;

        default:
          return b.blockNumberCreated - a.blockNumberCreated;
      }
    });
  }, [allCampaigns, sortBy, searchQuery]);

  // const sortedAndFilteredCampaigns = useMemo(() => {
  //   if (!campaigns.length) return [];

  //   // First filter by search query
  //   const filtered = campaigns.filter(campaign => {
  //     if (!searchQuery.trim()) return true;

  //     const query = searchQuery.toLowerCase();
  //     return (
  //       campaign.name.toLowerCase().includes(query) ||
  //       campaign.symbol.toLowerCase().includes(query) ||
  //       campaign.description.toLowerCase().includes(query) ||
  //       campaign.creator.toLowerCase().includes(query)
  //     );
  //   });

  //   // Then sort the filtered results
  //   const sorted = [...filtered].sort((a, b) => {
  //     switch (sortBy) {
  //       case "live":
  //         return b.blockNumberCreated - a.blockNumberCreated;

  //       case "active":
  //         // Active campaigns first, then sort by newest
  //         if (a.isActive && !b.isActive) return -1;
  //         if (!a.isActive && b.isActive) return 1;
  //         return b.blockNumberCreated - a.blockNumberCreated;

  //       case "completed":
  //         // Completed campaigns first, then sort by newest
  //         if (a.isFundingComplete && !b.isFundingComplete) return -1;
  //         if (!a.isFundingComplete && b.isFundingComplete) return 1;
  //         return b.blockNumberCreated - a.blockNumberCreated;

  //       case "cancelled":
  //         // Cancelled campaigns first, then sort by newest
  //         if (a.isCancelled && !b.isCancelled) return -1;
  //         if (!a.isCancelled && b.isCancelled) return 1;
  //         return b.blockNumberCreated - a.blockNumberCreated;

  //       default:
  //         return b.blockNumberCreated - a.blockNumberCreated;
  //     }
  //   });

  //   return sorted;
  // }, [campaigns, sortBy, searchQuery]);

  return (
    <div className="p-1.5 space-y-8 bg-[#070907] m-2 sm:m-4 rounded-2xl">
      <div className="w-full p-4 grid sm:grid-cols-2 items-center sm:px-5">
        <div className="flex flex-col items-start gap-2 sm:pl-8 order-2 sm:order-1">
          <h1 className="text-3xl sm:text-6xl font-medium font-stretch-normal">
            Ahoy!, Space Cadets. Find the Next Rocket Before It Blasts Off
          </h1>
          <p className="text-gray-400 text-sm">
            Welcome to the launch zone. Explore live, upcoming, and completed campaigns from creators building in the
            open. Buy in early to earn more tokens.
          </p>
          <div className="text-[#546054b0] text-xs">Create a campaign</div>
          <CreateCampaignDrawer />
          <GlobalStats />
        </div>

        <Image
          src={"/space/space-4-nobg.png"}
          alt="Space"
          width={800}
          height={800}
          className="rounded-3xl w-[90%] ml-auto order-1 sm:order-2"
          objectFit="contain"
        />
      </div>

      <AdvertisedCampaigns />

      <div className="space-y-6 bg-[#101720] p-3 sm:p-6 rounded-2xl">
        {/* Filters and search */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm hidden sm:block">Sort:</span>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="border-[#25333b] focus:border-gray-500">
                  <div className="hidden sm:block">
                    <SelectValue placeholder="Sort by" />
                  </div>
                </SelectTrigger>
                <SelectContent className="text-gray-300 bg-[#11181C] border-[#3e545f]">
                  <SelectGroup>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="text-gray-400 border-[#25333b] sm:hidden bg-transparent">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <CreateCampaignDrawer />
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Filter vaults"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-transparent border-[#25333b] rounded-lg h-10 text-white placeholder-gray-400 focus:border-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="rounded-lg">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400/70 text-xs bg-[#19242a] mb-4 rounded-t-2xl">
              <div>Campaign</div>
              <div>Amount</div>
              <div className="flex items-center space-x-1">
                <span>Creator</span>
                <ArrowDown className="h-3 w-3" />
              </div>
              <div>Status</div>
              <div>Indulge</div>
            </div>

            <div className="space-y-3 overflow-x-scroll max-h-96 overflow-y-scroll">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-20 bg-[#070907]/50 w-full rounded-2xl" key={i} />
              ))}
            </div>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="rounded-lg">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400/70 text-xs bg-[#19242a] mb-4 rounded-t-2xl">
              <div>Campaign</div>
              <div>Amount</div>
              <div className="flex items-center space-x-1">
                <span>Creator</span>
                <ArrowDown className="h-3 w-3" />
              </div>
              <div>Status</div>
              <div>Indulge</div>
            </div>

            <div className="space-y-3 overflow-x-scroll max-h-96 overflow-y-scroll">
              {campaigns?.map(campaign => <TableRow key={campaign.id} campaign={campaign} />)}
            </div>
          </div>
        ) : searchQuery ? (
          <Card className="bg-[#19242a] border-[#3e545f] h-64">
            <div className="flex items-center justify-center w-full h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                  <Search size={27} />
                </div>

                <div className="flex flex-col items-start gap-2">
                  <div className="font-medium text-lg text-[#8daa98]">No campaigns found</div>
                  <div className="text-[#546054b0] text-xs">Try adjusting your search or filters</div>
                </div>

                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-400 hover:text-blue-300 text-sm underline"
                >
                  Clear search
                </button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-[#19242a] border-[#3e545f] h-64">
            <div className="flex items-center justify-center w-full h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                  <BrushCleaning size={27} />
                </div>

                <div className="flex flex-col items-start gap-2">
                  <div className="font-medium text-lg text-[#8daa98]">No campaign found</div>
                  <div className="text-[#546054b0] text-xs">Create a campaign to start</div>
                </div>

                <CreateCampaignDrawer />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
