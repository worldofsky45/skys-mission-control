import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // NovaVault paths (primary source)
    const novaVaultPath = join(process.env.HOME!, 'Documents/Obsidian Vault/Obsidian Vault/NovaVault');
    const costsFile = join(novaVaultPath, 'Projects/Financial/costs.jsonl');
    const subscriptionsJsonlFile = join(novaVaultPath, 'Projects/Financial/subscriptions.jsonl');
    // Using Financial/costs.jsonl as the primary source (cost-details.jsonl doesn't exist yet)
    const novaCostsFile = costsFile;

    let subscriptions: any[] = [];
    let dailyCosts: any[] = [];
    let monthlyProjection = 0;
    let openRouterCost = 0;
    let novaSystemCosts: Record<string, { cost: number; reason: string }> = {};

    // Load Nova's system-level costs from Financial/costs.jsonl
    if (existsSync(novaCostsFile)) {
      const lines = readFileSync(novaCostsFile, 'utf-8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('{"_'));
      
      const novaCostEntries = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Group by description (extract system from description) and sum costs
      novaCostEntries.forEach((entry: any) => {
        // Extract system from description (e.g., "OpenRouter API - Paper trading execution")
        let system = 'AI Services';
        const desc = entry.description || '';
        if (desc.includes('Paper trading')) system = 'Paper Trading';
        else if (desc.includes('crypto intel')) system = 'Crypto Intel';
        else if (desc.includes('Mission Control')) system = 'Mission Control';
        else if (desc.includes('Edge intel')) system = 'Edge Intel';
        
        if (!novaSystemCosts[system]) {
          novaSystemCosts[system] = { cost: 0, reason: desc };
        }
        novaSystemCosts[system].cost += entry.amount || 0;
      });

      // Calculate total OpenRouter cost from Nova's usage
      openRouterCost = Object.values(novaSystemCosts).reduce((sum, sys) => sum + sys.cost, 0);
    }

    // Load subscriptions from JSONL (for future expansion, not displayed now)
    if (existsSync(subscriptionsJsonlFile)) {
      const lines = readFileSync(subscriptionsJsonlFile, 'utf-8')
        .split('\n')
        .filter(line => line.trim());
      
      subscriptions = lines.map(line => {
        try {
          const sub = JSON.parse(line);
          // Convert to dashboard format
          return {
            name: sub.name,
            cost: sub.monthlyEstimate || 0,
            frequency: 'monthly' as const,
            category: sub.category,
            lastBilled: sub.lastBilled,
            status: sub.status,
            notes: sub.notes
          };
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    // Load daily costs
    if (existsSync(costsFile)) {
      const lines = readFileSync(costsFile, 'utf-8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('//') && !line.startsWith('{"_'));
      
      dailyCosts = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    }

    // Calculate monthly projection
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dayOfMonth = now.getDate();
    
    const currentMonthSpend = dailyCosts
      .filter(cost => {
        const costDate = new Date(cost.date);
        return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear;
      })
      .reduce((sum, cost) => sum + cost.amount, 0);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyAverage = currentMonthSpend / dayOfMonth;
    monthlyProjection = dailyAverage * daysInMonth;

    // Add subscription costs to projection (currently just OpenRouter)
    monthlyProjection += openRouterCost;

    return NextResponse.json({
      subscriptions,
      dailyCosts,
      monthlyProjection,
      currentMonthSpend,
      subscriptionTotal: openRouterCost,
      openRouterCost, // Total Nova API cost
      novaSystemCosts // Breakdown by system (crypto-intel, paper-trading, etc.)
    });
  } catch (error) {
    console.error('Error fetching cost data:', error);
    return NextResponse.json({
      subscriptions: [],
      dailyCosts: [],
      monthlyProjection: 0,
      novaSystemCosts: {}
    });
  }
}
