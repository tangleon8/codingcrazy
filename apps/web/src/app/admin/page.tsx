'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth-context';
import { api, Level, LevelListItem } from '@/lib/api';
import { validateLevelJson } from '@codingcrazy/shared';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();

  const [levels, setLevels] = useState<LevelListItem[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [jsonCode, setJsonCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch levels
  useEffect(() => {
    async function fetchLevels() {
      try {
        const data = await api.getLevels();
        setLevels(data);
        if (data.length > 0) {
          await loadLevel(data[0].slug);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load levels');
      } finally {
        setIsLoading(false);
      }
    }

    if (user?.is_admin) {
      fetchLevels();
    }
  }, [user]);

  const loadLevel = async (slug: string) => {
    try {
      const level = await api.getLevel(slug);
      setSelectedLevel(level);
      setJsonCode(JSON.stringify(level.json_data, null, 2));
      setValidationErrors([]);
      setError('');
      setSuccess('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load level');
    }
  };

  const handleJsonChange = (value: string | undefined) => {
    const newJson = value || '';
    setJsonCode(newJson);
    setSuccess('');

    // Validate as user types
    try {
      const parsed = JSON.parse(newJson);
      const result = validateLevelJson(parsed);
      setValidationErrors(result.errors || []);
    } catch {
      setValidationErrors(['Invalid JSON syntax']);
    }
  };

  const handleSave = async () => {
    if (!selectedLevel) return;

    // Parse and validate
    let parsed;
    try {
      parsed = JSON.parse(jsonCode);
    } catch {
      setError('Invalid JSON syntax');
      return;
    }

    const validation = validateLevelJson(parsed);
    if (!validation.valid) {
      setValidationErrors(validation.errors || []);
      setError('Please fix validation errors before saving');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await api.updateLevel(selectedLevel.slug, {
        json_data: parsed,
      });
      setSuccess('Level saved successfully!');

      // Reload the level to confirm changes
      await loadLevel(selectedLevel.slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save level');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-game-bg to-game-panel">
      {/* Navigation */}
      <nav className="border-b border-game-accent bg-game-bg/80 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-white">
                  Coding<span className="text-game-highlight">Crazy</span>
                </span>
              </Link>
              <span className="text-yellow-400 font-medium">Admin</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-gray-400">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Level Editor</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Level List */}
          <div className="lg:col-span-1">
            <div className="bg-game-panel rounded-xl border border-game-accent p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Levels</h2>
              {isLoading ? (
                <div className="text-gray-400">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => loadLevel(level.slug)}
                      className={`
                        w-full text-left px-4 py-3 rounded-lg transition-colors
                        ${
                          selectedLevel?.slug === level.slug
                            ? 'bg-game-highlight text-white'
                            : 'bg-game-accent/30 text-gray-300 hover:bg-game-accent/50'
                        }
                      `}
                    >
                      <div className="font-medium">#{level.order_index} {level.title}</div>
                      <div className="text-sm opacity-75">{level.slug}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* JSON Editor */}
          <div className="lg:col-span-3">
            <div className="bg-game-panel rounded-xl border border-game-accent p-4">
              {selectedLevel ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {selectedLevel.title}
                      </h2>
                      <p className="text-gray-400 text-sm">{selectedLevel.slug}</p>
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={isSaving || validationErrors.length > 0}
                      className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                      <div className="text-yellow-400 font-medium mb-2">Validation Errors:</div>
                      <ul className="list-disc list-inside text-yellow-300 text-sm">
                        {validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Monaco Editor for JSON */}
                  <div className="h-[600px] rounded-lg overflow-hidden border border-game-accent">
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={jsonCode}
                      onChange={handleJsonChange}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        tabSize: 2,
                        wordWrap: 'on',
                        automaticLayout: true,
                      }}
                    />
                  </div>

                  {/* Schema Reference */}
                  <div className="mt-4 text-gray-400 text-sm">
                    <details>
                      <summary className="cursor-pointer hover:text-white">
                        JSON Schema Reference
                      </summary>
                      <pre className="mt-2 p-4 bg-black/50 rounded-lg overflow-x-auto text-xs">
{`{
  "gridWidth": number (3-20),
  "gridHeight": number (3-20),
  "startPosition": { "x": number, "y": number },
  "goals": [{ "x": number, "y": number }],
  "walls": [{ "x": number, "y": number }],
  "coins": [{ "x": number, "y": number }],
  "hazards": [{
    "x": number, "y": number,
    "pattern": "toggle" | "static",
    "activeFrames": [number],
    "type": "spike" | "fire"
  }],
  "allowedMethods": ["move", "wait"],
  "instructions": string,
  "starterCode": string,
  "winConditions": {
    "reachGoal": boolean,
    "collectAllCoins": boolean
  }
}`}
                      </pre>
                    </details>
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-center py-12">
                  Select a level to edit
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
