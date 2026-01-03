'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel">
      {/* Navigation */}
      <nav className="border-b border-game-accent bg-game-bg/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">
                Coding<span className="text-game-highlight">Crazy</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="w-20 h-9 bg-game-accent/50 rounded animate-pulse" />
              ) : isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="btn bg-game-highlight text-white hover:bg-game-highlight/80"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="btn bg-game-highlight text-white hover:bg-game-highlight/80"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Learn to Code by{' '}
              <span className="text-game-highlight">Playing</span>
            </h1>
            <p className="mt-6 text-xl text-gray-300 leading-relaxed">
              Master programming through fun, interactive challenges. Write
              real JavaScript code to control characters, solve puzzles, and
              level up your coding skills.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={isAuthenticated ? '/dashboard' : '/auth/signup'}
                className="btn bg-game-highlight text-white hover:bg-game-highlight/80 text-lg px-8 py-3"
              >
                Start Learning
              </Link>
              <a
                href="#features"
                className="btn bg-game-accent text-white hover:bg-game-accent/80 text-lg px-8 py-3"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Game Preview Placeholder */}
          <div className="relative">
            <div className="aspect-square max-w-lg mx-auto bg-game-panel rounded-xl border-2 border-game-accent shadow-2xl overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 p-4">
                {Array.from({ length: 64 }).map((_, i) => {
                  const x = i % 8;
                  const y = Math.floor(i / 8);
                  const isStart = x === 0 && y === 3;
                  const isGoal = x === 7 && y === 3;
                  const isWall = (x === 3 && y > 0 && y < 6);
                  const isCoin = (x === 2 && y === 3) || (x === 5 && y === 3);

                  return (
                    <div
                      key={i}
                      className={`rounded ${
                        isStart
                          ? 'bg-blue-500'
                          : isGoal
                          ? 'bg-green-500'
                          : isWall
                          ? 'bg-gray-600'
                          : isCoin
                          ? 'bg-yellow-400'
                          : 'bg-game-accent/30'
                      }`}
                    />
                  );
                })}
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
                <code className="text-green-400 text-sm font-mono">
                  hero.move(&quot;right&quot;);
                </code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-game-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why CodingCrazy?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              title="Real Code, Real Skills"
              description="Write actual JavaScript code that executes. No drag-and-drop blocks - learn syntax that transfers to real programming."
              icon="code"
            />
            <FeatureCard
              title="Progressive Challenges"
              description="Start with simple movements and work up to loops, conditionals, and algorithms. Each level builds on what you've learned."
              icon="trending-up"
            />
            <FeatureCard
              title="Instant Feedback"
              description="See your code run step-by-step. Watch your character move, collect coins, and reach goals as your code executes."
              icon="play"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <StepCard
              step={1}
              title="Read the Challenge"
              description="Each level presents a puzzle with clear objectives and hints."
            />
            <StepCard
              step={2}
              title="Write Your Code"
              description="Use the code editor to write JavaScript commands for your hero."
            />
            <StepCard
              step={3}
              title="Run & Watch"
              description="Execute your code and watch your hero follow your instructions."
            />
            <StepCard
              step={4}
              title="Level Up"
              description="Complete challenges to unlock new levels and learn new concepts."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-game-accent">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Start Your Coding Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of learners mastering programming through play.
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/auth/signup'}
            className="btn bg-game-highlight text-white hover:bg-game-highlight/80 text-lg px-10 py-4"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-game-bg border-t border-game-accent py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">
              &copy; 2024 CodingCrazy. Learn to code by playing.
            </span>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                About
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  const icons: Record<string, JSX.Element> = {
    code: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    'trending-up': (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    play: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="bg-game-panel rounded-xl p-6 border border-game-accent hover:border-game-highlight transition-colors">
      <div className="w-12 h-12 bg-game-highlight/20 rounded-lg flex items-center justify-center text-game-highlight mb-4">
        {icons[icon]}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-game-highlight rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
