"use client";

import { useState } from "react";
import ChatWindow from "@/components/chatbot/ChatWindow";
import Icon from "@/components/common/Icon";

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-3 right-3 z-50 sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div>
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 rounded-full bg-brand-blue px-3 py-3 text-white shadow-[0_18px_44px_rgba(37,99,235,0.36)] transition hover:-translate-y-0.5 hover:bg-[#163fe0] focus:outline-none focus:ring-4 focus:ring-brand-blue/20 sm:px-4"
          aria-label="Open Robot Assistant"
        >
          <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
            <Icon name="chat" className="h-6 w-6" />
            <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-brand-blue bg-brand-orange" />
          </span>
          <span className="hidden pr-1 text-left sm:block">
            <span className="block text-sm font-semibold leading-4">Robot Assistant</span>
            <span className="block text-xs text-blue-100">Need help?</span>
          </span>
        </button>
      )}
    </div>
  );
}
