import { NextResponse } from 'next/server';

interface RequestBody {
  text: string;
  stream?: boolean;
}

interface ApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message?: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
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
    const { text, stream = false } = await request.json() as RequestBody;

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
      stream
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

    if (stream) {
      // 设置流式响应的headers
      const headers = new Headers();
      headers.set('Content-Type', 'text/event-stream');
      headers.set('Cache-Control', 'no-cache');
      headers.set('Connection', 'keep-alive');

      // 创建流式响应
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              // 将数据块转换为文本
              const chunk = new TextDecoder().decode(value);
              controller.enqueue(new TextEncoder().encode(chunk));
            }
          } catch (error) {
            console.error('Stream error:', error);
            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        },
      });

      return new Response(stream, { headers });
    } else {
      // 非流式响应
      const data = await response.json() as ApiResponse;
      const aiResponse = data.choices[0]?.message?.content || '抱歉，我无法生成回应';

      return NextResponse.json({
        text: aiResponse,
        usage: data.usage
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '生成失败，请稍后重试' },
      { status: 500 }
    );
  }
} 