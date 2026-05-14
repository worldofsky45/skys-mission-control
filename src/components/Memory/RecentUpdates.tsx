import type { MemoryFile } from "@/lib/types";
import { formatDate } from "../format";

type RecentUpdatesProps = {
  files: MemoryFile[];
};

export function RecentUpdates({ files }: RecentUpdatesProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-50">Recent Memory Files</h2>
        <p className="mt-1 text-sm text-slate-400">Markdown files under the OpenClaw memory directory.</p>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-500">
              <th className="pb-2 font-semibold">File</th>
              <th className="pb-2 font-semibold">Updated</th>
              <th className="pb-2 text-right font-semibold">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {files.map((file) => (
              <tr key={file.path}>
                <td className="py-3 font-medium text-slate-100">{file.name}</td>
                <td className="py-3 text-slate-400">{formatDate(file.last_updated)}</td>
                <td className="py-3 text-right text-slate-300">{file.size_kb.toFixed(1)} KB</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
