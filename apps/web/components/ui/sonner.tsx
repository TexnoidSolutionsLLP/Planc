"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-surface group-[.toaster]:text-primary group-[.toaster]:border-border group-[.toaster]:shadow-lg   ",
          description: "group-[.toast]:text-muted ",
          actionButton:
            "group-[.toast]:bg-brand group-[.toast]:text-white  ",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-muted  ",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
