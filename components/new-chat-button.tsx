'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps, buttonVariants } from '@/components/ui/button'
import { IconPlus } from '@/components/ui/icons'

export function NewChatButton({
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      onClick={(event) => {
        const router = useRouter()
        event.preventDefault()
        router.refresh()
        router.push('/');
      }}
      className={cn(
        buttonVariants({ size: 'sm', variant: 'secondary' }),
        'ml-2'
      )}
    >
      <IconPlus />
      <span className="ml-2">New Chat</span>
    </Button>
  )
}
