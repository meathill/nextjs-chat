import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground',
        className
      )}
      {...props}
    >
      Open source AI ChatBot crafted by{' '}
      <ExternalLink href="https://blog.meathill.com/">Meathill</ExternalLink>, based on{' '}
      <ExternalLink href="https://github.com/vercel-labs/ai-chatbot">
        Vercel AI ChatBot
      </ExternalLink>
      .
    </p>
  )
}
