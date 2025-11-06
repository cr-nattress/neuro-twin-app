/**
 * @module hooks/useChat
 *
 * React hook for managing chat conversation with a persona.
 *
 * @context
 * - Used by chat page to interact with persona via chat function
 * - Maintains local message history and typing indicator
 * - Sends last 10 messages as context to maintain conversation continuity
 *
 * @dependencies
 * - react (useState, useCallback)
 * - @/types/persona: Chat types (ChatMessage, ChatRequest, ChatResponse)
 * - @/lib/api (getApiBaseUrl): API URL configuration
 *
 * @exports useChat: Hook that takes personaId and returns chat state/methods
 *
 * @example
 * ```typescript
 * const { messages, isTyping, sendMessage, clearConversation } = useChat(personaId);
 *
 * await sendMessage("Hello, tell me about yourself");
 * ```
 */

import { useState, useCallback } from "react";
import { ChatMessage, ChatRequest, ChatResponse } from "@/types/persona";
import { getApiBaseUrl } from "@/lib/api";
import { createApiLogger } from "@/lib/api-logger";

/**
 * Return type for useChat hook.
 *
 * @interface UseChatReturn
 * @property {ChatMessage[]} messages - Array of user and agent messages
 * @property {boolean} isTyping - True while waiting for agent response
 * @property {Function} sendMessage - Async function to send a message
 * @property {Function} clearConversation - Resets all messages and conversation ID
 * @property {Function} exportConversation - Downloads conversation as JSON file
 */
interface UseChatReturn {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (content: string) => Promise<boolean>;
  clearConversation: () => void;
  exportConversation: () => void;
}

/**
 * React hook for chat conversation management.
 *
 * @param {string | null} personaId - ID of persona to chat with
 * @returns {UseChatReturn} Chat state and methods
 *
 * @sideeffects
 * - Makes network requests to chat function
 * - Downloads JSON file when exportConversation is called
 *
 * @decision Sends last 10 messages as context to balance API cost vs. conversation
 * quality. More context = higher token cost but better continuity.
 */
export function useChat(personaId: string | null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      const logger = createApiLogger("sendMessage", "/.netlify/functions/chat");

      if (!personaId || !content.trim()) {
        logger.logStep("Message validation failed", {
          hasPersonaId: !!personaId,
          hasContent: !!content.trim(),
        });
        return false;
      }

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg_${Date.now()}_user`,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      logger.logStep("Adding user message to state", {
        messageId: userMessage.id,
        messageLength: content.length,
      });

      // Add user message to state
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      try {
        // Prepare request
        const request: ChatRequest = {
          message: content.trim(),
          persona_id: personaId,
          conversation_id: conversationId,
          history: messages.slice(-10), // Send last 10 messages for context
        };

        logger.logStep("Prepared chat request", {
          messageLength: request.message.length,
          historyLength: request.history?.length || 0,
          hasConversationId: !!conversationId,
        });

        // Call chat API
        const baseUrl = getApiBaseUrl();
        const url = `${baseUrl}/.netlify/functions/chat`;

        logger.logRequest({
          url,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: request,
          timestamp: new Date().toISOString(),
        });

        logger.logStep("Sending chat request to Netlify function");

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        logger.logStep("Chat API response received", {
          status: response.status,
          statusText: response.statusText,
        });

        if (!response.ok) {
          logger.logStep("Response not OK, attempting to parse error");
          let errorData: any = {};
          try {
            errorData = await response.json();
          } catch (parseError) {
            logger.logStep("Could not parse error response as JSON");
          }

          const error = new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
          logger.logError(error);

          throw error;
        }

        logger.logStep("Parsing response JSON");
        const data: ChatResponse = await response.json();

        logger.logResponse({
          status: response.status,
          statusText: response.statusText,
          body: {
            success: data.success,
            responseLength: data.response?.length,
            hasConversationId: !!data.conversation_id,
          },
          duration: 0,
          timestamp: new Date().toISOString(),
        });

        if (data.success && data.response) {
          logger.logStep("Chat response successful", {
            responseLength: data.response.length,
          });

          // Store conversation ID if provided
          if (data.conversation_id) {
            logger.logStep("Updating conversation ID", {
              conversationId: data.conversation_id,
            });
            setConversationId(data.conversation_id);
          }

          // Create agent message
          const agentMessage: ChatMessage = {
            id: data.message_id || `msg_${Date.now()}_agent`,
            role: "agent",
            content: data.response,
            timestamp: new Date().toISOString(),
            metadata: data.metadata,
          };

          logger.logStep("Adding agent message to state", {
            messageId: agentMessage.id,
            messageLength: data.response.length,
          });

          // Add agent message to state
          setMessages((prev) => [...prev, agentMessage]);

          logger.logStep("Chat message exchange completed successfully");
          return true;
        } else {
          const error = new Error(data.error || "Failed to get response");
          logger.logError(error);
          throw error;
        }
      } catch (error: unknown) {
        logger.logError(error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        logger.logStep("Chat failed", { errorMessage });

        return false;
      } finally {
        setIsTyping(false);
      }
    },
    [personaId, conversationId, messages]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
  }, []);

  const exportConversation = useCallback(() => {
    if (messages.length === 0) return;

    const conversationData = {
      persona_id: personaId,
      conversation_id: conversationId,
      messages,
      exported_at: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(conversationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `conversation-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [messages, personaId, conversationId]);

  return {
    messages,
    isTyping,
    sendMessage,
    clearConversation,
    exportConversation,
  };
}
