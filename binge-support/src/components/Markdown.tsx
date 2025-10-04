'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function Markdown({ content }: { content: string }) {
  return (
    <div
      style={{
        background: '#f9faf9',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #e3e8e3',
        fontSize: '14px',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        color: '#2d2d2d',
      }}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}