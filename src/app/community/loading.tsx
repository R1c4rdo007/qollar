export default function CommunityLoading() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass border-b border-white/5 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 animate-pulse" />
            <div className="w-28 h-5 rounded-lg bg-white/10 animate-pulse" />
          </div>
          <div className="w-20 h-8 rounded-xl bg-white/10 animate-pulse" />
        </div>
      </div>
      {/* Stories bar */}
      <div className="glass border-b border-white/5 px-4 py-3">
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-white/10 animate-pulse" />
              <div className="w-10 h-2.5 rounded bg-white/8 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {[1,2,3].map(i => (
          <div key={i} className="glass rounded-3xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-4 pb-3">
              <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse flex-shrink-0" />
              <div className="space-y-1.5">
                <div className="w-24 h-3.5 rounded bg-white/10 animate-pulse" />
                <div className="w-16 h-2.5 rounded bg-white/8 animate-pulse" />
              </div>
            </div>
            <div className="w-full aspect-square bg-white/8 animate-pulse" />
            <div className="px-5 py-3 space-y-2">
              <div className="w-20 h-4 rounded bg-white/8 animate-pulse" />
              <div className="w-full h-3 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
