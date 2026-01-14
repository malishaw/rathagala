import { CarIcon, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 to-teal-900 text-white py-10 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-3 md:mb-6">
              <CarIcon className="h-6 w-6" />
              <div className="text-2xl font-bold text-white">Rathagala.lk</div>
            </div>
            <p className="text-slate-300 leading-relaxed text-sm md:text-base">
              {`Sri Lanka's most trusted vehicle marketplace connecting buyers
                and sellers nationwide.`}
            </p>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h4 className="font-semibold mb-3 md:mb-6 text-lg">Quick Links</h4>
            <ul className="space-y-2 md:space-y-3 text-slate-300">
              <li>
                <a href="/signin" className="hover:text-white transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a href="/signup" className="hover:text-white transition-colors">
                  Register
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-white transition-colors">
                  Profile
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h4 className="font-semibold mb-3 md:mb-6 text-lg">Features</h4>
            <ul className="space-y-2 md:space-y-3 text-slate-300">
              <li>
                <a href="/compare" className="hover:text-white transition-colors">
                  Compare Vehicle
                </a>
              </li>
              <li>
                <a href="/analyze" className="hover:text-white transition-colors">
                  Analyze by Model
                </a>
              </li>
              <li>
                <a href="/profile" className="hover:text-white transition-colors">
                  Saved Ads
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h4 className="font-semibold mb-3 md:mb-6 text-lg">Support</h4>
            <ul className="space-y-2 md:space-y-3 text-slate-300">
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>

              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-1">
            <h4 className="font-semibold mb-3 md:mb-6 text-lg">Connect</h4>
            <ul className="space-y-2 md:space-y-3 text-slate-300">
              <li>
                <a href="https://www.facebook.com/rathagala" className="hover:text-white transition-colors flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              </li>
              <li>
                <a href="Rathagala.lk" className="hover:text-white transition-colors flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.twitter.com/rathagala" className="hover:text-white transition-colors flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-6 md:mt-10 pt-4 md:pt-8 text-center text-slate-400 text-sm">
          <p>&copy; 2026 Rathagala.lk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
