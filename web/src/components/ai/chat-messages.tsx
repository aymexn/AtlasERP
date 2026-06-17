'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageContentProps {
  content: string;
}

export default function ChatMessageContent({ content }: ChatMessageContentProps) {
  if (!content) return null;

  return (
    <div className="prose prose-slate max-w-none text-sm text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm bg-white dark:bg-slate-900">
              <table className="w-full text-left border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2.5 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/80" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" {...props} />
          ),
          h1: ({ node, ...props }) => <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-3 mb-1.5" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-2 mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="my-1.5 text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="marker:text-blue-500 font-medium" {...props} />,
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            return isInline ? (
              <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          strong: ({ node, ...props }) => <strong className="font-extrabold text-slate-900 dark:text-white" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
