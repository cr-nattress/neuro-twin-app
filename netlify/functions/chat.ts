/**
 * @module netlify/functions/chat
 *
 * Netlify Function endpoint that handles chat conversations with a persona.
 *
 * @context
 * - Called by frontend when user sends a message in chat interface
 * - Currently returns mock responses based on message content and persona context
 * - Will integrate with multi-agent backend in future epic (EPIC-06)
 * - Loads persona for context but continues if persona unavailable
 *
 * @endpoint POST /.netlify/functions/chat
 *
 * @dependencies
 * - ./lib/base-handler: Request/response utilities
 * - ./lib/validation: Chat input validation
 * - ./lib/supabase: Persona retrieval for context
 * - ./lib/logger: Structured logging
 * - nanoid: Generates conversation and message IDs
 *
 * @sideeffects
 * - Retrieves persona from Supabase for context (optional)
 * - Logs chat interaction
 * - Generates mock responses based on input patterns
 *
 * @example Request
 * ```json
 * {
 *   "message": "Tell me about yourself",
 *   "persona_id": "persona_abc123def456gh",
 *   "conversation_id": "conv_xyz789",
 *   "history": [
 *     {"role": "user", "content": "Hi"},
 *     {"role": "agent", "content": "Hello! How can I help?"}
 *   ]
 * }
 * ```
 *
 * @example Response (success)
 * ```json
 * {
 *   "success": true,
 *   "response": "That's a great question! Based on my background and experience...",
 *   "conversation_id": "conv_xyz789",
 *   "message_id": "msg_1699000000000_abc123de",
 *   "metadata": {
 *     "tokens_used": 150,
 *     "processing_time_ms": 125,
 *     "agents_involved": ["MockAgent"]
 *   }
 * }
 * ```
 */

import { Handler } from "@netlify/functions";
import {
  createHandler,
  parseJsonBody,
  jsonResponse,
} from "./lib/base-handler";
import { validateInput, ChatMessageSchema } from "./lib/validation";
import { getPersonaFromStorage } from "./lib/supabase";
import { logger } from "./lib/logger";
import { nanoid } from "nanoid";

interface ChatResponse {
  success: boolean;
  response?: string;
  conversation_id?: string;
  message_id?: string;
  error?: string;
  metadata?: {
    tokens_used: number;
    processing_time_ms: number;
    agents_involved?: string[];
  };
}

/**
 * Generates mock response based on message content and persona context.
 *
 * @param {string} message - User message to respond to
 * @param {string} [personaName] - Optional persona name to personalize response
 * @returns {string} Mock agent response
 *
 * @decision Categorizes messages (greeting/question/default) and returns contextual responses
 * with randomized additions to simulate natural variation
 */
function generateMockResponse(message: string, personaName?: string): string {
  const responses: Record<string, string[]> = {
    greeting: [
      `Hi! I'm ${personaName || "here"} to help. What would you like to know about me?`,
      `Hello! I'm ${personaName || "your persona"}. What's on your mind?`,
      `Hey! Great to connect with you. What can I tell you about myself?`,
    ],
    question: [
      "That's a great question! Based on my background and experience, I think...",
      "Interesting question. Let me share my perspective on that...",
      "I've thought about this quite a bit. Here's what I believe...",
    ],
    default: [
      `Thanks for sharing that. As ${personaName || "someone"} with my background, I see it differently...`,
      "That resonates with me. From my experience, I'd say...",
      "I appreciate your point of view. Here's how I tend to approach similar situations...",
    ],
  };

  // Determine response category
  let category = "default";
  if (message.toLowerCase().match(/^(hi|hello|hey|good morning|good evening)/)) {
    category = "greeting";
  } else if (message.includes("?")) {
    category = "question";
  }

  // Pick random response from category
  const categoryResponses = responses[category] || responses.default;
  const baseResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

  // Add some variance
  const additions = [
    " Based on my values and experiences, this matters a lot to me.",
    " It's something I'm passionate about.",
    " This is part of what drives my interest in this field.",
    " I've had to think carefully about this in my career.",
    " This connects to one of my core interests.",
  ];

  const addition = additions[Math.floor(Math.random() * additions.length)];
  return baseResponse + addition;
}

/**
 * Handles chat message requests.
 *
 * @param {Request} request - Web API Request object with chat message payload
 * @returns {Promise<Response>} JSON response with agent response and metadata
 * @throws {ValidationError} If input validation fails (caught by createHandler)
 */
async function handleChat(request: Request): Promise<Response> {
  logger.info("chat function called");
  const startTime = Date.now();

  // Parse request body
  const body = await parseJsonBody(request);
  logger.debug("Chat request received", {
    message: body.message?.substring(0, 50),
    personaId: body.persona_id,
  });

  // Validate input
  const input = validateInput(ChatMessageSchema, body);
  logger.info("Chat input validated", {
    messageLength: input.message.length,
    personaId: input.persona_id,
  });

  // Try to load persona for context (optional)
  let personaName: string | undefined;
  try {
    const persona = await getPersonaFromStorage(input.persona_id);
    personaName = persona.name;
    logger.info("Persona loaded for context", { personaName });
  } catch (error) {
    logger.debug("Could not load persona for context (this is OK)", {
      personaId: input.persona_id,
    });
    // Continue anyway - persona context is optional for mock responses
  }

  // Generate mock response
  logger.info("Generating mock response");
  const conversationId = input.conversation_id || `conv_${nanoid(12)}`;
  const messageId = `msg_${Date.now()}_${nanoid(8)}`;
  const response = generateMockResponse(input.message, personaName);

  const processingTime = Date.now() - startTime;

  logger.info("Mock response generated successfully", {
    conversationId,
    messageId,
    responseLength: response.length,
    processingTime,
  });

  const chatResponse: ChatResponse = {
    success: true,
    response,
    conversation_id: conversationId,
    message_id: messageId,
    metadata: {
      tokens_used: Math.ceil(response.length / 4), // Rough estimate
      processing_time_ms: processingTime + Math.random() * 500, // Add slight variance
      agents_involved: ["MockAgent"],
    },
  };

  return jsonResponse(chatResponse, 200);
}

/**
 * Export handler
 */
export const handler: Handler = createHandler(handleChat);
