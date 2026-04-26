export function NewsletterSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-vermillion">
        <span className="inline-block h-1.5 w-1.5 bg-vermillion animate-pulse" />
        Composition en cours…
      </div>
      {[0, 1, 2].map((sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-24 bg-ink/10 dark:bg-night-text/10 border-2 border-ink/20 dark:border-night-text/20" />
            <div className="h-px flex-1 bg-ink dark:bg-night-text" />
          </div>
          <div className="h-10 w-3/4 bg-ink/10 dark:bg-night-text/10" />
          <div className="space-y-5 pt-2">
            {[0, 1].map((itemIndex) => (
              <div
                key={itemIndex}
                className="flex flex-col md:flex-row gap-0 border-2 border-ink/20 dark:border-night-text/20"
              >
                <div className="h-32 md:h-auto md:w-44 shrink-0 bg-ink/5 dark:bg-night-text/5 border-b-2 md:border-b-0 md:border-r-2 border-ink/20 dark:border-night-text/20" />
                <div className="flex-1 p-5 space-y-3">
                  <div className="h-3 w-1/3 bg-ink/10 dark:bg-night-text/10" />
                  <div className="h-5 w-3/4 bg-ink/15 dark:bg-night-text/15" />
                  <div className="space-y-2 pt-2">
                    <div className="h-2.5 w-full bg-ink/10 dark:bg-night-text/10" />
                    <div className="h-2.5 w-5/6 bg-ink/10 dark:bg-night-text/10" />
                    <div className="h-2.5 w-4/6 bg-ink/10 dark:bg-night-text/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
