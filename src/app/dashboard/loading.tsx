export default function DashboardLoading() {
  return (
    <div className="min-h-screen pb-20">
      {/* Header skeleton */}
      <div className="glass border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
            <div className="w-20 h-5 rounded-lg bg-white/10 animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="w-16 h-8 rounded-xl bg-white/10 animate-pulse" />
            <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
          </div>
        </div>
      </div>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="w-40 h-7 rounded-xl bg-white/10 animate-pulse mb-2" />
        <div className="w-48 h-4 rounded-lg bg-white/8 animate-pulse mb-6" />
        {/* Nav cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
        </div>
        {/* Pet cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2].map(i => (
            <div key={i} className="glass rounded-3xl overflow-hidden">
              <div className="h-48 bg-white/8 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="w-24 h-5 rounded-lg bg-white/10 animate-pulse" />
                <div className="w-32 h-3 rounded-lg bg-white/8 animate-pulse" />
                <div className="flex gap-2 mt-4">
                  <div className="flex-1 h-9 rounded-xl bg-white/8 animate-pulse" />
                  <div className="w-24 h-9 rounded-xl bg-white/8 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
