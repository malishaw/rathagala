import Link from "next/link";
import { CarIcon, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const footerLinks = {
  quickLinks: [
    { href: "/signin", label: "Login" },
    { href: "/signup", label: "Register" },
    { href: "/profile", label: "My Account" },
    { href: "/sell/new", label: "Post Free Ad" },
  ],
  features: [
    { href: "/search?listingType=SELL", label: "Buy Vehicles" },
    { href: "/search?listingType=RENT", label: "Rent Vehicles" },
    { href: "/compare", label: "Compare" },
    { href: "/analyse", label: "Analyze Trends" },
    { href: "/auto-parts", label: "Auto Parts" },
  ],
  support: [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
  ],
};

const socialLinks = [
  { href: "https://www.facebook.com/rathagala", Icon: Facebook, label: "Facebook" },
  { href: "https://www.instagram.com/rathagala", Icon: Instagram, label: "Instagram" },
  { href: "https://www.twitter.com/rathagala", Icon: Twitter, label: "Twitter" },
  { href: "https://www.youtube.com/@rathagala", Icon: Youtube, label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="bg-[#012a30] text-white">
      {/* Top accent line matching header brand color */}
      <div className="h-0.5 bg-gradient-to-r from-teal-700 via-teal-400 to-teal-700" />

      <div className="container mx-auto px-4 pt-10 pb-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
              <div className="bg-teal-500/20 p-1.5 rounded-md group-hover:bg-teal-500/30 transition-colors">
                <CarIcon className="h-5 w-5 text-teal-400" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Rathagala<span className="text-teal-400">.lk</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-[220px]">
              Sri Lanka's trusted vehicle marketplace — buy, sell, rent &amp; hire with confidence.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socialLinks.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-teal-800/40 text-slate-400 hover:bg-teal-500 hover:text-white transition-colors duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">
              Features
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.features.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors duration-150"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-teal-900/60 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Rathagala.lk. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
