export default function ProfileLoading() {
  return (
    <div className="min-h-screen pb-20">
      <div className="glass border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <div className="skeleton w-9 h-9 rounded-xl" />
          <div className="space-y-1.5">
            <div className="skeleton w-32 h-5 rounded-xl" />
            <div className="skeleton w-44 h-3.5 rounded-xl" />
          </div>
        </div>
      </div>
      <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
        <div className="glass rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-4 mb-2">
            <div className="skeleton w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton w-28 h-4 rounded-xl" />
              <div className="skeleton w-40 h-3.5 rounded-xl" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton w-24 h-3.5 rounded-xl" />
              <div className="skeleton w-full h-12 rounded-2xl" />
            </div>
          ))}
        </div>
        <div className="skeleton w-full h-14 rounded-2xl" />
      </main>
    </div>
  );
}
