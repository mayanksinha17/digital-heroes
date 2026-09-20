"use client";

import { useState, useMemo } from "react";
import { CharityCard } from "./CharityCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Heart, Sparkles, Filter } from "lucide-react";
import type { Charity } from "@/modules/charities/service";

interface CharityDirectoryProps {
  initialCharities: Charity[];
}

export function CharityDirectory({ initialCharities }: CharityDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialCharities.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["All", ...Array.from(set)];
  }, [initialCharities]);

  const filteredCharities = useMemo(() => {
    return initialCharities.filter((charity) => {
      const matchesSearch =
        searchTerm.trim() === "" ||
        charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charity.short_description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || charity.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [initialCharities, searchTerm, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by charity name or mission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-brand-emerald-500 text-brand-navy-900 shadow-md shadow-brand-emerald-900/30"
                  : "bg-brand-navy-800 text-slate-300 border border-white/10 hover:bg-brand-navy-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Charities */}
      {filteredCharities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharities.map((charity) => (
            <CharityCard key={charity.id} charity={charity} />
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-12 text-center space-y-4 my-8">
          <Heart className="h-12 w-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">No charities found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            We couldn&apos;t find any charities matching &quot;{searchTerm}&quot;. Try adjusting your search keywords or filter.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("All");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
