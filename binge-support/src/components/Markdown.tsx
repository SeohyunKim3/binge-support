'use client';
import ReactMarkdown from 'react-markdown';

export default function Markdown({ content }: { content: string }) {
  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '12px 14px',
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}
    >
      <ReactMarkdown>{content || ''}</ReactMarkdown>
    </div>
  );
}