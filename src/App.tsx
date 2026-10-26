import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";

function App() { 
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    // 현재세션확인 + 로그인/로그아웃 이벤트 구독
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <button onClick={() => supabase.auth.signInWithOAuth({ provider: "github" })}>
        GitHub로 로그인
      </button>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <p>로그인됨: {session.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>로그아웃</button>
    </div>
  );
}

export default App;