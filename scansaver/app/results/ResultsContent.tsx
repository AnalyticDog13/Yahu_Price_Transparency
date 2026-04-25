"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import Link from "next/link";
import { getResults, type Provider, type Insurance } from "@/lib/mockData";
import Navbar from "@/components/Navbar";

type SortKey = "price" | "distance" | "confidence";

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    score >= 80 ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
    "bg-red-50 text-red-700 border-red-100";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${score >= 90 ? "bg-emerald-500" : score >= 80 ? "bg-yellow-500" : "bg-red-500"}`} />
      {score}% confidence
    </span>
  );
}

function TypeBadge({ type }: { type: Provider["type"] }) {
  const styles: Record<Provider["type"], string> = {
    Hospital: "bg-purple-50 text-purple-700 border-purple-100",
    "Imaging Center": "bg-blue-50 text-blue-700 border-blue-100",
    "Outpatient Clinic": "bg-teal-50 text-teal-700 border-teal-100",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${styles[type]}`}>
      {type}
    </span>
  );
}

export default function ResultsContent() {
  const params = useSearchParams();
  const router = useRouter();

  const procedure = params.get("procedure") ?? "";
  const zip = params.get("zip") ?? "";
  const insurance = (params.get("insurance") ?? "") as Insurance;

  const [sort, setSort] = useState<SortKey>("price");

  const rawResults = useMemo(
    () => getResults(procedure, insurance),
    [procedure, insurance]
  );

  const sorted = useMemo(() => {
    return [...rawResults].sort((a, b) => {
      if (sort === "price") {
        const pa = (insurance && a.insurancePrice[insurance]) ?? a.cashPrice;
        const pb = (insurance && b.insurancePrice[insurance]) ?? b.cashPrice;
        return pa - pb;
      }
      if (sort === "distance") return a.distance - b.distance;
      return b.confidenceScore - a.confidenceScore;
    });
  }, [rawResults, sort, insurance]);

  const cheapestId = useMemo(() => {
    if (!sorted.length) return null;
    return [...sorted].sort((a, b) => {
      const pa = (insurance && a.insurancePrice[insurance]) ?? a.cashPrice;
      const pb = (insurance && b.insurancePrice[insurance]) ?? b.cashPrice;
      return pa - pb;
    })[0].id;
  }, [sorted, insurance]);

  const closestId = useMemo(() => {
    if (!sorted.length) return null;
    return [...sorted].sort((a, b) => a.distance - b.distance)[0].id;
  }, [sorted]);

  const bestValueId = useMemo(() => {
    if (!sorted.length) return null;
    return [...sorted].sort((a, b) => {
      const priceA = (insurance && a.insurancePrice[insurance]) ?? a.cashPrice;
      const priceB = (insurance && b.insurancePrice[insurance]) ?? b.cashPrice;
      const scoreA = (a.confidenceScore / priceA) * 1000;
      const scoreB = (b.confidenceScore / priceB) * 1000;
      return scoreB - scoreA;
    })[0].id;
  }, [sorted, insurance]);

  const displayPrice = (p: Provider) => {
    const ip = insurance ? p.insurancePrice[insurance] : null;
    return ip ?? p.cashPrice;
  };

  if (!procedure) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 text-lg">No search found.</p>
        <Link href="/" className="text-blue-600 font-medium hover:underline">
          ← Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Top bar */}
      <div className="pt-16 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <button onClick={() => router.push("/")} className="hover:text-blue-600 transition-colors">
                  ← Back
                </button>
                <span>/</span>
                <span>Results</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
                {procedure}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  ZIP {zip}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {insurance}
                </span>
                <span className="inline-flex items-center text-sm text-slate-500">
                  {sorted.length} providers found
                </span>
              </div>
            </div>

            {/* Sort buttons */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium mr-1 hidden md:block">Sort by:</span>
              {(["price", "distance", "confidence"] as SortKey[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    sort === s
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s === "price" ? "Lowest Price" : s === "distance" ? "Closest" : "Highest Confidence"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        {sorted.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500 text-lg">No results found for this search.</p>
            <Link href="/" className="mt-4 inline-block text-blue-600 font-medium hover:underline">
              Try a different search
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((provider, idx) => {
              const price = displayPrice(provider);
              const isCheapest = provider.id === cheapestId;
              const isClosest = provider.id === closestId;
              const isBestValue = provider.id === bestValueId;

              return (
                <div
                  key={provider.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    isCheapest ? "border-emerald-200 shadow-emerald-50 shadow-sm" :
                    isBestValue ? "border-blue-200 shadow-blue-50 shadow-sm" :
                    "border-slate-100 shadow-sm"
                  }`}
                >
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Rank */}
                      <div className="hidden md:flex w-8 h-8 rounded-full bg-slate-100 items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0 mt-1">
                        {idx + 1}
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="text-lg font-bold text-slate-900">{provider.name}</h2>
                          {isCheapest && (
                            <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                              🏆 Cheapest
                            </span>
                          )}
                          {isClosest && (
                            <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                              📍 Closest
                            </span>
                          )}
                          {isBestValue && !isCheapest && (
                            <span className="inline-flex items-center gap-1 bg-violet-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                              ⭐ Best Value
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mb-3">{provider.address}</p>

                        <div className="flex flex-wrap items-center gap-3">
                          <TypeBadge type={provider.type} />
                          <ConfidenceBadge score={provider.confidenceScore} />
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {provider.distance} mi away
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {provider.phone}
                          </span>
                        </div>

                        {provider.notes && (
                          <p className="mt-3 text-sm text-slate-400 italic">{provider.notes}</p>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="flex md:flex-col items-center md:items-end gap-4 md:gap-1 flex-shrink-0 md:text-right">
                        <div>
                          <div className={`text-3xl font-extrabold tracking-tight ${isCheapest ? "text-emerald-600" : "text-slate-900"}`}>
                            ${price.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400 font-medium mt-0.5">
                            Est. {insurance || "self-pay"} price
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-semibold text-slate-600">
                            ${provider.cashPrice.toLocaleString()}
                          </div>
                          <div className="text-xs text-slate-400">cash price</div>
                        </div>
                        <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">
          Prices are estimates based on publicly available transparency data. Actual costs may vary. Always confirm with your provider and insurance.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 mt-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm">ScanSaver</span>
          </div>
          <p className="text-xs">© 2024 ScanSaver. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
