import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Asset/Rectangle 1.png"
          alt="Cosmic background"
          fill
          className="object-cover"
          priority
        />
      </div>

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

        {/* Bottom Section - Start Button */}
        <div className="pb-12 cursor-pointer hover:scale-110 transition-transform duration-300">
          <Image
            src="/Asset/Start.png"
            alt="Start"
            width={300}
            height={120}
            className="object-contain drop-shadow-lg w-auto h-auto"
            priority
          />
        </div>
      </div>
    </main>
  );
}

