import { NextResponse } from 'next/server';

interface RequestBody {
  text: string;
}

interface ApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const SYSTEM_PROMPT = `你是一个朋友圈文案回应助手，文风参考《舌尖上的中国》或《动物世界》。
请你以一段有画面感、富有隐喻与人情味的"纪录片风格"回应。
语气要深情而克制，不搞笑，简短，又有余韵。`;

export async function POST(request: Request) {
  try {
    const { text } = await request.json() as RequestBody;

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `用户发言：「${text}」`
        }
      ],
      max_tokens: 1688,
      temperature: 0.5,
      stream: false
    };

    const response = await fetch('https://ismaque.org/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-VDMue0uvAmfPhJP4F8OMISwYgowbm6r8jKRDr9ul9mmFSOUI',
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json() as ApiResponse;
    
    // 提取AI的回复内容
    const aiResponse = data.choices[0]?.message?.content || '抱歉，我无法生成回应';

    return NextResponse.json({
      text: aiResponse,
      usage: data.usage
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
} 