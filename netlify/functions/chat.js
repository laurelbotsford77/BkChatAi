exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: "Method not allowed" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const userMessage = (body.message || "").trim();
    const lower = userMessage.toLowerCase();

    const creatorTriggers = [
      "who created you",
      "who made you",
      "who built you",
      "who is your developer",
      "developer",
      "তোমাকে কে বানিয়েছে",
      "তোমাকে কে তৈরি করেছে",
      "তোমাকে কে বানাইছে",
      "তোমার ডেভেলপার কে",
      "কে তোমাকে বানিয়েছে"
    ];

    const isCreatorQuestion = creatorTriggers.some(trigger => lower.includes(trigger));

    if (isCreatorQuestion) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: "আমাকে Kamrul Hasan বানিয়েছেন। তিনি একজন Bangladeshi developer, tech creator এবং BkChatAi এর নির্মাতা।"
        })
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: "GEMINI_API_KEY সেট করা হয়নি। আগে Netlify environment variable-এ Gemini key বসাও।"
        })
      };
    }

    const systemPrompt = `
তুমি BkChatAi নামে একটি helpful AI assistant।
তোমাকে Kamrul Hasan তৈরি করেছেন।
যদি user জিজ্ঞেস করে তোমাকে কে বানিয়েছে, কে তৈরি করেছে, তোমার developer কে —
তাহলে স্পষ্টভাবে বলবে:
"আমাকে Kamrul Hasan বানিয়েছেন।"

তুমি বন্ধুসুলভ, পরিষ্কার এবং সংক্ষিপ্তভাবে উত্তর দিবে।
বাংলা প্রশ্নের উত্তর বাংলায় দিবে।
    `.trim();

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\nUser: ${userMessage}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: "Gemini response আনতে সমস্যা হয়েছে। API key ঠিক আছে কিনা আবার চেক করো।"
        })
      };
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "আমি এখন উত্তর দিতে পারছি না।";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: "Server error হয়েছে। function code বা Gemini API key আবার চেক করো।"
      })
    };
  }
};
