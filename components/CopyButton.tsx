'use client';

import * as React from 'react';
import { CheckIcon, ClipboardIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, ButtonProps } from './ui/button';
import { toast } from 'sonner';
import copy from 'copy-to-clipboard';

interface CopyButtonProps extends ButtonProps {
  value: string;
}

export function CopyButton({
  value,
  className,

  variant = 'outline',

  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      size='icon'
      variant={variant}
      className={cn(
        'relative z-10 h-5 w-5 [&_svg]:h-2.5 [&_svg]:w-2.5',
        className
      )}
      onClick={() => {
        copy(value);
        toast.success('复制成功');
        setHasCopied(true);
      }}
      {...props}
    >
      <span className='sr-only'>Copy</span>
      {hasCopied ? <CheckIcon /> : <ClipboardIcon />}
    </Button>
  );
}
