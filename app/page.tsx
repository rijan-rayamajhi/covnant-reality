"use client";

import { HeroSearch } from "@/components/ui/HeroSearch";
import { CategoryScroll } from "@/components/ui/CategoryScroll";
import { RecentlyAddedProperties } from "@/components/ui/RecentlyAddedProperties";
import { PremiumProperties } from "@/components/ui/PremiumProperties";
import { RecommendedForYou } from "@/components/ui/RecommendedForYou";
import { VerifiedProperties } from "@/components/ui/VerifiedProperties";
import { AffordableRentals } from "@/components/ui/AffordableRentals";
import { FeaturedProjects } from "@/components/ui/FeaturedProjects";
import { TrustSection } from "@/components/ui/TrustSection";
// import { TopAgents } from "@/components/ui/TopAgents";
import { Testimonials } from "@/components/ui/Testimonials";




export default function HomePage() {
  return (
    <>
      {/* 1. Hero Search */}
      <HeroSearch />

      {/* 2. Explore Categories */}
      <CategoryScroll />

      {/* 3. Recently Added Properties */}
      <RecentlyAddedProperties />

      {/* 4. Premium Properties */}
      <PremiumProperties />

      {/* 5. Recommended For You */}
      <RecommendedForYou />

      {/* 6. Verified Properties */}
      <VerifiedProperties />

      {/* 7. Affordable Rentals & PG */}
      <AffordableRentals />

      {/* 8. Featured Projects */}
      <FeaturedProjects />

      {/* 9. Trending Locations */}
      {/* <TrendingLocations /> */}

      {/* 11. Trust Section */}
      <TrustSection />

      {/* 12. Top Agents */}
      {/* <TopAgents /> */}

      {/* 13. Testimonials */}
      <Testimonials />





    </>
  );
}
