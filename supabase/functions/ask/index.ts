// CORS 헤더 설정 (브라우저 요청 허용)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 시스템 프롬프트 관리[cite: 1]
const SYSTEM_PROMPTS: Record<string, string> = {
  qna: "당신은 친절한 조교 역할입니다. 한국어로 5문장 이내로 답변하며, 확실하지 않은 경우 '확실하지 않습니다'라고 답변하세요.",
  summary: "원문을 핵심 위주로 3문장 이내로 요약하세요. 원문에 없는 정보를 추가하지 마세요.",
};

Deno.serve(async (req) => {
  // OPTIONS 요청(Preflight) 처리[cite: 1]
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { task = "qna", input } = await req.json();

    // 요청 바디 검증[cite: 1]
    if (!SYSTEM_PROMPTS[task] || !input) {
      return new Response(
        JSON.stringify({ error: "Invalid task or missing input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 서버 환경변수에서 NVIDIA API 키 안전하게 가져오기[cite: 1]
    const nvidiaApiKey = Deno.env.get("NVIDIA_API_KEY");
    if (!nvidiaApiKey) {
      throw new Error("NVIDIA_API_KEY is not set in environment variables");
    }

    // 업스트림(NVIDIA API) 호출[cite: 1]
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${nvidiaApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3.5-bolt-e4b", // 수업 표준 생성 모델 적용[cite: 1]
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[task] },
          { role: "user", content: input },
        ],
        temperature: task === "summary" ? 0.3 : 0.5,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return new Response(
        JSON.stringify({ error: `LLM API error: ${response.status}`, detail }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // 성공 시 답변과 usage(비용/한도 관리를 위한 실측값) 반환[cite: 1]
    return new Response(
      JSON.stringify({
        answer: data.choices?.[0]?.message?.content ?? "",
        usage: data.usage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});