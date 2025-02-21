'use client';

import { useFormStatus } from 'react-dom';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} type='submit'>
      {pending && <Loader2 className='animate-spin' />}提交取链
    </Button>
  );
}
