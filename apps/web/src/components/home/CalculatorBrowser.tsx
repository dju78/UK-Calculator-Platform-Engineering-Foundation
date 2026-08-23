"use client";

import { useState } from "react";
import Link from "next/link";
import { liveCalculators } from "@/lib/calculators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export function CalculatorBrowser() {
  const [search, setSearch] = useState("");

  const filtered = liveCalculators.filter(calc => 
    calc.name.toLowerCase().includes(search.toLowerCase()) || 
    calc.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Calculators</h1>
        <p className="text-slate-500">
          Browse and search all available Wave 1 calculators.
        </p>
      </div>
      
      <div className="max-w-md">
        <Input 
          placeholder="Search calculators..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(calc => (
          <Link key={calc.id} href={`/calculators/${calc.slug}`}>
            <Card className="h-full hover:border-slate-300 transition-colors cursor-pointer flex flex-col">
              <CardHeader>
                <CardTitle>{calc.name}</CardTitle>
                <div className="text-xs text-slate-500 font-mono mt-1">{calc.id}</div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-2">
                <div className="flex gap-2 mt-auto">
                  <Badge>{calc.category}</Badge>
                  {calc.implementationStatus === "implemented" ? (
                    <Badge variant="success">Live</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-500 mb-6">
              No calculators found matching &quot;{search}&quot;. Try adjusting your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
