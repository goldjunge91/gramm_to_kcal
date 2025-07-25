"use client";

import type { VariantProps } from "class-variance-authority";

import { LoaderCircleIcon } from "lucide-react";
import { forwardRef } from "react";

import { Button, type buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LoadingButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  loadingText?: string;
  asChild?: boolean;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    { className, children, loading = false, loadingText, disabled, ...props },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        data-loading={loading || undefined}
        className={cn("group relative disabled:opacity-100", className)}
        {...props}
      >
        <span className={cn("transition-opacity", loading && "opacity-0")}>
          {loading && loadingText ? loadingText : children}
        </span>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircleIcon
              className="animate-spin"
              size={16}
              aria-hidden="true"
            />
          </div>
        )}
      </Button>
    );
  },
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
