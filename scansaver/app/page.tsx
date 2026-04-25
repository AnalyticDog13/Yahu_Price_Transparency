import Navbar from "@/components/Navbar";
import SearchForm from "@/components/SearchForm";

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Save Money",
    description: "Imaging prices can vary by 10x between nearby providers. We surface the best value so you never overpay.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Save Time",
    description: "Instantly see nearby imaging centers ranked by price and distance — no phone calls or insurance runaround.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Avoid Surprise Bills",
    description: "See estimated out-of-pocket costs for your specific insurance before you book — no more billing surprises.",
    color: "bg-violet-50 text-violet-600",
  },
];

const stats = [
  { value: "10x", label: "Price variation between providers" },
  { value: "$1,400", label: "Average savings found" },
  { value: "15,000+", label: "Imaging centers covered" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero */}
      <section id="hero" className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-20 px-6 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 -z-10" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

        {/* Floating badge */}
        <div className="mb-6 inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          Price transparency for everyone
        </div>

        <h1 className="text-center text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-3xl text-balance">
          Find the Best{" "}
          <span className="text-blue-600">MRI, CT, and Ultrasound</span>{" "}
          Prices Near You
        </h1>

        <p className="mt-6 text-center text-lg md:text-xl text-slate-500 font-medium max-w-2xl text-balance">
          Compare nearby hospitals and imaging centers by price, distance, and insurance coverage before you book.
        </p>

        {/* Search form */}
        <div className="mt-10 w-full max-w-3xl">
          <SearchForm />
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 md:gap-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature cards */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why use ScanSaver?
            </h2>
            <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
              Medical imaging costs shouldn&apos;t be a mystery. We make it simple.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${f.color} mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-slate-500 text-lg">
              Get transparent pricing in under 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Enter your procedure", desc: "Select MRI, CT, or Ultrasound and your zip code." },
              { step: "2", title: "Add your insurance", desc: "Choose your plan or select self-pay to see cash prices." },
              { step: "3", title: "Compare and book", desc: "See ranked providers by price, distance, and confidence score." },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-lg shadow-blue-600/25">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Stop overpaying for imaging.
          </h2>
          <p className="mt-4 text-blue-100 text-lg max-w-xl mx-auto">
            Join thousands of patients who have saved hundreds — or thousands — on their scans.
          </p>
          <a
            href="#hero"
            className="mt-8 inline-flex items-center gap-2 bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
          >
            Search Prices Now
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
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
          <p className="text-xs text-center">
            Prices shown are estimates based on publicly available data. Always verify with your provider.
          </p>
          <p className="text-xs">© 2024 ScanSaver. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
