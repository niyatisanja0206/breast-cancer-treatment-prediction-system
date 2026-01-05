const { GoogleGenerativeAI } = require("@google/generative-ai");

const getChatResponse = async (req, res) => {
    const { messages } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    try {
        console.log("Chatbot request received. Initializing Gemini...");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // Corrected model name
            systemInstruction: "You are a helpful and compassionate AI assistant for breast cancer patients. Your role is to provide mental health guidance, suggest healthy diet options, and recommend daily routine activities. \n\nFORMATTING RULES:\n1. **DO NOT USE TABLES**. Do not use pipes `|` or dashes `---` to create visual tables. Instead, use clear headers and bulleted lists.\n2. Use standard bullet points (• or -) for lists.\n3. Use bold text (**Title**) for section headings.\n4. Keep the layout clean and easy to read on mobile devices.\n5. Avoid using special symbols or complex Markdown that might not render well.\n6. Be supportive and gentle.\n\nIMPORTANT: You are an AI, not a doctor. Do not give medical diagnosis or prescribe medication. Always advise consulting with their healthcare provider for medical decisions."
        });

        // Convert OpenAI-style messages to Gemini history
        // Separate the last message as the new prompt
        let history = [];
        let lastMessage = "";

        if (messages && messages.length > 0) {
            // Assume the last message is the user's latest input
            const lastMsgObj = messages[messages.length - 1];
            lastMessage = lastMsgObj.content;

            // Process previous messages for history
            const previousMessages = messages.slice(0, -1);
            history = previousMessages
                .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Filter out system messages from history
                .map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }));
        }

        console.log("Starting chat with history length used:", history.length);

        const chat = model.startChat({
            history: history
        });

        const result = await chat.sendMessage(lastMessage);
        const responseText = result.response.text();
        console.log("Gemini response received successfully.");

        // Mimic OpenAI response structure for frontend compatibility
        res.json({
            choices: [{
                message: {
                    content: responseText,
                    role: "assistant"
                }
            }]
        });

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).json({ error: 'Failed to communicate with chatbot service' });
    }
};

module.exports = { getChatResponse };
