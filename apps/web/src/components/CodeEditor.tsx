'use client';

import { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  isReadOnly?: boolean;
  allowedMethods?: string[];
}

export default function CodeEditor({
  code,
  onChange,
  isReadOnly = false,
  allowedMethods = ['move', 'wait'],
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure JavaScript defaults
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    // Add type definitions for the hero API
    const heroTypeDef = `
      interface Hero {
        ${allowedMethods.includes('move') ? 'move(direction: "up" | "down" | "left" | "right"): void;' : ''}
        ${allowedMethods.includes('wait') ? 'wait(): void;' : ''}
      }
      declare const hero: Hero;
      declare const console: { log(...args: any[]): void; error(...args: any[]): void; warn(...args: any[]): void; };
    `;

    monaco.languages.typescript.javascriptDefaults.addExtraLib(heroTypeDef, 'hero.d.ts');

    // Set editor options
    editor.updateOptions({
      minimap: { enabled: false },
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Fira Code, monospace',
      tabSize: 2,
      wordWrap: 'on',
      automaticLayout: true,
      padding: { top: 16, bottom: 16 },
    });
  };

  const handleChange = (value: string | undefined) => {
    onChange(value || '');
  };

  return (
    <div className="h-full rounded-lg overflow-hidden border border-game-accent">
      <Editor
        height="100%"
        defaultLanguage="javascript"
        value={code}
        onChange={handleChange}
        onMount={handleEditorMount}
        theme="vs-dark"
        options={{
          readOnly: isReadOnly,
        }}
      />
    </div>
  );
}
