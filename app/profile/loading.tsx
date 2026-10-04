export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground" aria-busy="true">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="h-8 w-28 animate-pulse rounded-md bg-muted dark:bg-white/10" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card dark:border-white/10 dark:bg-white/5" />
      </div>
    </main>
  );
}
