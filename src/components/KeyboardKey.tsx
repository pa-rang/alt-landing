import { cn } from "@/lib/utils";

type KeyboardKeyProps = {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function KeyboardKey({ children, className, size = "md" }: KeyboardKeyProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-mono font-bold text-zinc-900 bg-gradient-to-b from-[#f7f3ea] to-[#e3ddd0] border-2 border-[#c5bfb0] rounded-lg transition-all";

  const sizeStyles = {
    // sm: "px-3 py-1 mx-1 text-base shadow-[0_3px_0_0_#b5afa0,0_4px_6px_rgba(0,0,0,0.25),inset_0_-2px_2px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.9)] hover:shadow-[0_2px_0_0_#b5afa0,0_3px_5px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]",
    // md: "px-4 py-1.5 mx-1.5 text-lg shadow-[0_3px_0_0_#b5afa0,0_4px_6px_rgba(0,0,0,0.25),inset_0_-2px_2px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.9)] hover:shadow-[0_2px_0_0_#b5afa0,0_3px_5px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]",
    // lg: "px-5 py-1.5 mx-2 text-2xl shadow-[0_4px_0_0_#b5afa0,0_5px_8px_rgba(0,0,0,0.25),inset_0_-2px_2px_rgba(0,0,0,0.08),inset_0_2px_2px_rgba(255,255,255,0.9)] hover:shadow-[0_3px_0_0_#b5afa0,0_4px_6px_rgba(0,0,0,0.2)] active:shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)]",
    sm: "px-3 py-1 mx-1 text-base shadow-[0_2px_0_0_#b5afa0,0_3px_5px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)] cursor-pointer",
    md: "px-4 py-1.5 mx-1.5 text-lg shadow-[0_2px_0_0_#b5afa0,0_3px_5px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)] cursor-pointer",
    lg: "px-5 py-1.5 mx-2 text-2xl shadow-[0_3px_0_0_#b5afa0,0_4px_6px_rgba(0,0,0,0.2)] hover:shadow-[inset_0_2px_3px_rgba(0,0,0,0.25)] cursor-pointer",
  };

  return <span className={cn(baseStyles, sizeStyles[size], className)}>{children}</span>;
}
