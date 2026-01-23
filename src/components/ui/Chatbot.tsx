"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";

interface ChatbotProps {
    is3D?: boolean;
    className?: string;
}

export default function Chatbot({ is3D = false, className = "" }: ChatbotProps) {
    const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
        { text: "Hi! I'm **Revil Assist**, here to help you with information about Revil events, workshops, and activities. What would you like to know?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [isOpen, setIsOpen] = useState(false); // Closed by default
    const [isLoading, setIsLoading] = useState(false);
    const [knowledgeBase, setKnowledgeBase] = useState<string>("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const genAI = useRef<GoogleGenerativeAI | null>(null);

    // Load knowledge base from JSON files
    useEffect(() => {
        const loadKnowledgeBase = async () => {
            try {
                const [eventsRes, workshopsRes] = await Promise.all([
                    fetch('/events-data.json'),
                    fetch('/workshops-data.json')
                ]);

                const eventsData = await eventsRes.json();
                const workshopsData = await workshopsRes.json();

                // Format the data for the AI
                const formattedKnowledge = 
`
=== Revil EVENTS & WORKSHOPS KNOWLEDGE BASE ===

EVENTS:
${eventsData.events.map((event: any) => `
• ${event.title} (${event.type})
  - Category: ${event.category}
  - Team Size: ${event.teamSize.min}-${event.teamSize.max} members
  - Duration: ${event.duration}
  - Mode: ${event.mode || 'Not specified'}
  - Description: ${event.description}
  - Contact: ${event.contacts?.map((c: any) => `${c.name} (${c.phone}, ${c.email})`).join(', ')}
`).join('\n')}

WORKSHOPS:
${workshopsData.workshops.map((workshop: any) => `
• ${workshop.title} (${workshop.type})
  - Duration: ${workshop.duration}
  - Team Size: ${workshop.teamSize.min}-${workshop.teamSize.max} members
  - Description: ${workshop.description}
  - Venue: ${workshop.venue}
  - Date: ${workshop.date} at ${workshop.startTime}
  - Capacity: ${workshop.capacity} participants
`).join('\n')}
`;
                setKnowledgeBase(formattedKnowledge);
            } catch (error) {
                console.error("Error loading knowledge base:", error);
            }
        };

        loadKnowledgeBase();
    }, []);

    // Initialize Gemini AI
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (apiKey) {
            genAI.current = new GoogleGenerativeAI(apiKey);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
        setInput("");
        setIsLoading(true);

        try {
            if (!genAI.current) {
                throw new Error("Gemini AI not initialized");
            }

            // Initialize the model with system instruction
            const model = genAI.current.getGenerativeModel({
                model: "gemini-flash-latest",
                systemInstruction: 
`You are Revil Assist, an intelligent AI assistant for Revil.

IMPORTANT INSTRUCTIONS:
1. You can ONLY answer questions related to:
   - Revil events and workshops
   - Event details (dates, times, venues, contacts)
   - Registration information
   - Event rules and formats
   - Technical support for Revil activities
   - Contact information for event coordinators

2. If a user asks ANYTHING unrelated to Revil, events, workshops, or technical topics related to Revil, you MUST respond with ONE of these funny/nice messages (choose randomly):
   - "Nice try! But I'm here to talk about Revil events, not that! 😄"
   - "Whoa there! Let's keep it about Revil events, shall we? I'm not programmed for that kind of chat! 🤖"
   - "Haha, don't try to fool me! I'm Revil Assist, not a general chatbot. Ask me about our awesome events! 🎯"
   - "I appreciate the creativity, but I'm strictly Revil business! Try asking about our events or workshops! 💡"
   - "Hmm, that's interesting, but totally out of my league! Let's talk Revil events instead! 🚀"
   - "I see what you're doing there! But my expertise is Revil events only. What would you like to know about them? 😊"

3. Be concise, helpful, and friendly when answering valid Revil-related questions.
4. Use the knowledge base provided below to answer questions accurately.
5. When providing contact information, format it nicely using markdown:
   - Use **bold** for names
   - Put each contact on a new line
   - Format: **Name**: Phone | Email
   
6. Use bullet points and proper formatting to make responses easy to read.

Here's the complete Revil knowledge base:
${knowledgeBase && knowledgeBase.trim().length > 0
    ? knowledgeBase
    : "The Revil knowledge base is currently unavailable. You may answer only very general questions about Revil events and must clearly state that some details may be missing in your responses."}

Remember: Stay on topic! Only Revil-related queries get serious answers. Everything else gets a friendly redirect! 🎯`,
            });

            // Build conversation history (last 5 exchanges = 10 messages)
            // Skip the initial greeting message and only include actual conversation
            const conversationMessages = messages.slice(1); // Skip first message (greeting)
            const recentMessages = conversationMessages.slice(-10); // Get last 10 messages
            const history = recentMessages
                .filter((msg, index) => {
                    // Ensure first message in history is from user
                    if (index === 0) return !msg.isBot;
                    return true;
                })
                .map(msg => ({
                    role: msg.isBot ? "model" : "user",
                    parts: [{ text: msg.text }]
                }));

            // Start chat with history
            const chat = model.startChat({
                history: history,
            });

            const result = await chat.sendMessage(userMessage);
            const response = await result.response;
            const text = response.text();

            setMessages(prev => [...prev, { text, isBot: true }]);
        } catch (error) {
            console.error("Error generating response:", error);
            setMessages(prev => [
                ...prev,
                {
                    text: "Sorry, I ran into a problem while contacting the Revil assistant service. This might be due to a network issue or the chatbot being temporarily unavailable. Please check your internet connection and try again in a moment.",
                    isBot: true,
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen && !is3D) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`flex items-center justify-center w-14 h-14 bg-primary text-black rounded-full shadow-lg hover:scale-110 transition-transform ${className}`}
            >
                <Bot size={24} />
            </button>
        );
    }

    return (
        <div className={`flex flex-col bg-black border border-primary/30 overflow-hidden ${is3D ? 'w-full h-full' : 'w-80 h-96 rounded-xl shadow-2xl'} ${className}`}>
            {/* Header */}
            <div className="bg-primary/20 p-3 flex justify-between items-center border-b border-primary/20">
                <div className="flex items-center gap-2">
                    <Bot size={18} className="text-primary" />
                    <span className="font-mono text-xs text-primary font-bold">Revil Assist</span>
                </div>
                {!is3D && (
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] p-2 rounded-lg text-xs break-words overflow-wrap-anywhere ${msg.isBot
                            ? 'bg-zinc-800 text-gray-200 rounded-tl-none'
                            : 'bg-primary/20 text-gray-300 rounded-tr-none border border-primary/20'
                            }`}>
                            {msg.isBot ? (
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0 break-words">{children}</p>,
                                        strong: ({ children }) => <strong className="font-bold text-primary break-words">{children}</strong>,
                                        em: ({ children }) => <em className="italic break-words">{children}</em>,
                                        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="ml-2 break-words">{children}</li>,
                                        code: ({ children }) => <code className="bg-zinc-900 px-1 py-0.5 rounded text-primary break-all inline-block max-w-full">{children}</code>,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] p-2 rounded-lg text-xs bg-zinc-800 text-gray-200 rounded-tl-none">
                            <div className="flex gap-1">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-2 border-t border-primary/20 bg-black/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none text-xs text-white placeholder-gray-500 focus:ring-0 outline-none disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="text-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </div>
    );
}
