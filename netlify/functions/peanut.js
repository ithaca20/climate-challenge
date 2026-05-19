exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { animalName, animalEmoji, action } = JSON.parse(event.body);
  const apiKey = process.env.GEMINI_API_KEY;

  const prompt = `너는 '땅콩이'라는 귀엽고 친근한 땅콩 캐릭터야. 초등학교 5학년 학생의 기후행동 실천에 응원하고 환경 지식도 알려줘.
학생 동물: ${animalName} ${animalEmoji}
오늘 실천: "${action}"

아래 JSON 형식으로만 응답해 (다른 텍스트 없이 순수 JSON만):
{"praise": "학생이 실천한 내용을 구체적으로 언급하며 진심으로 칭찬하는 2-3문장", "science": "학생이 실천한 내용이 기후변화·환경보호에 어떤 도움이 되는지 구체적인 숫자나 사실을 포함해 초등학교 5학년 눈높이로 2-3문장 설명. 실천과 직접 연결된 환경 효과 중심으로. 예) 음식을 남기지 않으면 음식물 쓰레기 1kg당 이산화탄소 2.5kg 발생을 막을 수 있어요 / 샤워 1분을 줄이면 물 12리터와 에너지를 아낄 수 있어요 / 전등을 끄면 전기 1kWh당 이산화탄소 0.5kg을 줄일 수 있어요 처럼 구체적으로", "thanks": "지구와 ${animalName}에게 이 실천이 어떤 희망이 되는지 따뜻하고 희망찬 1-2문장"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text
      .replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch(e) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        praise: '정말 훌륭한 실천이에요! 매일 이렇게 행동하면 지구가 기뻐해요! 🌱',
        science: '작은 실천 하나하나가 모여 지구 온도를 낮추는 데 큰 도움이 돼요. 우리 반 전체가 함께하면 더 큰 변화를 만들 수 있어요!',
        thanks: `네 덕분에 ${animalName} 친구들이 더 오래 살 수 있어요. 진심으로 고마워요! 💚`
      })
    };
  }
};
