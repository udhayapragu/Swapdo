/** Slow-drifting gold and violet light behind every page. CSS-only; frozen for reduced-motion users by the global rule. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="ambient-orb animate-drift-a top-[-20%] left-[-10%] h-[60vmax] w-[60vmax] bg-[radial-gradient(circle,rgb(201_164_95/0.13),transparent_65%)]" />
      <div className="ambient-orb animate-drift-b top-[30%] right-[-20%] h-[55vmax] w-[55vmax] bg-[radial-gradient(circle,rgb(138_108_240/0.12),transparent_65%)]" />
      <div className="ambient-orb animate-drift-c bottom-[-25%] left-[20%] h-[50vmax] w-[50vmax] bg-[radial-gradient(circle,rgb(233_207_152/0.08),transparent_65%)]" />
    </div>
  );
}
