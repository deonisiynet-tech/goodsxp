'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Введіть опис товару...',
  error,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold',
    'italic',
    'list',
    'bullet',
  ];

  if (!mounted) {
    return (
      <div className="input-field min-h-[200px] flex items-center justify-center text-muted">
        Завантаження редактора...
      </div>
    );
  }

  return (
    <div className="rich-text-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="rich-text-editor"
      />
      {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

      <style jsx global>{`
        .rich-text-editor-wrapper {
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .rich-text-editor .ql-toolbar {
          background: #1f1f23;
          border: 1px solid #2d2d32;
          border-bottom: none;
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .rich-text-editor .ql-container {
          background: #18181c;
          border: 1px solid #2d2d32;
          border-radius: 0 0 0.5rem 0.5rem;
          min-height: 200px;
          font-size: 14px;
          color: #e5e7eb;
        }

        .rich-text-editor .ql-editor {
          min-height: 200px;
          color: #e5e7eb;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #6b7280;
          font-style: normal;
        }

        /* Toolbar buttons */
        .rich-text-editor .ql-toolbar button {
          color: #9ca3af;
        }

        .rich-text-editor .ql-toolbar button:hover {
          color: #a855f7;
        }

        .rich-text-editor .ql-toolbar button.ql-active {
          color: #a855f7;
        }

        .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #9ca3af;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #a855f7;
        }

        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #a855f7;
        }

        .rich-text-editor .ql-toolbar .ql-fill {
          fill: #9ca3af;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #a855f7;
        }

        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #a855f7;
        }

        /* Picker labels */
        .rich-text-editor .ql-toolbar .ql-picker-label {
          color: #9ca3af;
        }

        .rich-text-editor .ql-toolbar .ql-picker-label:hover {
          color: #a855f7;
        }

        .rich-text-editor .ql-toolbar .ql-picker-label.ql-active {
          color: #a855f7;
        }

        /* Dropdown */
        .rich-text-editor .ql-toolbar .ql-picker-options {
          background: #1f1f23;
          border: 1px solid #2d2d32;
        }

        .rich-text-editor .ql-toolbar .ql-picker-item {
          color: #9ca3af;
        }

        .rich-text-editor .ql-toolbar .ql-picker-item:hover {
          color: #a855f7;
        }

        /* Editor content styles */
        .rich-text-editor .ql-editor h1 {
          font-size: 2em;
          font-weight: 600;
          margin-bottom: 0.5em;
          color: #ffffff;
        }

        .rich-text-editor .ql-editor h2 {
          font-size: 1.5em;
          font-weight: 600;
          margin-bottom: 0.5em;
          color: #ffffff;
        }

        .rich-text-editor .ql-editor h3 {
          font-size: 1.25em;
          font-weight: 600;
          margin-bottom: 0.5em;
          color: #ffffff;
        }

        .rich-text-editor .ql-editor strong {
          font-weight: 600;
          color: #ffffff;
        }

        .rich-text-editor .ql-editor em {
          font-style: italic;
        }

        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
          margin-bottom: 1em;
        }

        .rich-text-editor .ql-editor li {
          margin-bottom: 0.25em;
        }

        .rich-text-editor .ql-editor p {
          margin-bottom: 1em;
        }
      `}</style>
    </div>
  );
}
