import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Hamsfun Project
        </h1>
        <p className="text-center text-lg mb-8">
          Your Next.js project is ready to go!
        </p>
        <div className="text-center">
          <Link
            href="/game"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            test
          </Link>
        </div>
      </div>
    </main>
  );
}

