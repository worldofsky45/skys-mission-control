import { NextResponse } from 'next/server';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const workspacePath = process.env.HOME + '/.openclaw/workspace';
    
    const files = [
      { name: 'Paper Trading', path: join(workspacePath, 'crypto-intel/paper-trading/trades.jsonl') },
      { name: 'Polymarket Signals', path: join(workspacePath, 'polymarket-signals.jsonl') },
      { name: 'ROI Tracker', path: join(workspacePath, 'roi-tracker.jsonl') }
    ];

    const fileStatuses = files.map(file => ({
      name: file.name,
      exists: existsSync(file.path),
      path: file.path
    }));

    const existingCount = fileStatuses.filter(f => f.exists).length;
    
    let status: 'healthy' | 'degraded' | 'critical';
    if (existingCount === files.length) {
      status = 'healthy';
    } else if (existingCount > 0) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    return NextResponse.json({
      status,
      files: fileStatuses,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    return NextResponse.json({
      status: 'critical',
      files: [],
      timestamp: new Date().toISOString()
    });
  }
}
