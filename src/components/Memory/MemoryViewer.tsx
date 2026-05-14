import type { MemoryMd } from "@/lib/types";
import { formatDate } from "../format";

type MemoryViewerProps = {
  memory: MemoryMd;
};

export function MemoryViewer({ memory }: MemoryViewerProps) {
  const preview = memory.content.length > 3200 ? `${memory.content.slice(0, 3200)}...` : memory.content;

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-50">{memory.path}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Updated {formatDate(memory.last_updated)} · {memory.size_kb.toFixed(1)} KB
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {memory.sections.map((section) => (
            <span key={section} className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
              {section}
            </span>
          ))}
        </div>
      </div>
      <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-300">
        {preview}
      </pre>
    </section>
  );
}
