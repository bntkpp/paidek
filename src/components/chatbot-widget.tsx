"use client";

import { useState, FormEvent, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { MarkdownMessage } from "@/components/markdown-message";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatbotWidgetProps {
  courseId?: string;
  courseName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isMobile?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatbotWidget({ courseId, courseName, isOpen: externalIsOpen, onOpenChange, isMobile = false }: ChatbotWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Usar estado externo si está disponible, sino usar interno
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const USE_DEBUG_MODE = false;

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/chat${USE_DEBUG_MODE ? "?mode=debug" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          courseId: courseId || null,
          courseName: courseName || "Asistente General",
        }),
      });

      // Si viene error 4xx/5xx, intenta leer el JSON para mostrar mensaje real
      if (!response.ok) {
        let detail = "Error al obtener respuesta";
        try {
          const j = await response.json();
          if (j?.error) detail = j.error;
        } catch {}
        throw new Error(detail);
      }

      // Modo debug: JSON con { text }
      if (USE_DEBUG_MODE) {
        const { text } = await response.json();
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: text || "" },
        ]);
        return;
      }

      // Streaming de texto plano
      if (!response.body) throw new Error("Respuesta vacía");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantMessageId, role: "assistant", content: "" },
      ]);

      if (reader) {
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setMessages((prev) =>
            prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: accumulated } : msg))
          );
        }
      }
    } catch (error: any) {
      let errorMessage = "Ha ocurrido un error. Por favor, intenta nuevamente.";
      
      if (error?.message?.includes("límite temporal") || error?.message?.includes("quota")) {
        errorMessage = "⏳ El servicio de chat está temporalmente saturado. Por favor, espera unos minutos e intenta de nuevo.";
      } else if (error?.message) {
        errorMessage = `${error.message}`;
      }
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, courseId, courseName, USE_DEBUG_MODE]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const chatContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-4 flex-shrink-0 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <CardTitle className="text-base font-semibold">
            {courseName ? `${courseName}` : "Asistente Virtual"}
          </CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-muted/20 to-background">
        {messages.length === 0 && (
          <div className="flex justify-start gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src="/bot-avatar.png" />
              <AvatarFallback className="bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
              <p>Hola soy Paidek 👋, estoy aquí para ayudarte</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start gap-3"}`}>
            {msg.role === "assistant" && (
              <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                <AvatarImage src="/bot-avatar.png" />
                <AvatarFallback className="bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
            )}
            
            {msg.role === "assistant" ? (
              <div className="bg-muted/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[80%]">
                <MarkdownMessage content={msg.content} />
              </div>
            ) : (
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm max-w-[85%]">
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src="/bot-avatar.png" />
              <AvatarFallback className="bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted/80 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <div className="p-3 border-t flex-shrink-0 bg-background/95 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading}
            autoComplete="off"
            className="rounded-full border-2 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()} 
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );

  // Si es móvil y está controlado externamente, solo mostrar Sheet
  if (isMobile && onOpenChange) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-full sm:w-96 p-0 flex flex-col">
          <div className="flex flex-col h-full">
            {chatContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop - botón flotante y card
  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 z-30"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[550px] shadow-2xl z-30 flex flex-col overflow-hidden border-2">
          {chatContent}
        </Card>
      )}
    </>
  );
}
