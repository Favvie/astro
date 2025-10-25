"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";

interface Message {
  text: string;
  senderAddress: string;
  displayName: string;
  timestamp: string;
  hederaSequenceNumber: number;
  hederaTimestamp: string;
}

interface ChatTabProps {
  topicId: string | undefined;
  connectedAddress: `0x${string}` | undefined;
}

export function ChatTab({ topicId, connectedAddress }: ChatTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // const [lastSequenceNumber, setLastSequenceNumber] = useState(0);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages from Hedera
  const fetchMessages = async () => {
    if (!topicId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/get-hedera-messages?topicId=${topicId}&limit=100`);

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);

      // // Track latest sequence number to detect new messages
      // if (data.messages.length > 0) {
      //   setLastSequenceNumber(data.messages[data.messages.length - 1].hederaSequenceNumber);
      // }

      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [topicId]);

  // Polling - fetch new messages every 2.5 seconds
  useEffect(() => {
    if (!topicId) return;

    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [topicId]);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !topicId || !connectedAddress) {
      return;
    }

    setIsSending(true);
    try {
      const displayName = `Member #${connectedAddress.slice(2, 6).toUpperCase()}`;

      const response = await fetch("/api/send-hedera-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicId,
          messageText: inputValue.trim(),
          senderAddress: connectedAddress,
          displayName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Clear input on success
      setInputValue("");
      setError(null);

      // Fetch messages again to get the new message
      await fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timestamp;
    }
  };

  // const formatAddress = (address: string) => {
  //   return `${address.slice(0, 6)}...${address.slice(-4)}`;
  // };

  return (
    <div className="flex flex-col h-screen max-h-96 space-y-4">
      {/* Messages Container */}
      <Card className="bg-[#19242a] border-[#3e545f] flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="space-y-4">
            {/* Loading skeleton bubbles - Left side (other user) */}
            <div className="flex justify-start">
              <div className="flex flex-col items-end">
                <div className="text-xs opacity-75 mb-1 h-3 bg-[#3a4a3a] rounded w-20 animate-pulse"></div>
                <div className="max-w-xs rounded-lg p-3 bg-[#11181C] border border-[#24353d]">
                  <div className="space-y-2">
                    <div className="h-3 bg-[#3a4a3a] rounded w-48 animate-pulse"></div>
                    <div className="h-3 bg-[#3a4a3a] rounded w-40 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-xs opacity-60 mt-2 h-2 bg-[#3a4a3a] rounded w-12 animate-pulse"></div>
              </div>
            </div>

            {/* Loading skeleton bubbles - Right side (current user) */}
            <div className="flex justify-end">
              <div className="flex flex-col items-end">
                <div className="text-xs opacity-75 mb-1 h-3 bg-[#3a4a3a] rounded w-16 animate-pulse"></div>
                <div className="max-w-xs rounded-lg p-3 bg-[#546054b0]">
                  <div className="space-y-2">
                    <div className="h-3 bg-[#3a3f3a] rounded w-56 animate-pulse"></div>
                    <div className="h-3 bg-[#3a3f3a] rounded w-48 animate-pulse"></div>
                  </div>
                </div>
                <div className="text-xs opacity-60 mt-2 h-2 bg-[#3a4a3a] rounded w-12 animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Be the first to chat!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.senderAddress.toLowerCase() === connectedAddress?.toLowerCase();

              return (
                <div
                  key={`${message.hederaSequenceNumber}-${index}`}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col items-end">
                    <div className="text-xs opacity-75 mb-1">{isCurrentUser ? "You" : message.displayName}</div>
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        isCurrentUser
                          ? "bg-[#8daa98] text-[#11181C]"
                          : "bg-[#11181C] border border-[#24353d] text-white"
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                    </div>
                    <div className="text-xs opacity-60 mt-1">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card>

      {/* Error message */}
      {error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="Type a message..."
          disabled={isSending}
          className="flex-1 bg-[#11181C] border border-[#24353d] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#8daa98] disabled:opacity-50"
        />
        <Button
          type="submit"
          disabled={isSending || !inputValue.trim()}
          className="bg-[#8daa98] text-[#11181C] hover:bg-[#a4c9b5] font-semibold px-4 py-2 flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>

      {/* Powered by Hedera */}
      <div className="text-center text-xs text-gray-500">
        Powered by <span className="text-[#8daa98] font-semibold">Hedera Consensus Service</span>
      </div>
    </div>
  );
}
