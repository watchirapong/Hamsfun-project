'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

// Component to render text with clickable links
function MessageWithLinks({ text, onLinkClick }: { text: string; onLinkClick?: () => void }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onLinkClick) {
      onLinkClick();
    }
  };
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
              style={{ fontFamily: "'Noto Sans Thai', monospace", imageRendering: 'pixelated' }}
              onClick={handleLinkClick}
            >
              click here
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

// Typing effect component for Ultraman messages with link support
function TypingText({ text, speed = 30, onLinkClick, skipTyping = false }: { text: string; speed?: number; onLinkClick?: () => void; skipTyping?: boolean }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (skipTyping) {
      // Skip typing animation - show full text immediately
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, skipTyping]);

  return (
    <span>
      <MessageWithLinks text={displayedText} onLinkClick={onLinkClick} />
      {isTyping && <span className="animate-pulse">|</span>}
    </span>
  );
}

/**
 * DIALOG CONFIGURATION - How to Set Up Dialogs
 * 
 * To add/edit dialogs for each Earth, modify the DIALOG_CONFIG object below.
 * 
 * Structure:
 * {
 *   [Earth Number]: {
 *     initialMessages: [
 *       { sender: 'ultraman' | 'player', text: 'Your message here', imageUrl?: 'path/to/image.png' }
 *     ],
 *     unlocksPlanet: [Next Earth Number], // Optional: unlocks this Earth after player sends message
 *     autoCloseDelay: [milliseconds] // Optional: auto-close chat after this delay (default: 2000)
 *   }
 * }
 * 
 * Examples:
 * - Single Ultraman message: [{ sender: 'ultraman', text: 'Hello!' }]
 * - Message with image: [{ sender: 'ultraman', text: 'Check this out!', imageUrl: '/path/to/image.png' }]
 * - Image only: [{ sender: 'ultraman', text: '', imageUrl: '/path/to/image.png' }]
 * - Multiple messages: [{ sender: 'ultraman', text: 'First' }, { sender: 'player', text: 'Second' }]
 * - No unlock: Remove 'unlocksPlanet' property
 * - No auto-close: Set 'autoCloseDelay' to 0 or remove it
 */
const DIALOG_CONFIG = {
  1: { // Earth 1 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'โย่ว นายมาที่โลกของเราใช่มั้ย' },
      { sender: 'ultraman' as const, text: 'ฉันชื่อ Ultraman และฉันต้องการความช่วยเหลือจากคุณ' },
      { sender: 'ultraman' as const, text: 'ช่วยปกป้องโลกของเราจากภัยร้ายด้วยนะ!' },
      { sender: 'ultraman' as const, text: 'ตอนนี้นายจะต้องเข้า Unity และ กด ลิงค์นี้ซะ https://unity.com/download' },
      { sender: 'ultraman' as const, text: 'ถ้าโหลดเสร็จแล้วพิมพ์มาด้วยว่าเสร็จแล้ว' }
    ],
    responseMessages: [ // Messages shown after player sends a message
      { sender: 'ultraman' as const, text: 'ดีมาก! ขอบคุณที่ทำตามคำแนะนำ' },
      { sender: 'ultraman' as const, text: 'ตอนนี้คุณพร้อมที่จะไปยัง Earth 2 แล้ว!' },
      { sender: 'ultraman' as const, text: 'ดีมาก!', imageUrl: '/Asset/Page2/big-brain.gif' }
    ],
    unlocksPlanet: 2, // Unlocks Earth 2 after response messages are shown
    autoCloseDelay: 5000 // Auto-close chat after 2 seconds
  },
  2: { // Earth 2 Dialog (when unlocked)
    initialMessages: [
      { sender: 'ultraman' as const, text: 'ยินดีด้วย! คุณปลดล็อก Earth 2 แล้ว' },
      { sender: 'ultraman' as const, text: 'ตอนนี้คุณต้องเรียนรู้เกี่ยวกับ Unity Editor' },
      { sender: 'ultraman' as const, text: 'ลองสร้าง Scene ใหม่และเพิ่ม GameObject ดูสิ' }
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'ดีมาก! คุณกำลังเรียนรู้ได้เร็วมาก' },
      { sender: 'ultraman' as const, text: 'ตอนนี้คุณพร้อมสำหรับ Earth 3 แล้ว!' }
    ],
    unlocksPlanet: 3,
    autoCloseDelay: 3000
  },
  3: { // Earth 3 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'ยินดีต้อนรับสู่ Earth 3!' },
      { sender: 'ultraman' as const, text: 'ที่นี่คุณจะได้เรียนรู้เกี่ยวกับ Components และ Scripts' },
      { sender: 'ultraman' as const, text: 'ลองสร้าง C# Script และ attach มันกับ GameObject ดูสิ' },
      { sender: 'ultraman' as const, text: 'นี่คือลิงค์สำหรับเรียนรู้เพิ่มเติม https://docs.unity3d.com/Manual/CreatingAndUsingScripts.html' }
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'เยี่ยมเลย! คุณเข้าใจ Components แล้ว' },
      { sender: 'ultraman' as const, text: 'ต่อไปเราจะไปที่ Earth 4 เพื่อเรียนรู้ Physics!' }
    ],
    unlocksPlanet: 4,
    autoCloseDelay: 3000
  },
  4: { // Earth 4 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'Earth 4! ที่นี่คุณจะได้เรียนรู้ Physics System' },
      { sender: 'ultraman' as const, text: 'ลองเพิ่ม Rigidbody component ให้ GameObject ดู' },
      { sender: 'ultraman' as const, text: 'และทดสอบการทำงานของ Gravity และ Collision' },
      { sender: 'ultraman' as const, text: 'นี่คือตัวอย่างที่ดี https://learn.unity.com/tutorial/introduction-to-physics' }
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'สุดยอด! คุณเข้าใจ Physics แล้ว' },
      { sender: 'ultraman' as const, text: 'Earth 5 จะสอนคุณเกี่ยวกับ Animation!' }
    ],
    unlocksPlanet: 5,
    autoCloseDelay: 3000
  },
  5: { // Earth 5 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'Earth 5! เวลาของ Animation' },
      { sender: 'ultraman' as const, text: 'ลองสร้าง Animation Clip และใช้ Animator Controller' },
      { sender: 'ultraman' as const, text: 'คุณสามารถทำให้ตัวละครเคลื่อนไหวได้ด้วยระบบนี้' },
      { sender: 'ultraman' as const, text: 'เรียนรู้เพิ่มเติมได้ที่ https://docs.unity3d.com/Manual/AnimationSection.html' }
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'ยอดเยี่ยม! คุณเก่งเรื่อง Animation แล้ว' },
      { sender: 'ultraman' as const, text: 'สุดท้ายแล้ว! ไปที่ Earth 6 เพื่อเรียนรู้ UI System!' }
    ],
    unlocksPlanet: 6,
    autoCloseDelay: 3000
  },
  6: { // Earth 6 Dialog (Final)
    initialMessages: [
      { sender: 'ultraman' as const, text: 'Earth 6! โลกสุดท้ายแล้ว!' },
      { sender: 'ultraman' as const, text: 'ที่นี่คุณจะได้เรียนรู้ UI System ของ Unity' },
      { sender: 'ultraman' as const, text: 'ลองสร้าง Canvas และเพิ่ม Button, Text, Image ดูสิ' },
      { sender: 'ultraman' as const, text: 'UI System จะช่วยให้คุณสร้างเกมที่สวยงามได้' },
      { sender: 'ultraman' as const, text: 'เรียนรู้เพิ่มเติม: https://docs.unity3d.com/Manual/UISystem.html' }
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: '🎉 ยินดีด้วย! คุณสำเร็จแล้ว!' },
      { sender: 'ultraman' as const, text: 'คุณได้เรียนรู้พื้นฐานของ Unity ทั้งหมดแล้ว' },
      { sender: 'ultraman' as const, text: 'ตอนนี้คุณพร้อมที่จะสร้างเกมของคุณเองได้แล้ว!' },
      { sender: 'ultraman' as const, text: 'ขอบคุณที่ร่วมเดินทางกับเรา! 🚀' }
    ],
    // No unlocksPlanet - this is the final Earth
    autoCloseDelay: 4000
  },
};

export default function Page2() {
  const [showChat, setShowChat] = useState(false);
  const [currentEarth, setCurrentEarth] = useState<number | null>(null);
  const [unlockedPlanets, setUnlockedPlanets] = useState([1]); // Earth 1 is unlocked by default
  const [messages, setMessages] = useState<Array<{ id: number; sender: 'ultraman' | 'player'; text: string; imageUrl?: string }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dialogMessages, setDialogMessages] = useState<Array<{ sender: 'ultraman' | 'player'; text: string; imageUrl?: string }>>([]);
  const [shownDialogs, setShownDialogs] = useState<Set<number>>(new Set()); // Track which dialogs have been shown
  const [skipTyping, setSkipTyping] = useState<{ [key: number]: boolean }>({}); // Track if typing should be skipped
  const [chatHistory, setChatHistory] = useState<{ [key: number]: Array<{ id: number; sender: 'ultraman' | 'player'; text: string; imageUrl?: string }> }>({}); // Store full chat history for each Earth
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isPlanetUnlocked = (planetNumber: number) => {
    return unlockedPlanets.includes(planetNumber);
  };

  const hasUrl = (text: string): boolean => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return urlRegex.test(text);
  };

  const showNextMessage = (index: number, messagesToShow: Array<{ sender: 'ultraman' | 'player'; text: string; imageUrl?: string }>, earthNumber: number) => {
    if (index < messagesToShow.length) {
      const msg = messagesToShow[index];
      
      // Skip empty messages (unless they have an image)
      if ((!msg.text || msg.text.trim() === '') && !msg.imageUrl) {
        setCurrentMessageIndex(index + 1);
        // Continue to next message immediately if current is empty
        if (index + 1 < messagesToShow.length) {
          setTimeout(() => {
            showNextMessage(index + 1, messagesToShow, earthNumber);
          }, 100);
        }
        return;
      }
      
      setMessages(prev => {
        const newMessages = [...prev, {
          id: prev.length + 1,
          sender: msg.sender,
          text: msg.text || '',
          imageUrl: (msg as any).imageUrl
        }];
        
        // Update chat history when showing initial messages - use the passed earthNumber
        setChatHistory(prevHistory => ({
          ...prevHistory,
          [earthNumber]: newMessages
        }));
        
        return newMessages;
      });
      setCurrentMessageIndex(index + 1);
      
      // If this message has a URL, stop automatic progression
      // Otherwise, continue to next message after delay
      if (msg.text && !hasUrl(msg.text) && index + 1 < messagesToShow.length) {
        setTimeout(() => {
          showNextMessage(index + 1, messagesToShow, earthNumber);
        }, 2000); // 2 second delay
      } else if (msg.imageUrl && !msg.text && index + 1 < messagesToShow.length) {
        // If message only has image, continue after delay
        setTimeout(() => {
          showNextMessage(index + 1, messagesToShow, earthNumber);
        }, 2000);
      }
    }
  };

  const handleEarthClick = (earthNumber: number) => {
    if (!isPlanetUnlocked(earthNumber)) return;
    
    // Ensure we're using the correct Earth number
    const clickedEarth = earthNumber;
    
    const dialog = DIALOG_CONFIG[clickedEarth as keyof typeof DIALOG_CONFIG];
    if (!dialog) {
      console.error(`No dialog configuration found for Earth ${clickedEarth}`);
      return;
    }
    
    // Reset state and set current Earth first
    setCurrentEarth(clickedEarth);
    const messagesToShow = dialog.initialMessages;
    setDialogMessages(messagesToShow); // Store all dialog messages
    
    // Check if this dialog has been shown before
    const hasBeenShown = shownDialogs.has(clickedEarth);
    
    if (hasBeenShown) {
      // If already shown, restore full chat history if it exists
      setSkipTyping(prev => ({ ...prev, [clickedEarth]: true }));
      
      // Ensure we're restoring the correct Earth's history
      if (chatHistory[clickedEarth] && chatHistory[clickedEarth].length > 0) {
        // Restore full conversation history including player messages
        setMessages(chatHistory[clickedEarth]);
        setCurrentMessageIndex(chatHistory[clickedEarth].length);
      } else {
        // Fallback: show initial messages if no history exists
        const allMessages = messagesToShow
          .filter(msg => (msg.text && msg.text.trim() !== '') || (msg as any).imageUrl)
          .map((msg, index) => ({
            id: index + 1,
            sender: msg.sender,
            text: msg.text || '',
            imageUrl: (msg as any).imageUrl
          }));
        setMessages(allMessages);
        setCurrentMessageIndex(messagesToShow.length);
      }
      setShowChat(true);
    } else {
      // First time showing - use typing animation
      setSkipTyping(prev => ({ ...prev, [clickedEarth]: false }));
      setMessages([]); // Clear previous messages
      setCurrentMessageIndex(0); // Reset message index
      setShownDialogs(prev => new Set(prev).add(clickedEarth)); // Mark as shown
      setShowChat(true);
      
      // Start showing messages automatically with typing
      if (messagesToShow.length > 0) {
        // Use setTimeout to ensure chat is visible before messages start
        // Use a closure to capture the correct Earth number
        setTimeout(() => {
          // Double-check currentEarth matches clickedEarth
          setCurrentEarth(current => {
            if (current !== clickedEarth) {
              return clickedEarth;
            }
            return clickedEarth;
          });
          showNextMessage(0, messagesToShow, clickedEarth);
        }, 100);
      }
    }
  };

  const handleLinkClick = () => {
    if (currentEarth && dialogMessages.length > currentMessageIndex) {
      // Show next message immediately when link is clicked
      const nextMessage = dialogMessages[currentMessageIndex];
      if (nextMessage) {
        // Check if this message is already displayed
        const messageExists = messages.some(m => m.text === nextMessage.text && m.sender === nextMessage.sender);
        if (!messageExists) {
          showNextMessage(currentMessageIndex, dialogMessages, currentEarth);
        }
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = () => {
    if ((inputMessage.trim() || selectedImage) && currentEarth) {
      // Capture the current Earth number to avoid closure issues
      const earthNumber = currentEarth;
      const dialog = DIALOG_CONFIG[earthNumber as keyof typeof DIALOG_CONFIG];
      if (!dialog) return;

      // Add player message with optional image
      setMessages(prev => {
        const newPlayerMessage = {
          id: prev.length + 1,
          sender: 'player' as const,
          text: inputMessage,
          imageUrl: selectedImage || undefined
        };
        const updatedMessages = [...prev, newPlayerMessage];
        
        // Update chat history immediately when player sends message
        setChatHistory(prevHistory => ({
          ...prevHistory,
          [earthNumber]: updatedMessages
        }));
        
        return updatedMessages;
      });
      setInputMessage('');
      setSelectedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Show response messages if configured
      const responseMessages = (dialog as any).responseMessages || [];
      if (responseMessages.length > 0) {
        // Show response messages sequentially
        responseMessages.forEach((msg: { sender: 'ultraman' | 'player'; text: string; imageUrl?: string }, index: number) => {
          setTimeout(() => {
            setMessages(prev => {
              const newMessages = [...prev, {
                id: prev.length + 1,
                sender: msg.sender,
                text: msg.text || '',
                imageUrl: msg.imageUrl
              }];
              
              // Update chat history with each new message - use captured earthNumber
              setChatHistory(prevHistory => ({
                ...prevHistory,
                [earthNumber]: newMessages
              }));
              
              // Unlock planet after last response message
              if (index === responseMessages.length - 1) {
                const nextPlanet = (dialog as any).unlocksPlanet;
                if (nextPlanet && !unlockedPlanets.includes(nextPlanet)) {
                  setUnlockedPlanets([...unlockedPlanets, nextPlanet]);
                }
                
                // Auto-close chat after delay
                setTimeout(() => {
                  setShowChat(false);
                  setCurrentEarth(null);
                  // Messages are already saved in chatHistory
                }, dialog.autoCloseDelay || 2000);
              }
              
              return newMessages;
            });
          }, (index + 1) * 2000); // 2 second delay between each response message
        });
      } else {
        // No response messages - unlock immediately
        const nextPlanet = (dialog as any).unlocksPlanet;
        if (nextPlanet && !unlockedPlanets.includes(nextPlanet)) {
          setUnlockedPlanets([...unlockedPlanets, nextPlanet]);
        }

        // Auto-close chat after delay
        setTimeout(() => {
          // Save chat history before closing (use functional update to get latest messages)
          setMessages(currentMessages => {
            setChatHistory(prev => ({
              ...prev,
              [earthNumber]: currentMessages
            }));
            return currentMessages; // Don't change messages
          });
          setShowChat(false);
          setCurrentEarth(null);
          // Don't clear messages - keep them for history
        }, dialog.autoCloseDelay || 2000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden space-background">
      {/* Content */}
      <div className="relative z-10 w-full h-screen flex flex-col">
        {/* Left Side: Back Button */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
          <Link 
            href="/UnityBasic"
            className="cursor-pointer hover:scale-110 transition-transform duration-300"
          >
            <Image
              src="/Asset/Page2/เรียน (1) 4.png"
              alt="Back"
              width={100}
              height={100}
              className="object-contain transform rotate-180"
              style={{ imageRendering: 'pixelated', width: 'auto', height: 'auto' }}
              priority
            />
          </Link>
        </div>

        {/* Top-Left: Unity Asset Text */}
        <div className="absolute top-6 left-6 z-30">
          <h1 
            className="text-white font-bold"
            style={{ 
              fontFamily: 'Jersey 25, sans-serif',
              fontSize: '3.5rem',
              lineHeight: '1',
              imageRendering: 'pixelated',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              letterSpacing: '0.05em'
            }}
          >
            Unity Asset
          </h1>
        </div>

        {/* Six Planets in Single Horizontal Line */}
        <div className="flex-1 flex items-center justify-center w-full h-full">
          <div className="flex justify-center items-center gap-10 px-8">
            {/* Earth 1 - Unlocked with Hover Effect */}
            <div 
              className="cursor-pointer transition-transform duration-300 hover:scale-125"
              onClick={() => handleEarthClick(1)}
            >
              <Image
                src="/Asset/Page2/Earth.png"
                alt="Earth"
                width={3000}
                height={3000}
                className="object-contain"
                style={{ imageRendering: 'pixelated', width: 'auto', height: 'auto' }}
                priority
              />
            </div>
            {/* Earth 2 - With Lock (unlocks when message is sent) */}
            <div 
              className="relative" 
              style={{ marginTop: '-400px' }}
              onClick={() => handleEarthClick(2)}
            >
              <Image
                src="/Asset/Page2/Earth.png"
                alt="Earth"
                width={3000}
                height={3000}
                style={{ 
                  imageRendering: 'pixelated', 
                  width: 'auto', 
                  height: 'auto', 
                  filter: isPlanetUnlocked(2) ? 'none' : 'brightness(0.2)',
                  transition: 'filter 0.3s ease-in-out',
                  cursor: isPlanetUnlocked(2) ? 'pointer' : 'not-allowed'
                }}
                className={`object-contain ${isPlanetUnlocked(2) ? 'hover:scale-125 transition-transform duration-300' : ''}`}
                priority
              />
              {!isPlanetUnlocked(2) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="drop-shadow-2xl" style={{ imageRendering: 'pixelated' }}>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Earth 3 - With Lock */}
            <div 
              className="relative" 
              style={{ marginTop: '200px' }}
              onClick={() => handleEarthClick(3)}
            >
              <Image
                src="/Asset/Page2/Earth.png"
                alt="Earth"
                width={3000}
                height={3000}
                style={{ 
                  imageRendering: 'pixelated', 
                  width: 'auto', 
                  height: 'auto', 
                  filter: isPlanetUnlocked(3) ? 'none' : 'brightness(0.2)',
                  transition: 'filter 0.3s ease-in-out',
                  cursor: isPlanetUnlocked(3) ? 'pointer' : 'not-allowed'
                }}
                className={`object-contain ${isPlanetUnlocked(3) ? 'hover:scale-125 transition-transform duration-300' : ''}`}
                priority
              />
              {!isPlanetUnlocked(3) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="drop-shadow-2xl" style={{ imageRendering: 'pixelated' }}>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Earth 4 - With Lock */}
            <div 
              className="relative" 
              style={{ marginTop: '600px' }}
              onClick={() => handleEarthClick(4)}
            >
              <Image
                src="/Asset/Page2/Earth.png"
                alt="Earth"
                width={3000}
                height={3000}
                style={{ 
                  imageRendering: 'pixelated', 
                  width: 'auto', 
                  height: 'auto', 
                  filter: isPlanetUnlocked(4) ? 'none' : 'brightness(0.2)',
                  transition: 'filter 0.3s ease-in-out',
                  cursor: isPlanetUnlocked(4) ? 'pointer' : 'not-allowed'
                }}
                className={`object-contain ${isPlanetUnlocked(4) ? 'hover:scale-125 transition-transform duration-300' : ''}`}
                priority
              />
              {!isPlanetUnlocked(4) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="drop-shadow-2xl" style={{ imageRendering: 'pixelated' }}>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Earth 5 - With Lock */}
            <div 
              className="relative"
              onClick={() => handleEarthClick(5)}
            >
              <Image
                src="/Asset/Page2/Earth.png"
                alt="Earth"
                width={3000}
                height={3000}
                style={{ 
                  imageRendering: 'pixelated', 
                  width: 'auto', 
                  height: 'auto', 
                  filter: isPlanetUnlocked(5) ? 'none' : 'brightness(0.2)',
                  transition: 'filter 0.3s ease-in-out',
                  cursor: isPlanetUnlocked(5) ? 'pointer' : 'not-allowed'
                }}
                className={`object-contain ${isPlanetUnlocked(5) ? 'hover:scale-125 transition-transform duration-300' : ''}`}
                priority
              />
              {!isPlanetUnlocked(5) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="drop-shadow-2xl" style={{ imageRendering: 'pixelated' }}>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>
            {/* Earth 6 - With Lock */}
            <div 
              className="relative" 
              style={{ marginTop: '-400px' }}
              onClick={() => handleEarthClick(6)}
            >
              <Image
                src="/Asset/Page2/Earth.png"
                alt="Earth"
                width={3000}
                height={3000}
                style={{ 
                  imageRendering: 'pixelated', 
                  width: 'auto', 
                  height: 'auto', 
                  filter: isPlanetUnlocked(6) ? 'none' : 'brightness(0.2)',
                  transition: 'filter 0.3s ease-in-out',
                  cursor: isPlanetUnlocked(6) ? 'pointer' : 'not-allowed'
                }}
                className={`object-contain ${isPlanetUnlocked(6) ? 'hover:scale-125 transition-transform duration-300' : ''}`}
                priority
              />
              {!isPlanetUnlocked(6) && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="white" className="drop-shadow-2xl" style={{ imageRendering: 'pixelated' }}>
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom-Right Icon - Circular with Bar Chart/Equalizer */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="relative w-7 h-7">
            {/* Circle */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="absolute">
              <circle cx="14" cy="14" r="13" stroke="white" strokeWidth="1.5" fill="none" opacity="0.9" />
            </svg>
            {/* Bar Chart inside circle - 3 bars increasing height */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '18px', height: '18px' }} opacity="0.9">
              <rect x="4" y="15" width="2.5" height="5" />
              <rect x="8.5" y="12" width="2.5" height="8" />
              <rect x="13" y="8" width="2.5" height="12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chat Interface Modal */}
      {showChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowChat(false)}
          />
          
          {/* Chat Box */}
          <div className="relative w-full max-w-4xl h-[80vh] max-h-[600px] mx-4 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-400 rounded-lg overflow-hidden" style={{ imageRendering: 'pixelated' }}>
            {/* Chat Header */}
            <div className="absolute top-4 left-4 z-10">
              <h1 className="text-white text-4xl font-bold" style={{ fontFamily: "'Noto Sans Thai', monospace", imageRendering: 'pixelated' }}>
                Quest
              </h1>
            </div>

            {/* Chat Messages Area */}
            <div className="absolute top-20 left-0 right-0 bottom-24 overflow-y-auto px-4 pb-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.sender === 'player' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Profile Icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-400 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
                  
                  <div className={`flex flex-col ${message.sender === 'player' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {/* Name */}
                    <div className="text-white text-sm mb-1" style={{ fontFamily: "'Noto Sans Thai', monospace", imageRendering: 'pixelated' }}>
                      {message.sender === 'ultraman' ? 'Ultraman' : 'Player name'}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className="bg-white rounded-lg px-4 py-2 text-black text-sm" style={{ fontFamily: "'Noto Sans Thai', monospace", imageRendering: 'pixelated' }}>
                      {/* Image if present */}
                      {message.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          {message.imageUrl.endsWith('.gif') ? (
                            <img
                              src={message.imageUrl}
                              alt="Sent image"
                              className="object-contain max-w-full h-auto rounded-lg"
                              style={{ imageRendering: 'pixelated', maxWidth: '300px', maxHeight: '300px' }}
                            />
                          ) : (
                            <Image
                              src={message.imageUrl}
                              alt="Sent image"
                              width={300}
                              height={300}
                              className="object-contain max-w-full h-auto rounded-lg"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          )}
                        </div>
                      )}
                      {/* Text message */}
                      {message.text && (
                        message.sender === 'ultraman' ? (
                          <TypingText 
                            text={message.text} 
                            speed={30} 
                            onLinkClick={handleLinkClick} 
                            skipTyping={currentEarth ? skipTyping[currentEarth] || false : false}
                          />
                        ) : (
                          <MessageWithLinks text={message.text} onLinkClick={handleLinkClick} />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Area */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gray-800/50 border-t-2 border-cyan-400 flex items-center px-4 gap-3">
              {/* Attachment Icon - Image Upload */}
              <label className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-600 transition-colors" style={{ imageRendering: 'pixelated' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="gray">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </label>
              
              {/* Image Preview */}
              {selectedImage && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-cyan-400 flex-shrink-0">
                  <Image
                    src={selectedImage}
                    alt="Preview"
                    fill
                    className="object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              
              {/* Input Field */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 h-12 bg-white rounded-lg px-4 text-black text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                style={{ fontFamily: "'Noto Sans Thai', monospace", imageRendering: 'pixelated' }}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                className="bg-gray-300 hover:bg-gray-400 rounded-lg px-6 h-12 flex items-center gap-2 text-sm transition-colors"
                style={{ fontFamily: "'Noto Sans Thai', monospace", imageRendering: 'pixelated' }}
              >
                <span className="text-gray-700">ส่งข้อความ</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="transform rotate-45">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

