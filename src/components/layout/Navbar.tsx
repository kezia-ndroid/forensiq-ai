import React, { useState, useEffect } from 'react';
import { Menu, X, Shield, ArrowRight } from 'lucide-react';
import { BRAND_NAME, NAV_ITEMS } from '../../utils/constants';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#0c0716]/90 backdrop-blur-md border-b border-purple-900/60 shadow-lg shadow-black/60 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Name */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#home');
            }}
            className="flex items-center gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-pink-400 rounded-lg p-1"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-pink-600/30 border border-purple-500/40 group-hover:border-pink-400 transition-colors shadow-sm shadow-purple-950/50">
              <Shield className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 rounded-xl bg-pink-500/10 blur-sm group-hover:bg-pink-500/20 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                {BRAND_NAME}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-950/90 text-pink-300 border border-purple-700/60 uppercase tracking-wider">
                  v1.0 Ready
                </span>
              </span>
              <span className="text-[11px] text-purple-300/80 hidden sm:inline-block">
                Detect • Understand • Verify
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.href);
                }}
                className="px-3 py-2 text-sm font-medium text-purple-200/80 hover:text-pink-300 hover:bg-purple-950/60 rounded-lg transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleNavClick('#analyze')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Analyze Media
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-purple-300 hover:text-white hover:bg-purple-900/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 pb-4 border-t border-purple-900/60 bg-[#140a27]/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-purple-800/60 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.href);
                  }}
                  className="px-3 py-2.5 text-base font-medium text-purple-100 hover:text-pink-300 hover:bg-purple-900/70 rounded-lg transition-colors"
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-3 mt-2 border-t border-purple-900/80">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => handleNavClick('#analyze')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Analyze Media
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
