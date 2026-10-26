import type { Metadata } from "next";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with the SWAPDO team." };

export default function ContactPage() {
  return (
    <div className="container-page max-w-4xl pt-28 lg:pt-36">
      <p className="text-xs font-semibold tracking-[0.24em] text-gold-300/90 uppercase">Contact</p>
      <h1 className="mt-3 text-4xl font-semibold text-ivory">We’d love to hear from you.</h1>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <a href={`mailto:${siteConfig.contact.email}`} className="glass rounded-2xl p-6 transition-colors hover:border-gold-400/30"><Mail className="h-5 w-5 text-gold-300" /><h2 className="mt-3 font-semibold text-ivory">General</h2><p className="mt-1 text-sm text-fog">{siteConfig.contact.email}</p></a>
        <a href={`mailto:${siteConfig.contact.support}`} className="glass rounded-2xl p-6 transition-colors hover:border-gold-400/30"><MessageSquare className="h-5 w-5 text-gold-300" /><h2 className="mt-3 font-semibold text-ivory">Support</h2><p className="mt-1 text-sm text-fog">{siteConfig.contact.support}</p></a>
        <div className="glass rounded-2xl p-6"><MapPin className="h-5 w-5 text-gold-300" /><h2 className="mt-3 font-semibold text-ivory">Office</h2><p className="mt-1 text-sm text-fog">{siteConfig.contact.address}</p></div>
      </div>
      <div className="mt-8"><ButtonLink href="/dashboard/support" variant="outline">Open a support ticket</ButtonLink></div>
    </div>
  );
}
