import { PageTransition } from "@/components/dashboard/page-transition";

// A template remounts on every navigation, so each public page fades in.
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
