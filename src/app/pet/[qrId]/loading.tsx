export default function PetPublicLoading() {
  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-lg">🐾</span>
          <div className="w-16 h-5 rounded-lg bg-white/10 animate-pulse" />
        </div>
        <div className="glass rounded-3xl overflow-hidden mb-6">
          <div className="w-full aspect-square bg-white/8 animate-pulse" />
        </div>
        <div className="glass rounded-3xl p-6 space-y-4">
          <div className="w-32 h-6 rounded-xl bg-white/10 animate-pulse" />
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="w-16 h-3 rounded bg-white/8 animate-pulse" />
                <div className="w-24 h-3 rounded bg-white/8 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
