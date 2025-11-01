import { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="relative bg-[#f7f7f4] p-3 md:p-4">
      <div className="flex flex-col items-start text-left gap-2">
        <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">
          <Icon className="w-3 h-3 md:w-4 md:h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs md:text-sm font-semibold mb-1 text-zinc-800">{title}</h3>
          <p className="text-xs md:text-sm text-zinc-600 leading-tight">{description}</p>
        </div>
      </div>
    </div>
  );
}
