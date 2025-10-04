'use client';
import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ breaks: true, gfm: true });

export default function Markdown({ md, className }: { md?: string|null, className?: string }) {
  const html = useMemo(() => {
    if (!md) return '';
    const raw = marked.parse(md);
    return DOMPurify.sanitize(typeof raw === 'string' ? raw : raw.toString());
  }, [md]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}