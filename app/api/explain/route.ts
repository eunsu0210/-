import { NextResponse } from 'next/server'
import { findTerm, getExplanation, suggestTerm, MOCK_TERMS } from '@/lib/mock-terms'

export type ExplainApiResponse = {
  status: 'success' | 'irrelevant' | 'typo' | 'error'
  term?: string
  definition?: string
  analogy?: string
  role?: string
  suggestedTerm?: string
  message?: string
  source?: 'ai' | 'fallback'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const query = (body.query || '').trim()
    const regenerate = Boolean(body.regenerate)
    const variantIndex = typeof body.variantIndex === 'number' ? body.variantIndex : 0

    if (!query) {
      return NextResponse.json(
        { status: 'error', message: '검색어를 입력해주세요.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

    // Gemini API가 설정되어 있다면 AI 생성 시도
    if (apiKey) {
      try {
        const aiResult = await fetchFromGemini(query, apiKey, regenerate, variantIndex)
        if (aiResult) {
          return NextResponse.json(aiResult)
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local dictionary:', err)
      }
    }

    // Fallback 또는 기본 사전 조회 로직
    const localResult = getLocalExplanation(query, variantIndex)
    return NextResponse.json(localResult)
  } catch (error) {
    console.error('Explain API error:', error)
    return NextResponse.json(
      { status: 'error', message: '설명을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

function getLocalExplanation(query: string, variantIndex: number): ExplainApiResponse {
  const found = findTerm(query)
  if (found) {
    const explanation = getExplanation(found, variantIndex)
    return {
      status: 'success',
      term: found.term,
      definition: explanation.definition,
      analogy: explanation.analogy,
      role: explanation.role,
      source: 'fallback',
    }
  }

  const typo = suggestTerm(query)
  if (typo) {
    return {
      status: 'typo',
      suggestedTerm: typo,
      source: 'fallback',
    }
  }

  return {
    status: 'irrelevant',
    message: `'${query}'은(는) 보안 용어로 보이지 않아요. 다른 용어로 다시 검색해보세요.`,
    source: 'fallback',
  }
}

async function fetchFromGemini(
  query: string,
  apiKey: string,
  regenerate: boolean,
  variantIndex: number
): Promise<ExplainApiResponse | null> {
  const prompt = `
당신은 보안 전공 초보자와 교육생을 위해 어려운 보안 용어를 일상적인 비유로 쉽게 설명해주는 친절한 보안 교육 전문가입니다.

입력받은 용어: "${query}"
${regenerate ? `(주의: 기존과 다른 새로운 비유 방식을 사용하여 생성하세요. 시드 번호: ${variantIndex})` : ''}

다음 지침에 따라 처리하고 반드시 엄격한 JSON 형식으로만 응답하세요:

1. 만약 입력된 단어가 보안 관련 용어가 아니거나("사과", "날씨", "축구" 등), 의미 있는 보안 설명을 작성할 수 없는 무관한 단어라면:
{
  "status": "irrelevant"
}

2. 만약 입력된 단어에 오탈자가 있어 실제 보안 용어로 강력히 추정된다면 (예: "피슁" -> "피싱", "렌섬웨어" -> "랜섬웨어"):
{
  "status": "typo",
  "suggestedTerm": "정확한보안용어"
}

3. 입력된 단어가 올바른 보안 용어이거나 보안 분야에서 사용되는 개념인 경우:
{
  "status": "success",
  "term": "정식 용어명",
  "definition": "한 줄 정의 (초보자 눈높이에 맞춘 간결한 명확한 정의)",
  "analogy": "일상 상황에 접목한 비유 설명 (일상에서 누구나 겪을 법한 구체적인 상황에 빗대어 풍부하고 직관적으로 설명)",
  "role": "실제 보안에서의 역할 설명 (왜 중요한지, 실제 침해 예방이나 시스템 구축에서 어떤 역할을 담당하는지)"
}

JSON 이외의 어떠한 설명이나 마크다운 백틱 문장도 포함하지 마세요.
`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: regenerate ? 0.8 : 0.4,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API HTTP Error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return null

  try {
    const parsed = JSON.parse(text)
    if (parsed.status === 'success') {
      return {
        status: 'success',
        term: parsed.term || query,
        definition: parsed.definition,
        analogy: parsed.analogy,
        role: parsed.role,
        source: 'ai',
      }
    } else if (parsed.status === 'typo' && parsed.suggestedTerm) {
      return {
        status: 'typo',
        suggestedTerm: parsed.suggestedTerm,
        source: 'ai',
      }
    } else if (parsed.status === 'irrelevant') {
      return {
        status: 'irrelevant',
        message: `'${query}'은(는) 보안 용어로 보이지 않아요. 다른 용어로 다시 검색해보세요.`,
        source: 'ai',
      }
    }
  } catch (parseErr) {
    console.error('Failed to parse Gemini response JSON:', parseErr)
  }

  return null
}
