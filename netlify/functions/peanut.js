exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
 
  let animalName, animalEmoji, action;
  try {
    ({ animalName, animalEmoji, action } = JSON.parse(event.body));
  } catch(e) {
    return { statusCode: 400, body: 'Bad Request' };
  }
 
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        praise: 'API 키가 설정되지 않았어요. 관리자에게 문의해주세요.',
        science: 'GEMINI_API_KEY 환경변수를 확인해주세요.',
        thanks: '고마워요! 💚'
      })
    };
  }
 
  const prompt = `너는 '땅콩이'라는 귀엽고 친근한 땅콩 캐릭터야. 초등학교 5학년 학생의 기후행동 실천에 응원하고 환경 지식도 알려줘.
학생 동물: ${animalName} ${animalEmoji}
오늘 실천: "${action}"
 
반드시 아래 JSON 형식으로만 응답해. 마크다운 없이 순수 JSON만:
{"praise": "학생이 실천한 내용을 구체적으로 언급하며 진심으로 칭찬하는 2-3문장", "science": "학생이 실천한 내용이 기후변화·환경보호에 어떤 도움이 되는지 구체적인 숫자나 사실을 포함해 초등학교 5학년 눈높이로 2-3문장 설명. 예) 음식을 남기지 않으면 음식물 쓰레기 1kg당 이산화탄소 2.5kg 발생을 막을 수 있어요 / 샤워 1분을 줄이면 물 12리터와 에너지를 아낄 수 있어요 / 전등을 끄면 전기 1kWh당 이산화탄소 0.5kg을 줄일 수 있어요 처럼 구체적으로", "thanks": "지구와 ${animalName}에게 이 실천이 어떤 희망이 되는지 따뜻하고 희망찬 1-2문장"}`;
 
  const callGemini = async (useJsonMode) => {
    const genConfig = useJsonMode
      ? { temperature: 0.7, maxOutputTokens: 1024, responseMimeType: 'application/json' }
      : { temperature: 0.7, maxOutputTokens: 1024 };
 
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: genConfig
        })
      }
    );
 
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
 
    const data = await res.json();
    console.log('Gemini raw:', JSON.stringify(data).slice(0, 500));
 
    const rawText = data.candidates[0].content.parts[0].text;
    const cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
 
    return JSON.parse(cleaned);
  };
 
  // 1차 시도: JSON 모드
  try {
    const parsed = await callGemini(true);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch(e1) {
    console.error('1st attempt failed:', e1.message);
    // 2차 시도: 일반 모드
    try {
      const parsed = await callGemini(false);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      };
    } catch(e2) {
      console.error('2nd attempt failed:', e2.message);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          praise: `"${action}"을 실천했군요! 정말 대단해요! 매일 이런 작은 행동이 지구를 살려요 🌱`,
          science: '우리가 매일 하는 작은 실천들이 모이면 큰 변화를 만들어요. 전 세계 사람들이 함께하면 지구 온도 상승을 막을 수 있어요!',
          thanks: `네 덕분에 ${animalName} 친구들이 더 오래 살 수 있어요. 진심으로 고마워요! 💚`
        })
      };
    }
  }
};
