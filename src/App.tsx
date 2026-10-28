import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화 (기존 설정 활용)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [task, setTask] = useState<'qna' | 'summary'>('qna');
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setAnswer('');

    try {
      // invoke를 사용하면 로그인된 유저의 JWT가 자동 첨부됩니다.
      const { data, error } = await supabase.functions.invoke('ask', {
        body: { task, input },
      });

      if (error) throw error;
      setAnswer(data.answer);
    } catch (err: any) {
      setAnswer(`에러 발생: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2>AI 조교 & 요약 서비스</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>작업 선택: </label>
        <select value={task} onChange={(e) => setTask(e.target.value as 'qna' | 'summary')}>
          <option value="qna">질문하기 (Q&A)</option>
          <option value="summary">요약하기 (Summary)</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <textarea
          rows={4}
          style={{ width: '100%', padding: '0.5rem' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="내용을 입력하세요..."
        />
      </div>

      <button
        onClick={handleAsk}
        disabled={loading || !input.trim()}
        style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
        {loading ? '처리 중...' : '실행하기'}
      </button>

      {answer && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f4f4f4', borderRadius: '4px' }}>
          <h4>결과:</h4>
          <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
        </div>
      )}
    </div>
  );
}