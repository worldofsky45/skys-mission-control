import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const sprintPath = join(process.cwd(), '..', 'data', 'sprint', 'sprint.json');
    const raw = readFileSync(sprintPath, 'utf-8');
    const sprint = JSON.parse(raw);

    // Compute summary counts
    const tasks = sprint.tasks ?? [];
    const summary = {
      done: tasks.filter((t: any) => t.status === 'done').length,
      in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
      inbox: tasks.filter((t: any) => t.status === 'inbox').length,
      blocked: tasks.filter((t: any) => t.status === 'waiting_on_aakash' || t.status === 'waiting_on_sky').length,
      points_done: tasks.filter((t: any) => t.status === 'done').reduce((sum: number, t: any) => sum + (t.points ?? 0), 0),
    };

    return NextResponse.json({ sprint, summary }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load sprint data', detail: String(err) }, { status: 500 });
  }
}
