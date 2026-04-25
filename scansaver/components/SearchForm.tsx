"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { procedures, insurances, type Insurance } from "@/lib/mockData";

export default function SearchForm() {
  const router = useRouter();
  const [procedure, setProcedure] = useState("");
  const [zip, setZip] = useState("");
  const [insurance, setInsurance] = useState<Insurance | "">("");
  const [error, setError] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!procedure || !zip || !insurance) {
      setError("Please fill in all fields to search.");
      return;
    }
    setError("");
    const params = new URLSearchParams({
      procedure,
      zip,
      insurance,
    });
    router.push(`/results?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/10 border border-slate-100 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Procedure */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Procedure
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <select
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select procedure…</option>
                {procedures.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* ZIP Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              ZIP Code
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="e.g. 10001"
                maxLength={5}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Insurance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Insurance
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <select
                value={insurance}
                onChange={(e) => setInsurance(e.target.value as Insurance)}
                className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select insurance…</option>
                {insurances.map((ins) => (
                  <option key={ins} value={ins}>{ins}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>
        )}

        <div className="mt-5">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-4 rounded-xl text-base transition-all duration-150 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            Compare Prices Near Me
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Free to use · No account required · Updated monthly
        </p>
      </div>
    </form>
  );
}
