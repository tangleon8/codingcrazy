'use client';

interface ConsoleProps {
  output: string[];
  error?: string;
}

export default function Console({ output, error }: ConsoleProps) {
  return (
    <div className="bg-black rounded-lg p-4 font-mono text-sm h-full overflow-auto dark-scrollbar">
      {output.length === 0 && !error && (
        <div className="text-gray-500 italic">Console output will appear here...</div>
      )}
      {output.map((line, index) => (
        <div key={index} className="text-green-400 whitespace-pre-wrap">
          {line}
        </div>
      ))}
      {error && (
        <div className="text-red-400 mt-2 whitespace-pre-wrap">
          Error: {error}
        </div>
      )}
    </div>
  );
}
