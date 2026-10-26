import {
  AudioLines, Baby, BadgeCheck, Bot, Briefcase, ChartLine, Clapperboard, Code, FileText, Film, Headset, Image, Megaphone,
  Mic, Music, Notebook, Palette, Receipt, Scissors, Search, Smartphone, Sparkles, Table, TrendingUp, Tv, Users, WandSparkles,
  Workflow, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "audio-lines": AudioLines, baby: Baby, verified: BadgeCheck, bot: Bot, briefcase: Briefcase, chart: ChartLine,
  clapperboard: Clapperboard, code: Code, "file-text": FileText, film: Film, headset: Headset, image: Image,
  megaphone: Megaphone, mic: Mic, music: Music, notebook: Notebook, palette: Palette, receipt: Receipt, scissors: Scissors,
  search: Search, smartphone: Smartphone, sparkles: Sparkles, table: Table, "trending-up": TrendingUp, tv: Tv, users: Users,
  wand: WandSparkles, workflow: Workflow,
};

export const ICON_NAMES = Object.keys(ICONS);

export function ServiceIcon({ name, className, strokeWidth = 1.6 }: { name: string; className?: string; strokeWidth?: number }) {
  const Cmp = ICONS[name] ?? Sparkles;
  return <Cmp className={className} strokeWidth={strokeWidth} aria-hidden />;
}
