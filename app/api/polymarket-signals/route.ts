import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const workspacePath = process.env.HOME + '/.openclaw/workspace';
    const signalsFile = join(workspacePath, 'polymarket-signals.jsonl');

    let signals: any[] = [];

    if (existsSync(signalsFile)) {
      const lines = readFileSync(signalsFile, 'utf-8')
        .split('\n')
        .filter(line => line.trim());
      
      signals = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    return NextResponse.json({ signals });
  } catch (error) {
    console.error('Error fetching polymarket signals:', error);
    return NextResponse.json({ signals: [] });
  }
}
