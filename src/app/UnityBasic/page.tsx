'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { useCookies } from 'react-cookie';
import LevelOne from "../game/levels/LevelOne";
import { BASE_PLAYER_STATS, MIN_SHOOT_INTERVAL } from "../game/Player";
import type { PlayerStats } from "../game/Player";

type ChatMessage = {
  id: number;
  sender: 'ultraman' | 'player';
  text: string;
  imageUrl?: string;
};

type DisplayMessage = ChatMessage & {
  onComplete?: () => void;
};

const sanitizeMessages = (messages: DisplayMessage[]): ChatMessage[] =>
  messages.map(({ id, sender, text, imageUrl }) => ({
    id,
    sender,
    text,
    imageUrl,
  }));

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
              style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}
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

// Upgrade Row Component
interface UpgradeRowProps {
  label: string;
  value: number;
  description: string;
  onIncrement: () => void;
  disabled: boolean;
}

function UpgradeRow({ label, value, description, onIncrement, disabled }: UpgradeRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/5 px-6 py-5 shadow-inner" style={{ imageRendering: 'pixelated' }}>
      <div>
        <div className="text-3xl font-extrabold tracking-wide text-white">{label}</div>
        <div className="text-sm uppercase tracking-widest text-white/50">{description}</div>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-3xl font-extrabold text-white">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={disabled}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 text-3xl font-bold text-black shadow-lg transition-colors hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ imageRendering: 'pixelated' }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// Typing effect component for Ultraman messages with link support
function TypingText({ text, speed = 30, onLinkClick, skipTyping = false, onTypingComplete }: { text: string; speed?: number; onLinkClick?: () => void; skipTyping?: boolean; onTypingComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    // Reset state when text changes
    setDisplayedText('');
    setIsTyping(true);
    
    if (skipTyping === true) {
      // Skip typing animation - show full text immediately
      setDisplayedText(text);
      setIsTyping(false);
      if (!completedRef.current) {
        onTypingComplete?.();
        completedRef.current = true;
      }
      return;
    }

    // Start typing animation
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
        if (!completedRef.current) {
          onTypingComplete?.();
          completedRef.current = true;
        }
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, skipTyping, onTypingComplete]);

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
      { sender: 'ultraman' as const, text: 'ฉันชื่อ Mr.MaX และฉันต้องการความช่วยเหลือจากคุณ' },
      { sender: 'ultraman' as const, text: 'ฉันจะเป็นคนสอนพื้นฐาน Unity นายเอง' },
      { sender: 'ultraman' as const, text: 'เริ่มจากขั้นแรกกันเลย นายต้องติดตั้ง Unity Hub ซะก่อน เพราะมันคือประตูเข้าสู่ทุกเวิร์กช็อปของเรา' },
      { sender: 'ultraman' as const, text: 'กดโหลด Unity Hub จากหน้าเว็บทางการให้เรียบร้อย' },
      { sender: 'ultraman' as const, text: 'จากนั้นไปต่อที่ Unity Editor เลย เข้า Unity Download Archive แล้วเลือกเวอร์ชัน LTS 6000.2.xxxx จะเสถียรที่สุด' },
      { sender: 'ultraman' as const, text: 'ตอนกดติดตั้งให้ดูแถบ OS ของนายให้ดี เลือกตัวที่ตรงกับเครื่องนาย ถ้าอยู่ฝั่ง Windows ก็อย่าหลงไปคลิกเวอร์ชันอื่นล่ะ' },
      { sender: 'ultraman' as const, text: 'โหลดเสร็จแล้วเปิด Installer แล้วปล่อยให้มันทำงานอย่างสงบ เมื่อทุกอย่างเสร็จ Unity จะผูกกับ Unity Hub ให้เอง' },
      { sender: 'ultraman' as const, text: 'ไปที่ Unity Hub แล้วเลือก New Project ตั้งชื่อที่นายชอบและใช้ Template Universal 3D' },
      { sender: 'ultraman' as const, text: 'อย่าลืมเลือกโฟลเดอร์ปลายทางที่มีพื้นที่ว่างอย่างน้อย 30GB เผื่อเราติดตั้ง asset เพิ่มเติม' },
      { sender: 'ultraman' as const, text: 'เสร็จแล้วบอกฉันด้วย เราจะเริ่มภารกิจถัดไปทันที' },
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'ดีมาก! นายเข้ามาใน Unity แล้ว' },
      { sender: 'ultraman' as const, text: 'ตอนนี้นายพร้อมที่จะไปยัง Earth 2 แล้ว!' },
    ],
    unlocksPlanet: 2,
    autoCloseDelay: 5000
  },
  2: { // Earth 2 Dialog (when unlocked)
    initialMessages: [
      { sender: 'ultraman' as const, text: 'ก่อนอื่น นายอาจจะสงสัยว่าหน้าต่างของ Unity มันมีอะไรบ้าง ฉันจะอธิบายให้เอง' },
      { sender: 'ultraman' as const, text: 'หน้าต่างแรก Hierarchy จะเป็นหน้าโชว์ Object ต่างๆภายในฉากนั้นๆ' },
      { sender: 'ultraman' as const, text: 'หน้าต่างที่สอง Inspector จะเป็นหน้าโชว์ Properties ของ Object นั้นๆ' },
      { sender: 'ultraman' as const, text: 'หน้าต่างที่สาม Project อันนี้ก็ไม่มีอะไรมาก เหมือนเวลาเราเปิดไฟล์เหลืองของคอมอ่ะ แต่มันนี้เป็นโฟลเดอร์ที่เกี่ยวกับโปรเจคนี้' },
      { sender: 'ultraman' as const, text: 'หน้าต่างที่สี่ Scene พูดง่ายๆเลยนะ เป็นหน้าทำเกมไม่มีอะไรเลยไกลตามแกนแต่ถ้ากดไม่โดนเส้นละก็มึนหัวแน่นอนเลื่อนๆดูนะ' },
      { sender: 'ultraman' as const, text: 'หลักๆจะมีประมาณนี้ นายเข้าใจมั้ย' },
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'ดีมาก! นายสอนง่ายนิ' },
      { sender: 'ultraman' as const, text: 'ตอนนี้คุณต้องชนะ Boss Level 1 เพื่อปลดล็อก Earth 3!' },
      { sender: 'ultraman' as const, text: 'ดีมาก!', imageUrl: '/Asset/Page2/big-brain.gif' }
    ],
    // unlocksPlanet removed - Earth 3 is unlocked after winning boss fight
    autoCloseDelay: 3000
  },
  3: { // Earth 3 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'ยินดีด้วย! คุณปลดล็อก Earth 3 แล้ว' },
      { sender: 'ultraman' as const, text: 'ตอนนี้นายต้องเรียนรู้เกี่ยวกับการบิน' },
      { sender: 'ultraman' as const, text: 'เวลาจะบินใน Scene ก็ให้กดคลิกขวาค้างไว้และหันจอได้แล้วก็เหมือนเล่นเกมเลย WASD กด Shift บินเร็ว' },
      { sender: 'ultraman' as const, text: 'ถ้านายลองบินดูนะ ถ้าคล่องแล้วบอกฉันด้วย' },
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'ดีมาก! นายเรียนรู้ได้เร็วมาก' },
      { sender: 'ultraman' as const, text: 'ตอนนี้คุณพร้อมสำหรับ Earth 4 แล้ว!' }
    ],
    unlocksPlanet: 4,
    autoCloseDelay: 3000
  },
  4: { // Earth 4 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'ยินดีต้อนรับสู่ Earth 4!' },
      { sender: 'ultraman' as const, text: 'ที่นี่นายจะได้เรียนรู้วิธีการสร้าง Object ในฉาก' },
      { sender: 'ultraman' as const, text: 'เราจะเริ่มสร้างของต่างๆยังไงละ' },
      { sender: 'ultraman' as const, text: 'ให้นายกดคลิกขวาในช่อง Hierarchy -> 3D Object -> แล้วก็เลือกสักอย่างมันก็จะสร้าง Object ออกมาได้ละลองกดๆดู' },
      { sender: 'ultraman' as const, text: 'ถ้านายลองสร้างของต่างๆดูนะ ถ้าได้แล้วส่งรูปให้ฉันดูด้วย' },
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'เยี่ยมเลย! อย่างน้อย scene นายก้ไม่โล่งแล้ว' },
      { sender: 'ultraman' as const, text: 'ต่อไปเราจะไปที่ Earth 5' }
    ],
    unlocksPlanet: 5,
    autoCloseDelay: 3000
  },
  5: { // Earth 5 Dialog
    initialMessages: [
      { sender: 'ultraman' as const, text: 'Earth 5! ที่นี่นายจะได้ลองใช้ tools ต่างๆของ Unity กัน' },
      { sender: 'ultraman' as const, text: 'นายเห็น TAB ด้านซ้ายตรงนี้ม่ะที่มีให้เลือกหลายๆอัน แล้วฉันเล่าให้ฟังว่าแต่ละอันคืออะไร' },
      { sender: 'ultraman' as const, text: 'อันแรก เป็นรูปมือไม่ค่อยใช้อยากรู้ลองใช้เองไม่บอกหรอก' },
      { sender: 'ultraman' as const, text: 'อันสอง รูปสี่ทิศอันนี้จะใช้ประจำเลย คือตอนที่เลือกสัก Object นึงจะมีทิศออกมาตรง Object ก็เลื่อนได้เลยลองเลื่อนๆดู' },
      { sender: 'ultraman' as const, text: 'อันสาม รูปหมุนอันนี้เป็น Rotate เหมือนกับรูปทิศเลยแต่มันจะไม่เป็นทิศแต่จะเป็นการหมุนแทนถ้าหมุนตรงเส้นจะไปตามแกนแต่ถ้ากดไม่โดนเส้นละก็มึนหัวแน่นอนเลื่อนๆดู' },
      { sender: 'ultraman' as const, text: 'อันสี่ รูปกล่องมีลูกศรสักอย่างอันนี้มีไว้เพื่อปรับขนาดเหมือนกับรูปทิศเลยลองปรับๆดูไปตามแกนแต่ถ้ากดไม่โดนเส้นละก็มึนหัวแน่นอนเลื่อนๆดู' },
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'สุดยอด! นายเริ่มเป็นแล้วนิ' },
      { sender: 'ultraman' as const, text: 'Earth ต่อไปจะเป็นเรื่องสุดท้ายของบทนี้แหละ' }
    ],
    unlocksPlanet: 6,
    autoCloseDelay: 3000
  },
  6: { // Earth 6 Dialog (Final)
    initialMessages: [
      { sender: 'ultraman' as const, text: 'เมื่อกี้นายโดนลอบโจมตีจากพวกโจรสลัดอวกาศงั้นหรอ โชคดีนะที่นายรอดมาได้' },
      { sender: 'ultraman' as const, text: 'ฉันเชื่อว่ายังนายไหวนะ' },
      { sender: 'ultraman' as const, text: 'เพราะทีนี้เรารู้วิธีการสร้างทั้ง Object และการปรับแต่งไปแล้ว' },
      { sender: 'ultraman' as const, text: 'ฉันจะให้ภารกิจแรกกับนาย' },
      { sender: 'ultraman' as const, text: 'ภารกิจของนายคือการที่นายจะต้องสร้าง Mascot ออกมา 1 ตัวโดยที่ใช้ Object อย่างเดียว' },
      { sender: 'ultraman' as const, text: 'ถ้าทำเสร็จแล้วก็มาให้ฉันตรวจได้เลย ระหว่างนี้ฉันจะเอา Laser ที่พวกมันใช้มาติดยานนายให้ นายจะได้มีทางสู้มากขึ้น' }
    ],
    responseMessages: [
      { sender: 'ultraman' as const, text: 'ยอดเยี่ยม! นายเรียนรู้ทั้งหมดที่ฉันสอนแล้ว นายสามารถรายงานสิ่งที่นายได้กลับศูนย์บัญชาการได้เลย' },
      { sender: 'ultraman' as const, text: 'ขอให้นายเดินทางปลอดภัยนะ และนอกจากฉันจะติด Laser ให้ยานนายแล้ว ฉันยังติดเครื่องเปิด Starway ให้นายด้วย ตอนนี้นายสามารถข้ามไปยังหมู่ดาวอื่นได้แล้วนะ' }
    ],
    // No unlocksPlanet - this is the final Earth
    autoCloseDelay: 4000
  },
};

export default function Page2() {
  const [cookies, setCookie] = useCookies(['discord_user', 'discord_token']);
  
  // Get player nickname/name from cookies
  const getPlayerName = () => {
    try {
      const userData = typeof cookies.discord_user === 'string' 
        ? JSON.parse(cookies.discord_user) 
        : cookies.discord_user;
      return userData?.nickname || userData?.username || userData?.global_name || 'Player';
    } catch {
      return 'Player';
    }
  };
  
  const [showChat, setShowChat] = useState(false);
  const [currentEarth, setCurrentEarth] = useState<number | null>(null);
  const [unlockedPlanets, setUnlockedPlanets] = useState([1]); // Only Earth 1 unlocked initially
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dialogMessages, setDialogMessages] = useState<Array<{ sender: 'ultraman' | 'player'; text: string; imageUrl?: string }>>([]);
  const [shownDialogs, setShownDialogs] = useState<Set<number>>(new Set()); // No dialogs shown initially
  const [skipTyping, setSkipTyping] = useState<{ [key: number]: boolean }>({}); // No dialogs skip typing initially
  const [chatHistory, setChatHistory] = useState<{ [key: number]: ChatMessage[] }>({}); // Store full chat history for each Earth
  const [earth6Completed, setEarth6Completed] = useState(false); // Earth 6 not completed initially
  const [userAnswers, setUserAnswers] = useState<{ unityBasic: any[], unityAsset: any[] }>({ unityBasic: [], unityAsset: [] }); // Store user answers
  const [declinedAnswers, setDeclinedAnswers] = useState<Array<{
    earthNumber: number;
    answerType: 'unityBasic' | 'unityAsset';
    answerText?: string;
    answerImageUrl?: string;
    adminComment: string;
    reviewedAt: string;
    reviewedBy: string;
    declinedAt: string;
  }>>([]); // Store declined answers with admin comments
  const [showUpgrade, setShowUpgrade] = useState(false); // Upgrade modal state
  const [points, setPoints] = useState(10); // Upgrade points
  const [atk, setAtk] = useState(10); // Attack stat
  const [hp, setHp] = useState(10); // Health stat
  const [agi, setAgi] = useState(10); // Agility stat
  const [hamsterCoin, setHamsterCoin] = useState(0); // Hamster coin currency
  const [showBossFight, setShowBossFight] = useState(false); // Boss fight modal state
  const [bossFightCompleted, setBossFightCompleted] = useState(false); // Boss fight completion state
  const [bossFightTriggerEarth, setBossFightTriggerEarth] = useState<number | null>(null); // Track which Earth triggered boss fight
  const [showMissionComplete, setShowMissionComplete] = useState(false); // Mission complete overlay state
  const [isProcessingResponse, setIsProcessingResponse] = useState(false); // Prevent duplicate response processing
  const [responseShown, setResponseShown] = useState<{ [key: number]: boolean }>({}); // Track if response has been shown for each Earth
  const [progressLoaded, setProgressLoaded] = useState(false); // Track if progress has been loaded
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null); // Track enlarged image URL
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate player stats from upgrade stats (same as game/page.tsx)
  const BASE_STAT_VALUE = 10;
  const HP_PER_POINT = 20;
  const MOVE_SPEED_PER_POINT = 0.3;
  const SHOOT_INTERVAL_REDUCTION_PER_POINT = 15;
  const ATTACK_PER_POINT = 1;

  const atkBonus = atk - BASE_STAT_VALUE;
  const hpBonus = hp - BASE_STAT_VALUE;
  const agiBonus = agi - BASE_STAT_VALUE;

  const playerStats: PlayerStats = useMemo(() => {
    const shootInterval = Math.max(
      MIN_SHOOT_INTERVAL,
      BASE_PLAYER_STATS.shootInterval - agiBonus * SHOOT_INTERVAL_REDUCTION_PER_POINT,
    );

    return {
      ...BASE_PLAYER_STATS,
      attackPowerBoss: BASE_PLAYER_STATS.attackPowerBoss + atkBonus * ATTACK_PER_POINT,
      attackPowerMinion: BASE_PLAYER_STATS.attackPowerMinion + atkBonus * ATTACK_PER_POINT,
      maxHealth: BASE_PLAYER_STATS.maxHealth + hpBonus * HP_PER_POINT,
      moveSpeed: BASE_PLAYER_STATS.moveSpeed + agiBonus * MOVE_SPEED_PER_POINT,
      shootInterval,
    };
  }, [atkBonus, hpBonus, agiBonus]);

  // Load progress from database on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        if (cookies.discord_user) {
          const userData = typeof cookies.discord_user === 'string' 
            ? JSON.parse(cookies.discord_user) 
            : cookies.discord_user;
          const discordId = userData?.id;
          
          if (discordId) {
            const response = await fetch(`/api/progress/load?discordId=${discordId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.unlockedPlanets) {
                setUnlockedPlanets(data.unlockedPlanets);
              }
              if (data.earth6Completed !== undefined) {
                setEarth6Completed(data.earth6Completed);
              }
              if (data.points !== undefined) {
                setPoints(data.points);
              }
              if (data.atk !== undefined) {
                setAtk(data.atk);
              }
              if (data.hp !== undefined) {
                setHp(data.hp);
              }
              if (data.agi !== undefined) {
                setAgi(data.agi);
              }
              if (data.hamsterCoin !== undefined) {
                setHamsterCoin(Number(data.hamsterCoin) || 0);
              }
              // Load user answers to check for admin comments
              if (data.answers) {
                setUserAnswers(data.answers);
              }
              // Load declined answers with admin comments
              if (data.declinedAnswers) {
                setDeclinedAnswers(data.declinedAnswers);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setProgressLoaded(true);
      }
    };

    loadProgress();
  }, [cookies.discord_user]);

  // Save progress to database whenever it changes
  useEffect(() => {
    if (!progressLoaded) return; // Don't save on initial load

    const saveProgress = async () => {
      try {
        if (cookies.discord_user) {
          const userData = typeof cookies.discord_user === 'string' 
            ? JSON.parse(cookies.discord_user) 
            : cookies.discord_user;
          const discordId = userData?.id;
          const username = userData?.username || userData?.global_name || 'Unknown';
          let nickname = userData?.nickname || null;
          const avatar = userData?.avatar || null;

          // If nickname is not in cookie but we have a token, try to fetch it
          if (!nickname && cookies.discord_token) {
            try {
              const response = await fetch(`/api/discord/guild-member?token=${encodeURIComponent(cookies.discord_token)}`);
              if (response.ok) {
                const data = await response.json();
                if (data.nickname && data.nickname.trim() !== '') {
                  nickname = data.nickname;
                  // Update the cookie with the nickname
                  const updatedUser = { ...userData, nickname: data.nickname };
                  setCookie('discord_user', JSON.stringify(updatedUser), { path: '/' });
                }
              }
            } catch (error) {
              console.error('Error fetching guild nickname:', error);
            }
          }

          if (discordId) {
            const saveData = {
              discordId,
              username,
              nickname: nickname || null, // Always include nickname, even if null
              avatar: avatar || null, // Include avatar
              unlockedPlanets,
              earth6Completed,
              points,
              atk,
              hp,
              agi,
              hamsterCoin,
            };
            
            console.log('Saving progress with data:', saveData);
            
            await fetch('/api/progress/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(saveData),
            });
          }
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    };

    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(saveProgress, 500);
    return () => clearTimeout(timeoutId);
  }, [unlockedPlanets, earth6Completed, points, atk, hp, agi, hamsterCoin, progressLoaded, cookies.discord_user, cookies.discord_token]);

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
      const nextIndex = index + 1;
      
      // Skip empty messages (unless they have an image)
      if ((!msg.text || msg.text.trim() === '') && !msg.imageUrl) {
        setCurrentMessageIndex(nextIndex);
        // Continue to next message immediately if current is empty
        if (nextIndex < messagesToShow.length) {
          setTimeout(() => {
            showNextMessage(nextIndex, messagesToShow, earthNumber);
          }, 100);
        }
        return;
      }
      
      // Check if this message has already been shown to prevent duplicates
      setMessages(prev => {
        // Check if message already exists
        const messageExists = prev.some(m => 
          m.sender === msg.sender && 
          m.text === msg.text && 
          (msg.imageUrl ? m.imageUrl === msg.imageUrl : !m.imageUrl)
        );
        
        if (messageExists) {
          // Message already shown, just update index and continue
          setCurrentMessageIndex(nextIndex);
          // Continue to next message if not waiting for link click
          if (nextIndex < messagesToShow.length && !waitingForLinkClickRef.current[earthNumber]) {
            setTimeout(() => {
              if (!waitingForLinkClickRef.current[earthNumber]) {
                showNextMessage(nextIndex, messagesToShow, earthNumber);
              }
            }, 100);
          }
          return prev;
        }
        
        const baseDelay = 600;
        const hasMessageUrl = msg.text ? hasUrl(msg.text) : false;

        const createChatEntry = (): ChatMessage => ({
          id: prev.length + 1,
          sender: msg.sender,
          text: msg.text || '',
          imageUrl: (msg as any).imageUrl,
        });

        const scheduleNext = () => {
          if (nextIndex < messagesToShow.length && !waitingForLinkClickRef.current[earthNumber]) {
            showNextMessage(nextIndex, messagesToShow, earthNumber);
          }
        };

        // Add new message
        const chatEntry = createChatEntry();
        const displayEntry: DisplayMessage = { ...chatEntry };

        if (msg.text && hasMessageUrl) {
          waitingForLinkClickRef.current[earthNumber] = true;
        } else if (msg.sender === 'ultraman' && msg.text) {
          displayEntry.onComplete = () => {
            setTimeout(() => {
              scheduleNext();
            }, baseDelay);
          };
        } else if (msg.imageUrl) {
          setTimeout(() => {
            scheduleNext();
          }, 1000);
        } else {
          setTimeout(() => {
            scheduleNext();
          }, baseDelay);
        }

        const newMessages = [...prev, displayEntry];
        
        // Update chat history when showing initial messages - use the passed earthNumber
        setChatHistory(prevHistory => ({
          ...prevHistory,
          [earthNumber]: [...(prevHistory[earthNumber] || []), chatEntry]
        }));
        
        setCurrentMessageIndex(nextIndex);
        
        return newMessages;
      });
    }
  };

  const handleEarthClick = (earthNumber: number) => {
    if (!isPlanetUnlocked(earthNumber)) return;
    
    // Ensure we're using the correct Earth number
    const clickedEarth = earthNumber;
    
    // Note: Earth 2 and Earth 4 will show dialog first, then boss fight will trigger
    // after dialog completes (handled in handleUnlockPlanet)
    
    const dialog = DIALOG_CONFIG[clickedEarth as keyof typeof DIALOG_CONFIG];
    if (!dialog) {
      console.error(`No dialog configuration found for Earth ${clickedEarth}`);
      return;
    }
    
    // Check for declined answers with admin comments for this Earth
    const declinedAnswer = declinedAnswers.find(
      (declined: any) => declined.earthNumber === clickedEarth && 
      declined.answerType === 'unityBasic' &&
      declined.adminComment
    );
    
    // Reset state and set current Earth first
    setCurrentEarth(clickedEarth);
    let messagesToShow = [...dialog.initialMessages];
    
    // If there's a declined answer with admin comment, add it to the messages
    if (declinedAnswer && declinedAnswer.adminComment) {
      messagesToShow = [
        ...messagesToShow,
        { sender: 'ultraman' as const, text: `[Admin Feedback] ${declinedAnswer.adminComment}` }
      ];
    }
    
    setDialogMessages(messagesToShow); // Store all dialog messages
    
    // Check if this dialog has been shown before
    const hasBeenShown = shownDialogs.has(clickedEarth);
    
    if (hasBeenShown) {
      // Replay initial messages sequentially each time the dialog is opened
      waitingForLinkClickRef.current[clickedEarth] = false;
      setSkipTyping(prev => ({ ...prev, [clickedEarth]: false }));
      setMessages([]);
      setCurrentMessageIndex(0);
      setShowChat(true);

      setTimeout(() => {
        showNextMessage(0, messagesToShow, clickedEarth);
      }, 100);
    } else {
      // First time showing - use typing animation
      // Explicitly set skipTyping to false for this Earth
      setSkipTyping(prev => {
        const newState = { ...prev };
        newState[clickedEarth] = false;
        return newState;
      });
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

  // Use ref to track current response index for link clicks
  const currentResponseIndexRef = useRef<{ [key: number]: number }>({});
  // Use ref to track if we're waiting for link click (for both initial and response messages)
  const waitingForLinkClickRef = useRef<{ [key: number]: boolean }>({});

  const handleLinkClick = () => {
    if (!currentEarth) return;
    
    const dialog = DIALOG_CONFIG[currentEarth as keyof typeof DIALOG_CONFIG];
    if (!dialog) return;
    
    // Check if we're in initial messages phase (not processing response yet)
    if (!isProcessingResponse) {
      // Handle initial messages with URL
      const initialMessages = dialog.initialMessages || [];
      
      // Clear waiting flag
      waitingForLinkClickRef.current[currentEarth] = false;
      
      // Get current index from messages to ensure we continue from correct position
      setMessages(currentMessages => {
        // Count how many initial messages have been shown
        const initialShownCount = currentMessages.filter(m => 
          m.sender === 'ultraman' && 
          initialMessages.some((im: any) => 
            (im.text && m.text === im.text) || 
            (im.imageUrl && m.imageUrl === im.imageUrl)
          )
        ).length;
        
        if (initialShownCount < initialMessages.length) {
          // Update index and continue showing initial messages
          setCurrentMessageIndex(initialShownCount);
          setTimeout(() => {
            showNextMessage(initialShownCount, initialMessages, currentEarth);
          }, 100);
        }
        
        return currentMessages;
      });
      return;
    }
    
    // Handle response messages
    const responseMessages = (dialog as any).responseMessages || [];
    const currentIndex = currentResponseIndexRef.current[currentEarth] || 0;
    
    // Clear waiting flag
    waitingForLinkClickRef.current[currentEarth] = false;
    
    // Show next response message
    if (currentIndex < responseMessages.length) {
      const nextMsg = responseMessages[currentIndex];
      const nextMsgHasUrl = nextMsg.text && hasUrl(nextMsg.text);
      
      setMessages(prev => {
        const newMessages = [...prev, {
          id: prev.length + 1,
          sender: nextMsg.sender,
          text: nextMsg.text || '',
          imageUrl: nextMsg.imageUrl
        }];
        
        // Update chat history
        setChatHistory(prevHistory => ({
          ...prevHistory,
          [currentEarth]: sanitizeMessages(newMessages)
        }));
        
        return newMessages;
      });
      
      // Update current index
      currentResponseIndexRef.current[currentEarth] = currentIndex + 1;
      
      // If next message has URL, wait for link click
      if (nextMsgHasUrl && currentIndex + 1 < responseMessages.length) {
        waitingForLinkClickRef.current[currentEarth] = true;
        // Don't auto-advance, wait for next link click
        return;
      }
      
      // Calculate delay for current message based on typing speed
      const typingSpeed = 30; // ms per character (matches TypingText default)
      const baseDelay = 500; // Base delay after typing completes
      let currentDelay = baseDelay;
      
      if (nextMsg.sender === 'ultraman' && nextMsg.text) {
        const typingTime = nextMsg.text.length * typingSpeed;
        currentDelay = typingTime + baseDelay;
      } else if (nextMsg.imageUrl) {
        currentDelay = 1000;
      }
      
      // If next message doesn't have URL or it's the last one, continue or unlock
      if (currentIndex + 1 < responseMessages.length) {
        // More messages, show them automatically if no URL
        if (!nextMsgHasUrl) {
          setTimeout(() => {
            let nextIndex = currentIndex + 1;
            const showRemaining = () => {
              if (nextIndex < responseMessages.length && !waitingForLinkClickRef.current[currentEarth]) {
                const msg = responseMessages[nextIndex];
                const msgHasUrl = msg.text && hasUrl(msg.text);
                
                setMessages(prev => {
                  const updated = [...prev, {
                    id: prev.length + 1,
                    sender: msg.sender,
                    text: msg.text || '',
                    imageUrl: msg.imageUrl
                  }];
                  
                  setChatHistory(prevHistory => ({
                    ...prevHistory,
                    [currentEarth]: sanitizeMessages(updated)
                  }));
                  
                  return updated;
                });
                
                currentResponseIndexRef.current[currentEarth] = nextIndex + 1;
                nextIndex++;
                
                // Calculate delay for this message
                let msgDelay = baseDelay;
                if (msg.sender === 'ultraman' && msg.text) {
                  const typingTime = msg.text.length * typingSpeed;
                  msgDelay = typingTime + baseDelay;
                } else if (msg.imageUrl) {
                  msgDelay = 1000;
                }
                
                if (msgHasUrl && nextIndex < responseMessages.length) {
                  // Wait for link click
                  waitingForLinkClickRef.current[currentEarth] = true;
                } else if (!msgHasUrl && nextIndex < responseMessages.length) {
                  // Continue automatically after typing completes
                  setTimeout(showRemaining, msgDelay);
                } else {
                  // All done, unlock after typing completes
                  setTimeout(() => {
                    handleUnlockPlanet(currentEarth, dialog);
                  }, msgDelay);
                }
              } else if (nextIndex >= responseMessages.length) {
                // All done, unlock
                setTimeout(() => {
                  handleUnlockPlanet(currentEarth, dialog);
                }, baseDelay);
              }
            };
            showRemaining();
          }, currentDelay);
        }
      } else {
        // All responses shown, unlock planet after typing completes
        setTimeout(() => {
          handleUnlockPlanet(currentEarth, dialog);
        }, currentDelay);
      }
    } else {
      // All responses shown, unlock planet
      setTimeout(() => {
        handleUnlockPlanet(currentEarth, dialog);
      }, 2000);
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

  const handleUnlockPlanet = (earthNumber: number, dialog: any) => {
    const nextPlanet = (dialog as any).unlocksPlanet;
    
    // Special handling for Earth 2: require boss fight before unlocking Earth 3
    if (earthNumber === 2) {
      // Don't unlock Earth 3 yet, trigger boss fight instead
      setTimeout(() => {
        setIsProcessingResponse(false);
        setShowChat(false);
        setCurrentEarth(null);
        // Track which Earth triggered the boss fight
        setBossFightTriggerEarth(earthNumber);
        // Start boss fight
        setShowBossFight(true);
      }, dialog.autoCloseDelay || 2000);
    } else if (earthNumber === 4) {
      // Special handling for Earth 4: require boss fight before unlocking Earth 5
      // Don't unlock Earth 5 yet, trigger boss fight instead
      setTimeout(() => {
        setIsProcessingResponse(false);
        setShowChat(false);
        setCurrentEarth(null);
        // Track which Earth triggered the boss fight
        setBossFightTriggerEarth(earthNumber);
        // Start boss fight
        setShowBossFight(true);
      }, dialog.autoCloseDelay || 2000);
    } else {
      // Normal unlock for other planets
      if (nextPlanet && !unlockedPlanets.includes(nextPlanet)) {
        setUnlockedPlanets([...unlockedPlanets, nextPlanet]);
        // Award rewards: +10 Hamster Coin & +5 Skill Points
        setHamsterCoin(prev => prev + 10);
        setPoints(prev => prev + 5);
        // Show Mission Complete overlay
        setShowMissionComplete(true);
        // Hide overlay after 3 seconds
        setTimeout(() => {
          setShowMissionComplete(false);
        }, 3000);
      }
      
      // Check if Earth 6 is completed
      if (earthNumber === 6) {
        setEarth6Completed(true);
      }
      
      // Auto-close chat after delay
      setTimeout(() => {
        setIsProcessingResponse(false);
        setShowChat(false);
        setCurrentEarth(null);
      }, dialog.autoCloseDelay || 2000);
    }
  };

  const showResponseMessages = (earthNumber: number, dialog: any) => {
    const responseMessages = (dialog as any).responseMessages || [];
    if (responseMessages.length > 0) {
        // Initialize response index for this Earth
        currentResponseIndexRef.current[earthNumber] = 0;
        
        // Show response messages sequentially, checking for URLs
        const showNextResponse = () => {
          const currentIndex = currentResponseIndexRef.current[earthNumber] || 0;
          if (currentIndex < responseMessages.length) {
            const msg = responseMessages[currentIndex];
            const msgHasUrl = msg.text && hasUrl(msg.text);
            
            setMessages(prev => {
              const newMessages = [...prev, {
                id: prev.length + 1,
                sender: msg.sender,
                text: msg.text || '',
                imageUrl: msg.imageUrl
              }];
              
              // Update chat history with each new message
              setChatHistory(prevHistory => ({
                ...prevHistory,
                [earthNumber]: sanitizeMessages(newMessages)
              }));
              
              return newMessages;
            });
            
            // Update index
            currentResponseIndexRef.current[earthNumber] = currentIndex + 1;
            
            // Calculate delay based on message length and typing speed
            const typingSpeed = 30; // ms per character (matches TypingText default)
            const baseDelay = 500; // Base delay after typing completes
            let msgDelay = baseDelay;
            
            if (msg.sender === 'ultraman' && msg.text) {
              const typingTime = msg.text.length * typingSpeed;
              msgDelay = typingTime + baseDelay;
            } else if (msg.imageUrl) {
              msgDelay = 1000;
            }
            
            // If message has URL, wait for link click before showing next
            // Otherwise, continue after delay
            if (msgHasUrl) {
              // Set waiting flag - wait for link click
              waitingForLinkClickRef.current[earthNumber] = true;
              // Don't auto-advance, wait for handleLinkClick
            } else {
              // No URL, continue to next message after typing completes
              if (currentIndex + 1 < responseMessages.length) {
                setTimeout(() => {
                  // Only continue if not waiting for link click
                  if (!waitingForLinkClickRef.current[earthNumber]) {
                    showNextResponse();
                  }
                }, msgDelay);
              } else {
                // All responses shown, unlock planet after typing completes
                setTimeout(() => {
                  handleUnlockPlanet(earthNumber, dialog);
                }, msgDelay);
              }
            }
          } else {
            // All responses shown, unlock planet
            handleUnlockPlanet(earthNumber, dialog);
          }
        };
        
        // Start showing responses after a short delay
        setTimeout(() => {
          showNextResponse();
        }, 1000);
      } else {
        // No response messages - don't unlock, just close chat
        setIsProcessingResponse(false);
        setTimeout(() => {
          // Save chat history before closing
          setMessages(currentMessages => {
            setChatHistory(prev => ({
              ...prev,
              [earthNumber]: currentMessages
            }));
            return currentMessages;
          });
          setShowChat(false);
          setCurrentEarth(null);
        }, dialog.autoCloseDelay || 2000);
      }
    };

  // Save answer to database (text and/or image)
  const saveAnswer = async (answerText: string, imageUrl?: string, earthNumber?: number) => {
    try {
      if (cookies.discord_user) {
        const userData = typeof cookies.discord_user === 'string' 
          ? JSON.parse(cookies.discord_user) 
          : cookies.discord_user;
        const discordId = userData?.id;

        if (discordId && (answerText.trim() || imageUrl)) {
          await fetch('/api/answers/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              discordId,
              answer: answerText.trim() || '',
              imageUrl: imageUrl || '',
              type: 'unityBasic',
              earthNumber: earthNumber || null,
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSendMessage = () => {
    if ((inputMessage.trim() || selectedImage) && currentEarth && !isProcessingResponse) {
      // Capture the current Earth number to avoid closure issues
      const earthNumber = currentEarth;
      const dialog = DIALOG_CONFIG[earthNumber as keyof typeof DIALOG_CONFIG];
      if (!dialog) return;

      // Save answer (text and/or image)
      if (inputMessage.trim() || selectedImage) {
        saveAnswer(inputMessage, selectedImage || undefined, earthNumber);
      }

      // Check if response has already been shown for this Earth
      if (responseShown[earthNumber]) {
        // Response already shown, just add player message and don't process response again
        setMessages(prev => {
          const newPlayerMessage = {
            id: prev.length + 1,
            sender: 'player' as const,
            text: inputMessage,
            imageUrl: selectedImage || undefined
          };
          const updatedMessages = [...prev, newPlayerMessage];
          
          // Update chat history
          setChatHistory(prevHistory => ({
            ...prevHistory,
            [earthNumber]: sanitizeMessages(updatedMessages)
          }));
          
          return updatedMessages;
        });
        setInputMessage('');
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      // Check if all initial messages have been shown
      const initialMessages = dialog.initialMessages || [];
      const allInitialShown = currentMessageIndex >= initialMessages.length;
      
      // If initial messages are not all shown, show remaining ones first
      if (!allInitialShown) {
        // Save answer (text and/or image) for initial messages
        if (inputMessage.trim() || selectedImage) {
          saveAnswer(inputMessage, selectedImage || undefined, earthNumber);
        }
        
        // Add player message first
        setMessages(prev => {
          const newPlayerMessage = {
            id: prev.length + 1,
            sender: 'player' as const,
            text: inputMessage,
            imageUrl: selectedImage || undefined
          };
          const updatedMessages = [...prev, newPlayerMessage];
          
          setChatHistory(prevHistory => ({
            ...prevHistory,
            [earthNumber]: sanitizeMessages(updatedMessages)
          }));
          
          return updatedMessages;
        });
        setInputMessage('');
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setTimeout(() => {
          setMessages(currentMessages => {
            // Count how many initial messages have been shown
            const initialShownCount = currentMessages.filter(m => 
              m.sender === 'ultraman' && 
              initialMessages.some((im: any) => 
                (im.text && m.text === im.text) || 
                (im.imageUrl && m.imageUrl === im.imageUrl)
              )
            ).length;

            if (initialShownCount < initialMessages.length && !waitingForLinkClickRef.current[earthNumber]) {
              setCurrentMessageIndex(initialShownCount);
              showNextMessage(initialShownCount, initialMessages, earthNumber);
            } else if (initialShownCount >= initialMessages.length) {
              setIsProcessingResponse(true);
              setResponseShown(prev => ({ ...prev, [earthNumber]: true }));
              setTimeout(() => {
                showResponseMessages(earthNumber, dialog);
              }, 500);
            }

            return currentMessages;
          });
        }, 500);
        return;
      }

      // All initial messages shown, proceed with response
      // Set processing flag to prevent duplicate responses
      setIsProcessingResponse(true);
      setResponseShown(prev => ({ ...prev, [earthNumber]: true }));

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

      // Show response messages
      showResponseMessages(earthNumber, dialog);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleUpgrade = (stat: 'atk' | 'hp' | 'agi') => {
    if (points <= 0) return;
    setPoints((prev) => prev - 1);
    if (stat === 'atk') setAtk((prev) => prev + 1);
    if (stat === 'hp') setHp((prev) => prev + 1);
    if (stat === 'agi') setAgi((prev) => prev + 1);
  };

  return (
    <main className="relative flex min-h-screen overflow-hidden space-background">
      {/* Content */}
      <div className="relative z-10 w-full h-screen flex flex-col">
        {/* Top-Left: Back Button and Basic Unity Text */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
          {/* Back Button */}
          <Link 
            href="/"
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
          
          {/* Basic Unity Text */}
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
            Basic Unity
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
                src="/Asset/Page2/สำเนาของ สำเนาของ Py highschool camp level 1 (1920 × 1080px).png"
                alt="Earth"
                width={1920}
                height={1080}
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

        {/* Bottom-Right Icon - Circular with Bar Chart/Equalizer - Clickable Upgrade Button */}
        <div className="absolute bottom-4 right-4 z-20">
          <button
            onClick={() => setShowUpgrade(true)}
            className="cursor-pointer hover:scale-110 transition-transform duration-300"
            style={{ imageRendering: 'pixelated' }}
          >
            <div className="relative w-16 h-16">
              {/* Circle */}
              <svg width="64" height="64" viewBox="0 0 28 28" fill="none" className="absolute">
                <circle cx="14" cy="14" r="13" stroke="white" strokeWidth="1.5" fill="none" opacity="0.9" />
              </svg>
              {/* Bar Chart inside circle - 3 bars increasing height */}
              <svg width="64" height="64" viewBox="0 0 24 24" fill="white" className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px' }} opacity="0.9">
                <rect x="4" y="15" width="2.5" height="5" />
                <rect x="8.5" y="12" width="2.5" height="8" />
                <rect x="13" y="8" width="2.5" height="12" />
              </svg>
            </div>
          </button>
        </div>

        {/* Next Button - Show when Earth 6 is completed */}
        {earth6Completed && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
            <Link 
              href="/UnityAsset"
              className="cursor-pointer hover:scale-110 transition-transform duration-300"
            >
              <Image
                src="/Asset/Page2/เรียน (1) 4.png"
                alt="Next"
                width={100}
                height={100}
                className="object-contain"
                style={{ imageRendering: 'pixelated', width: 'auto', height: 'auto' }}
                priority
              />
            </Link>
          </div>
        )}
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
              <h1 className="text-white text-4xl font-bold" style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}>
                Quest
              </h1>
            </div>

            {/* Mission Complete Overlay */}
            {showMissionComplete && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                {/* Black semi-transparent background */}
                <div className="absolute inset-0 bg-black/50" />
                {/* Mission Complete Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)] mb-6" style={{ fontFamily: 'monospace', textShadow: '0 0 20px rgba(74,222,128,0.8), 0 0 40px rgba(74,222,128,0.6)' }}>
                      <div>Mission</div>
                      <div>Complete</div>
                    </div>
                    {/* Rewards */}
                    <div className="text-3xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" style={{ fontFamily: 'monospace', textShadow: '0 0 15px rgba(250,204,21,0.8), 0 0 30px rgba(250,204,21,0.6)' }}>
                      <div>+ 10 Hamster Coin</div>
                      <div>+ 5 Skill Point</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages Area */}
            <div className="absolute top-20 left-0 right-0 bottom-24 overflow-y-auto px-4 pb-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.sender === 'player' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Profile Icon */}
                  {message.sender === 'ultraman' ? (
                    <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                      <Image
                        src="/Asset/Max.png"
                        alt="Mr.MaX"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-400 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
                  )}
                  
                  <div className={`flex flex-col ${message.sender === 'player' ? 'items-end' : 'items-start'} max-w-[70%]`}>
                    {/* Name */}
                    <div className="text-white text-sm mb-1" style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}>
                      {message.sender === 'ultraman' ? 'Mr.MaX' : getPlayerName()}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className="bg-white rounded-lg px-4 py-2 text-black text-sm" style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}>
                      {/* Image if present */}
                      {message.imageUrl && (
                        <div className="mb-2 rounded-lg overflow-hidden">
                          {message.imageUrl.endsWith('.gif') ? (
                            <img
                              src={message.imageUrl}
                              alt="Sent image"
                              className="object-contain max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ imageRendering: 'pixelated', maxWidth: '300px', maxHeight: '300px' }}
                              onClick={() => setEnlargedImage(message.imageUrl!)}
                            />
                          ) : (
                            <Image
                              src={message.imageUrl}
                              alt="Sent image"
                              width={300}
                              height={300}
                              className="object-contain max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ imageRendering: 'pixelated' }}
                              onClick={() => setEnlargedImage(message.imageUrl!)}
                            />
                          )}
                        </div>
                      )}
                      {/* Text message */}
                      {message.text && (
                        message.sender === 'ultraman' ? (
                          <TypingText 
                            key={`${message.id}-${message.text}`}
                            text={message.text} 
                            speed={30} 
                            onLinkClick={handleLinkClick} 
                            skipTyping={currentEarth ? (skipTyping[currentEarth] === true) : false}
                            onTypingComplete={message.onComplete}
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
                style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}
              />
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                className="bg-gray-300 hover:bg-gray-400 rounded-lg px-6 h-12 flex items-center gap-2 text-sm transition-colors"
                style={{ fontFamily: 'monospace', imageRendering: 'pixelated' }}
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

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90"
            onClick={() => setEnlargedImage(null)}
          />
          
          {/* Enlarged Image */}
          <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            {enlargedImage.endsWith('.gif') ? (
              <img
                src={enlargedImage}
                alt="Enlarged image"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                style={{ imageRendering: 'pixelated' }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <Image
                src={enlargedImage}
                alt="Enlarged image"
                width={1200}
                height={1200}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                style={{ imageRendering: 'pixelated' }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {/* Close Button */}
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/70 hover:bg-black/90 text-white text-2xl font-bold rounded-full flex items-center justify-center transition-colors"
              aria-label="Close image"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Stat Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowUpgrade(false)}
          />
          
          {/* Upgrade Modal */}
          <div className="relative w-full max-w-2xl mx-4 rounded-3xl bg-black/80 border-2 border-cyan-400 shadow-2xl text-white px-8 py-10" style={{ imageRendering: 'pixelated' }}>
            {/* Close Button */}
            <button
              onClick={() => setShowUpgrade(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-bold"
              aria-label="Close upgrade panel"
            >
              ✕
            </button>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/60" style={{ fontFamily: 'monospace' }}>Stat</p>
                <h2 className="text-3xl font-extrabold" style={{ fontFamily: 'monospace' }}>Spaceship Upgrades</h2>
              </div>
              <div className="text-right">
                <p className="text-sm uppercase tracking-widest text-white/60" style={{ fontFamily: 'monospace' }}>My Points</p>
                <p className="text-3xl font-extrabold text-yellow-400">{points}</p>
              </div>
            </div>

            {/* Upgrade Rows */}
            <div className="space-y-6">
              <UpgradeRow
                label="Atk"
                value={atk}
                description="Increases bullet damage"
                onIncrement={() => handleUpgrade('atk')}
                disabled={points <= 0}
              />
              <UpgradeRow
                label="Hp"
                value={hp}
                description="Raises maximum health"
                onIncrement={() => handleUpgrade('hp')}
                disabled={points <= 0}
              />
              <UpgradeRow
                label="Agi"
                value={agi}
                description="Boosts speed & fire rate"
                onIncrement={() => handleUpgrade('agi')}
                disabled={points <= 0}
              />
            </div>

            {/* Footer Info */}
            <p className="mt-8 text-sm text-white/60" style={{ fontFamily: 'monospace' }}>
              Each stat starts at 10. Allocate points to tailor your ship. Upgrades apply to every level.
            </p>
          </div>
        </div>
      )}

      {/* Boss Fight Modal - Level 1 */}
      {showBossFight && (
        <div className="fixed inset-0 z-50 bg-black w-screen h-screen">
          <div className="relative w-full h-full">
            {/* Boss Fight Game */}
            <LevelOne
              playerStats={playerStats}
              onLevelComplete={() => {
                // Boss fight won - unlock the appropriate planet based on which Earth triggered it
                setBossFightCompleted(true);
                setShowBossFight(false);
                
                // Determine which planet to unlock based on which Earth triggered the boss fight
                const planetToUnlock = bossFightTriggerEarth === 2 ? 3 : 5;
                
                if (!unlockedPlanets.includes(planetToUnlock)) {
                  setUnlockedPlanets([...unlockedPlanets, planetToUnlock]);
                  // Award rewards: +10 Hamster Coin & +5 Skill Points
                  setHamsterCoin(prev => prev + 10);
                  setPoints(prev => prev + 5);
                  // Show Mission Complete overlay
                  setShowMissionComplete(true);
                  // Hide overlay after 3 seconds
                  setTimeout(() => {
                    setShowMissionComplete(false);
                  }, 3000);
                }
                
                // Reset the trigger Earth
                setBossFightTriggerEarth(null);
              }}
              onPlayerDefeated={() => {
                // Boss fight lost - player can retry
                // Don't unlock the planet, but allow them to try again
                setShowBossFight(false);
                // Reset the trigger Earth so they can retry
                setBossFightTriggerEarth(null);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}

