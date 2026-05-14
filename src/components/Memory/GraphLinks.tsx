import type { MemoryGraphLink } from "@/lib/types";

type GraphLinksProps = {
  links: MemoryGraphLink[];
};

export function GraphLinks({ links }: GraphLinksProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <h2 className="text-lg font-semibold text-slate-50">Graph Links</h2>
      {links.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No graph links file is available yet.</p>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {links.map((link) => (
            <div key={`${link.from}-${link.to}-${link.type}`} className="rounded-md border border-white/10 bg-black/15 p-3">
              <p className="text-sm font-semibold text-slate-100">{link.from}</p>
              <p className="mt-1 text-xs uppercase text-cyan-200">{link.type}</p>
              <p className="mt-1 text-sm text-slate-300">{link.to}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
