import { NextResponse } from 'next/server';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface AgentStatus {
  name: string;
  soul: boolean;
  memory_entries: number;
  last_active: string | null;
  role_summary: string;
}

function extractRoleSummary(soulContent: string): string {
  // Pull the first non-empty line after "## Role"
  const lines = soulContent.split('\n');
  const roleIdx = lines.findIndex(l => l.trim() === '## Role');
  if (roleIdx === -1) return 'No role defined';
  for (let i = roleIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith('#')) return line.replace(/^- /, '');
  }
  return 'No role defined';
}

export async function GET() {
  try {
    const agentsDir = join(process.cwd(), '..', 'agents');
    const agentNames = readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    const agents: AgentStatus[] = agentNames.map(name => {
      const soulPath = join(agentsDir, name, 'SOUL.md');
      const memoryPath = join(agentsDir, name, '{memory}');

      const hasSoul = existsSync(soulPath);
      const soulContent = hasSoul ? readFileSync(soulPath, 'utf-8') : '';

      // Count memory log entries if memory dir exists
      let memoryEntries = 0;
      if (existsSync(memoryPath)) {
        try {
          const memFiles = readdirSync(memoryPath).filter(f => f.endsWith('.md'));
          memoryEntries = memFiles.length;
        } catch {
          memoryEntries = 0;
        }
      }

      return {
        name,
        soul: hasSoul,
        memory_entries: memoryEntries,
        last_active: null, // populated once agents start logging activity
        role_summary: extractRoleSummary(soulContent),
      };
    });

    return NextResponse.json({ agents, total: agents.length }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load agent data', detail: String(err) }, { status: 500 });
  }
}
