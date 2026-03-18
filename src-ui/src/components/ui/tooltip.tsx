/**
 * Copyright (C) 2024 sebswho
 * This file is part of Agent Skills Manager.
 * Agent Skills Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Agent Skills Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Agent Skills Manager.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined)

const useTooltip = () => {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("useTooltip must be used within a Tooltip")
  }
  return context
}

interface TooltipTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const TooltipTrigger = React.forwardRef<HTMLDivElement, TooltipTriggerProps>(
  ({ children, ...props }, ref) => {
    const { setOpen } = useTooltip()
    return (
      <div
        ref={ref}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open } = useTooltip()
    if (!open) return null
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 px-3 py-1.5 text-sm bg-popover text-popover-foreground rounded-md shadow-md border",
          "bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
