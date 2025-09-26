import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
interface MarkdownRendererProps {
  content: string;
  className?: string;
}
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-invert prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customize components here if needed in the future
          // For now, we rely on the CSS styles in index.css
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}