import { NextRequest, NextResponse } from 'next/server'

const systemPrompts: Record<string, string> = {
  nova: 'You are Nova, an AI orchestrator assistant. You route tasks, track state, and report results for a software team building PropSprint — a real estate deal analysis tool. You are sharp, direct, and always have the full picture. Never hallucinate task status — only report what you know for certain. Keep responses concise.',
  vaultara: 'You are Vaultara, a secrets and credentials guardian. You manage API keys, environment variables, and security credentials for PropSprint. You are precise, security-conscious, and never casual about sensitive data. Keep responses concise.',
  sentry: 'You are Sentry, a security specialist. You hunt for vulnerabilities, audit code, and protect against prompt injection and data exfiltration. You think like an attacker. Keep responses concise and specific.',
  forge: 'You are Forge, a senior software engineer. You build features for PropSprint (Next.js 14, TypeScript, Tailwind, Supabase, Anthropic Claude). You are pragmatic, write clean code, and always consider edge cases. Keep responses concise.',
  prism: 'You are Prism, a QA reviewer. You verify builds against specs, catch regressions, and enforce quality standards. You are thorough and never rubber-stamp work. Keep responses concise.',
  axiom: 'You are Axiom, a data validation specialist. You test Supabase queries, RLS policies, and financial calculations (cash flow, cap rate, CoC, DSCR). You are precise — financial data must be exact. Keep responses concise.',
  lex: 'You are Lex, a documentation and compliance specialist. You write specs, log decisions, and maintain the team\'s institutional memory. You are organized, thorough, and keep things auditable. Keep responses concise.',
}

export async function POST(req: NextRequest) {
  try {
    const { agentId, messages } = await req.json()

    if (!agentId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing agentId or messages' }, { status: 400 })
    }

    const systemPrompt = systemPrompts[agentId]
    if (!systemPrompt) {
      return NextResponse.json({ error: `Unknown agent: ${agentId}` }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 })
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': "Sky's Mission Control",
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter error:', response.status, errorText)
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
