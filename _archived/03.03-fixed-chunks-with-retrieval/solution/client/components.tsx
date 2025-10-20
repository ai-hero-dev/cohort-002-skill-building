import type { UIMessage } from 'ai';
import React from 'react';
import ReactMarkdown from 'react-markdown';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export const Wrapper = (props: {
  messages: React.ReactNode;
  input: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="flex-shrink-0 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-2">
          <h1 className="text-xs font-medium text-muted-foreground">
            Skill Building
          </h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-8 pt-6 scrollbar-thin scrollbar-track-background scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground">
        <div className="max-w-3xl mx-auto space-y-6">
          {props.messages}
        </div>
      </div>
      {props.input}
    </div>
  );
};

export const Message = ({
  role,
  parts,
}: {
  role: string;
  parts: UIMessage['parts'];
}) => {
  const isUser = role === 'user';

  return (
    <div className={cn('flex w-full', isUser && 'justify-end')}>
      <div className="flex flex-col gap-2 max-w-[60ch] w-full">
        <div
          className={cn(
            'transition-colors',
            isUser
              ? 'rounded-lg bg-accent text-accent-foreground border border-border shadow-sm px-4 py-3'
              : 'text-foreground px-4',
          )}
        >
          {parts.map((part) => {
            if (part.type === 'text') {
              return (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{part.text}</ReactMarkdown>
                </div>
              );
            }
            return '';
          })}
        </div>
      </div>
    </div>
  );
};

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  disabled,
}: {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}) => (
  <div className="flex-shrink-0 w-full border-t border-border bg-background/80 backdrop-blur-sm">
    <div className="max-w-3xl mx-auto p-4">
      <form onSubmit={onSubmit} className="relative">
        <AutoExpandingTextarea
          value={input}
          placeholder={
            disabled
              ? 'Please handle tool calls first...'
              : 'Ask a question...'
          }
          onChange={onChange}
          disabled={disabled}
          autoFocus
        />
      </form>
    </div>
  </div>
);

const AutoExpandingTextarea = ({
  value,
  onChange,
  placeholder,
  disabled,
  autoFocus,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      className={cn(
        'w-full rounded-lg border border-input bg-card px-4 py-3 text-sm shadow-sm transition-all resize-none max-h-[6lh]',
        'overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent',
        'disabled:cursor-not-allowed disabled:opacity-50',
        !disabled && 'hover:border-ring/50',
      )}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.form?.requestSubmit();
        }
      }}
      disabled={disabled}
      autoFocus={autoFocus}
    />
  );
};
