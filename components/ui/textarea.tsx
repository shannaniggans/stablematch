import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, minRows, maxRows, style, ...props }, ref) => {
    const blockStyle: React.CSSProperties = {
      ...style,
    };
    if (minRows !== undefined) {
      blockStyle.minHeight = `calc(${minRows} * 1.5rem)`;
    }
    if (maxRows !== undefined) {
      blockStyle.maxHeight = `calc(${maxRows} * 1.5rem)`;
    }
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        style={blockStyle}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export { Textarea };
