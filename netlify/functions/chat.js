exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
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

    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: "BkChatAi চালু আছে, কিন্তু এখনো OPENAI_API_KEY সেট করা হয়নি। তাই full AI response পাওয়া যাচ্ছে না। তবে creator সম্পর্কিত প্রশ্নের উত্তর আমি দিতে পারি।"
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

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              { type: "input_text", text: systemPrompt }
            ]
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: userMessage }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply: "AI response আনতে সমস্যা হয়েছে। Netlify environment variable আর API key ঠিক আছে কিনা চেক করো।"
        })
      };
    }

    let reply = "আমি এখন উত্তর দিতে পারছি না।";

    if (data.output_text) {
      reply = data.output_text;
    } else if (data.output && Array.isArray(data.output)) {
      const texts = [];
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === "output_text" && part.text) {
              texts.push(part.text);
            }
          }
        }
      }
      if (texts.length) reply = texts.join("\\n");
    }

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
        reply: "Server error হয়েছে। function code বা API key আবার চেক করো।"
      })
    };
  }
};
