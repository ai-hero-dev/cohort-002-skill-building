import React, { type ReactNode } from 'react';
import type { UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';

export const Wrapper = (props: {
  children: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {props.children}
    </div>
  );
};

export const Message = ({
  role,
  parts,
}: {
  role: string;
  parts: UIMessage['parts'];
}) => (
  <div className="prose prose-invert my-6">
    <ReactMarkdown>
      {(role === 'user' ? 'User: ' : 'AI: ') +
        parts
          .map((part) => {
            if (part.type === 'text') {
              return part.text;
            }
            return '';
          })
          .join('')}
    </ReactMarkdown>
  </div>
);

export const ChatInput = ({
  input,
  onChange,
  onSubmit,
  disabled,
}: {
  input: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  disabled?: boolean;
}) => (
  <form onSubmit={onSubmit}>
    <input
      className={`fixed bottom-0 w-full max-w-md p-2 mb-8 border-2 border-zinc-700 rounded shadow-xl bg-gray-800 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      value={input}
      placeholder={
        disabled
          ? 'Please handle tool calls first...'
          : 'Say something...'
      }
      onChange={onChange}
      disabled={disabled}
      autoFocus
    />
  </form>
);
