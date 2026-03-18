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
import * as ReactDOM from "react-dom"
import { cn } from "@/lib/utils"

type SheetSide = "top" | "bottom" | "left" | "right"

interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | undefined>(undefined)

const useSheet = () => {
  const context = React.useContext(SheetContext)
  if (!context) {
    throw new Error("Sheet components must be used within a Sheet")
  }
  return context
}

interface SheetProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

const Sheet = ({ children, open: controlledOpen, onOpenChange, defaultOpen = false }: SheetProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  
  const setOpen = React.useCallback((value: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [isControlled, onOpenChange])

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  )
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ asChild, children, ...props }, ref) => {
    const { setOpen } = useSheet()
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        onClick: (e: React.MouseEvent) => {
          children.props.onClick?.(e)
          setOpen(true)
        },
        ref,
      } as React.Attributes)
    }
    
    return (
      <button ref={ref} onClick={() => setOpen(true)} {...props}>
        {children}
      </button>
    )
  }
)
SheetTrigger.displayName = "SheetTrigger"

const SheetClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ onClick, ...props }, ref) => {
    const { setOpen } = useSheet()
    
    return (
      <button
        ref={ref}
        onClick={(e) => {
          onClick?.(e)
          setOpen(false)
        }}
        {...props}
      />
    )
  }
)
SheetClose.displayName = "SheetClose"

const SheetPortal = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  if (!mounted) return null
  
  return ReactDOM.createPortal(children, document.body)
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: SheetSide
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, children, side = "right", ...props }, ref) => {
    const { open, setOpen } = useSheet()
    
    if (!open) return null
    
    const sideClasses = {
      top: "inset-x-0 top-0 h-auto border-b",
      bottom: "inset-x-0 bottom-0 h-auto border-t",
      left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
      right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
    }
    
    return (
      <SheetPortal>
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80"
            onClick={() => setOpen(false)}
          />
          {/* Content */}
          <div
            ref={ref}
            className={cn(
              "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
              sideClasses[side],
              className
            )}
            {...props}
          >
            {children}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
      </SheetPortal>
    )
  }
)
SheetContent.displayName = "SheetContent"

interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
)
SheetHeader.displayName = "SheetHeader"

interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
)
SheetFooter.displayName = "SheetFooter"

interface SheetTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  )
)
SheetTitle.displayName = "SheetTitle"

interface SheetDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

const SheetDescription = React.forwardRef<HTMLParagraphElement, SheetDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
