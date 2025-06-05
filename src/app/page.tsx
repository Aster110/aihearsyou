'use client';

import { useState } from 'react';

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface ApiResponse {
  text: string;
  usage: Usage;
  error?: string;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json() as ApiResponse;
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setResponse(data.text);
      setUsage(data.usage);
    } catch (error) {
      setError('生成失败，请稍后重试');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">AI Hears You</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="input" className="block text-sm font-medium text-gray-700">
              输入你想说的话
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="在这里输入你的心情、想法或任何想说的话..."
              className="w-full p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] bg-white shadow-sm"
            />
            <p className="text-sm text-gray-500">
              我会用纪录片风格回应你，让每个字都充满画面感
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '生成中...' : '生成回应'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {response && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">AI回应：</h2>
            <p className="whitespace-pre-wrap text-gray-700">{response}</p>
            
            {usage && (
              <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                <p>Token使用情况：</p>
                <ul className="list-disc list-inside">
                  <li>输入Token: {usage.prompt_tokens}</li>
                  <li>输出Token: {usage.completion_tokens}</li>
                  <li>总计Token: {usage.total_tokens}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
