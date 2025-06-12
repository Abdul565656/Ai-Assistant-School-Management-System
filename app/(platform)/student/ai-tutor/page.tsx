"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; 
import { getAITutorResponse } from '@/lib/actions/ai.actions'; 
import { toast } from 'sonner';
import { useSession } from 'next-auth/react'; 

interface DisplayMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ServerChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

const getInitials = (name?: string | null, fallback: string = 'U'): string => {
  if (!name) return fallback;
  const parts = name.split(' ');
  if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.[0]?.toUpperCase() || fallback;
};


export default function AITutorPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null); 
  const { data: session } = useSession();

  const studentInitials = getInitials(session?.user?.name, 'S');
  const studentAvatar = session?.user?.image;


  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: DisplayMessage = {
      id: crypto.randomUUID(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);


    const historyForServer: ServerChatMessage[] = [
      ...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.text }]
      })),
      {
        role: 'user',
        parts: [{ text: userMessage.text }]
      }
    ];

    try {
      const aiResponseText = await getAITutorResponse(userMessage.text, historyForServer);

      const aiMessage: DisplayMessage = {
        id: crypto.randomUUID(),
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Error getting AI response:", error);
      toast.error(error.message || "Sorry&lsquo; I couldn&apos;t get a response. Please try again.");
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id)); 
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages]); 

  return (
    <Card className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] flex flex-col shadow-xl border">
      <CardHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Bot className="h-6 w-6 text-primary" /> AI Tutor - EduBot
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full" type="auto">
          <div ref={scrollViewportRef} className="h-full p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Hello {session?.user?.name?.split(' ')[0] || "there"}!</p>
                <p>I&apos;m EduBot&lsquo; your AI Tutor. How can I help you learn today?</p>
                <p className="text-xs mt-2">(e.g.&lsquo; "Explain photosynthesis like I&apos;m 5")</p>          
                </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <Bot size={16} />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] md:max-w-[65%] rounded-xl px-3.5 py-2.5 text-sm shadow-sm break-words ${
                    msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted dark:bg-slate-700 text-foreground rounded-bl-none'
                  }`}
                >
                  {msg.text.split('\n').map((line, index, arr) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < arr.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {msg.sender === 'user' && (
                  <Avatar className="h-8 w-8 border">
                    {studentAvatar ? <AvatarImage src={studentAvatar} alt="User"/> : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {studentInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && messages.length > 0 && ( 
              <div className="flex items-end gap-2.5 justify-start">
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[70%] rounded-xl px-3.5 py-2.5 text-sm shadow-sm bg-muted dark:bg-slate-700 text-foreground rounded-bl-none">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-3 sm:p-4">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            type="text"
            placeholder="Ask EduBot anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1 h-10 text-sm"
            autoComplete="off"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="h-10 w-10">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}