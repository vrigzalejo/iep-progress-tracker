import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-sm transition-colors [&_svg]:pointer-events-none disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 min-h-11 px-4",
  {
    variants: {
      variant: {
        primary: "bg-forest text-white hover:bg-forest-deep",
        secondary: "border border-border bg-white text-ink hover:bg-paper",
        ghost: "shadow-none text-forest hover:bg-paper",
        link: "h-auto min-h-0 rounded-none px-0 shadow-none text-forest hover:bg-transparent hover:underline",
        danger: "bg-danger text-white hover:bg-[#6f1c26]",
      },
      size: {
        default: "",
        sm: "min-h-10 px-3.5",
        icon: "h-11 w-11 p-0",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        class: "h-auto min-h-0 px-0 shadow-none",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
