import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const workspacePath = process.env.HOME + '/.openclaw/workspace';
    const roiFile = join(workspacePath, 'roi-tracker.jsonl');

    let projects: any[] = [];

    if (existsSync(roiFile)) {
      const lines = readFileSync(roiFile, 'utf-8')
        .split('\n')
        .filter(line => line.trim());
      
      projects = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching ROI tracker data:', error);
    return NextResponse.json({ projects: [] });
  }
}
