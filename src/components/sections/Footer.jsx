import React from 'react';
import { Link } from 'react-router-dom';
import LogoLockup from '../brand/LogoLockup';

export default function Footer() {
  return (
    <footer className="bg-black/40 border-t border-white/5 pt-16 pb-8 px-4 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="mb-6">
            <LogoLockup variant="footer" />
          </div>
          <p className="text-muted text-sm leading-relaxed mb-6 font-light">
            A premium private messaging app where you choose your personal chat vibe before downloading.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-bold mb-4 font-heading tracking-wide">Product</h4>
          <ul className="space-y-3">
            <li><a href="#features" className="text-muted text-sm hover:text-white transition-colors font-light">Features</a></li>
            <li><a href="#themes" className="text-muted text-sm hover:text-white transition-colors font-light">Themes</a></li>
            <li><a href="/downloads/orvix-calls-v2.apk" className="text-primary text-sm hover:text-primary/80 transition-colors font-medium">Download APK</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 font-heading tracking-wide">Security & Support</h4>
          <ul className="space-y-3">
            <li><a href="#security" className="text-muted text-sm hover:text-white transition-colors font-light">Privacy Architecture</a></li>
            <li><a href="#faq" className="text-muted text-sm hover:text-white transition-colors font-light">FAQ</a></li>

          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 font-heading tracking-wide">Connect</h4>
          <ul className="space-y-3">
            <li><a href="#" className="text-muted text-sm hover:text-white transition-colors font-light">Twitter / X</a></li>
            <li><a href="#" className="text-muted text-sm hover:text-white transition-colors font-light">Support</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between">
        <div className="flex flex-col md:flex-row items-center md:space-x-4 text-center md:text-left">
          <p className="text-muted text-xs font-light">
            &copy; {new Date().getFullYear()} Orvix. All rights reserved.
          </p>
          <span className="hidden md:inline text-white/10">•</span>
          <p className="text-muted text-xs font-light mt-2 md:mt-0">
            Founder: Jagadesh <span className="mx-1">•</span> Font credit: Online Web Fonts
          </p>
        </div>
        <div className="flex items-center space-x-6 mt-6 md:mt-0">
          <a href="#" className="text-muted text-xs hover:text-white transition-colors font-light">Privacy</a>
          <a href="#" className="text-muted text-xs hover:text-white transition-colors font-light">Terms</a>
        </div>
      </div>
    </footer>
  );
}
