'use client';

import { useRouter } from 'next/navigation';

export default function Shop2DPage() {
  const router = useRouter();

  return (
    <main 
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden space-background" 
      style={{ 
        minHeight: '100vh', 
        width: '100%',
        backgroundColor: '#0a0a2e',
        position: 'relative'
      }}
    >
      <div className="text-white text-4xl font-bold z-20" style={{
        fontFamily: 'monospace',
        textShadow: '0 0 10px rgba(255,255,255,0.8)',
        imageRendering: 'pixelated',
      }}>
        2D Shop
      </div>

      {/* Back Button */}
      <button
        onClick={() => router.push('/shop')}
        className="absolute bottom-6 right-6 z-20 text-white text-2xl hover:opacity-80 transition-opacity"
        style={{
          fontFamily: 'monospace',
          textShadow: '0 0 5px rgba(255,255,255,0.8)',
        }}
      >
        [←]
      </button>
    </main>
  );
}

