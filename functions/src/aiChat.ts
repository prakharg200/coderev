import * as functions from "firebase-functions";

/**
 * AI Chat request payload
 */
interface AiChatRequest {
    message: string;
    context?: {
        fileName: string;
        code: string;
        lineRange: [number, number];
    };
    history: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * AI Chat response payload
 */
interface AiChatResponse {
    message: string;
    error?: string;
}

/**
 * Helper function to delay execution
 */
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a Gemini API call with retry logic and exponential backoff
 */
async function callGeminiWithRetry(
    apiKey: string,
    contents: Array<{ role: string; parts: Array<{ text: string }> }>,
    systemInstruction: string,
    maxRetries: number = 3
): Promise<{ success: boolean; message?: string; error?: string }> {
    // Use gemini-2.0-flash - stable and available model
    const model = "gemini-2.0-flash";
    const baseDelay = 2000; // 2 seconds initial delay

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents,
                        systemInstruction: {
                            parts: [{ text: systemInstruction }],
                        },
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1000,
                        },
                    }),
                }
            );

            if (response.ok) {
                const result = await response.json();
                const assistantMessage = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (assistantMessage) {
                    return { success: true, message: assistantMessage };
                }
                return { success: false, error: "No response from Gemini" };
            }

            // Handle rate limiting (429)
            if (response.status === 429) {
                if (attempt < maxRetries) {
                    const waitTime = baseDelay * Math.pow(2, attempt); // Exponential backoff
                    console.log(`Rate limited. Retry ${attempt + 1}/${maxRetries} after ${waitTime}ms`);
                    await delay(waitTime);
                    continue;
                }
                // All retries exhausted
                return {
                    success: false,
                    error: "rate_limited",
                };
            }

            // Other errors
            const errorText = await response.text();
            console.error(`Gemini API error (${response.status}):`, errorText);
            return { success: false, error: `API error: ${response.status}` };
        } catch (error: unknown) {
            console.error("Network error:", error);
            if (attempt < maxRetries) {
                const waitTime = baseDelay * Math.pow(2, attempt);
                await delay(waitTime);
                continue;
            }
            return { success: false, error: "Network error" };
        }
    }

    return { success: false, error: "Max retries exceeded" };
}

/**
 * Cloud Function to handle AI chat requests.
 * Uses Google Gemini API to generate responses about code.
 */
export const aiChat = functions.https.onCall(
    async (
        request: functions.https.CallableRequest<AiChatRequest>
    ): Promise<AiChatResponse> => {
        const data = request.data;

        // Get API key from environment variable
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn("Gemini API key not configured");
            return {
                message: `I'm an AI assistant ready to help with code review, but I'm not currently configured.

**To enable AI responses:**
1. Set the \`GEMINI_API_KEY\` environment variable in \`functions/.env\`
2. Restart the Firebase emulators

For now, I'll acknowledge your question: "${data.message.substring(0, 50)}..."

${data.context ? `You're looking at code from **${data.context.fileName}** (lines ${data.context.lineRange[0]}-${data.context.lineRange[1]}).` : ""}`,
            };
        }

        // Build the system instruction
        let systemInstruction = `You are a helpful code review assistant. The user is reviewing code and may ask questions about it.

Provide concise, helpful responses. Focus on code review aspects like:
- Potential bugs or issues
- Best practices
- Code clarity and maintainability
- Performance considerations

Keep responses focused and practical.`;

        // Add code context if provided
        if (data.context) {
            systemInstruction += `

Current file: ${data.context.fileName}
Selected code (lines ${data.context.lineRange[0]}-${data.context.lineRange[1]}):
\`\`\`
${data.context.code}
\`\`\``;
        }

        // Build contents array for Gemini
        const contents = [
            ...data.history.slice(-6).map((m) => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }],
            })),
            { role: "user", parts: [{ text: data.message }] },
        ];

        // Call Gemini with retry logic
        const result = await callGeminiWithRetry(apiKey, contents, systemInstruction);

        if (result.success && result.message) {
            return { message: result.message };
        }

        // Handle rate limiting specifically
        if (result.error === "rate_limited") {
            return {
                message: `⏳ **Rate limit reached**

The Gemini API free tier has limited requests per minute. Please wait a moment and try again.

**Tips:**
- Wait 30-60 seconds before your next question
- The free tier allows ~10-15 requests per minute

Your question was: "${data.message.substring(0, 50)}..."`,
                error: "Rate limit exceeded - please wait and try again",
            };
        }

        return {
            message: "Sorry, I encountered an error processing your request. Please try again.",
            error: result.error,
        };
    }
);
