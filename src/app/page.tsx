import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden space-background">

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between w-full h-screen">
        {/* Top Section - Title and Thai Text */}
        <div className="flex flex-col items-center pt-12 pb-8">
          {/* Hamstellar Title */}
          <div className="mb-6">
            <Image
              src="/Asset/เรียน 1.png"
              alt="Hamstellar"
              width={1000}
              height={250}
              className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] w-auto h-auto max-w-[90vw]"
              priority
            />
          </div>

          {/* Thai Text */}
          <div>
            <Image
              src="/Asset/ปกป้องโลกจากภัยร้าย.png"
              alt="ปกป้องโลกจากภัยร้าย"
              width={600}
              height={100}
              className="object-contain w-auto h-auto max-w-[80vw]"
              priority
            />
          </div>
        </div>

        {/* Start Button - Centered */}
        <div className="w-full flex items-center justify-center pb-10" style={{ transform: "translateY(-300px)" }}>
          <Link href="/UnityBasic" className="cursor-pointer hover:scale-110 transition-transform duration-300">
            <Image
              src="/Asset/Start.png"
              alt="Start"
              width={300}
              height={120}
              className="object-contain drop-shadow-lg"
              priority
            />
          </Link>
        </div>
      </div>
    </main>
  );
}

