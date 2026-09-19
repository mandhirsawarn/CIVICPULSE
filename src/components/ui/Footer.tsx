import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, PhoneCall, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand & Purpose */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white leading-none">
                  Civic<span className="text-blue-400">Pulse</span>
                </span>
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                  Citizen Intelligence
                </span>
              </div>
            </Link>
            
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-powered civic issue reporting and collaborative resolution.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CivicPulse Platform • Prototype</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-400 hover:text-white transition-colors">Explore Map</Link>
              </li>
              <li>
                <Link to="/community-pulse" className="text-slate-400 hover:text-white transition-colors">Community Pulse</Link>
              </li>
              <li>
                <Link to="/my-reports" className="text-slate-400 hover:text-white transition-colors">My Reports</Link>
              </li>
              <li>
                <Link to="/collaboration" className="text-slate-400 hover:text-white transition-colors">Collaboration</Link>
              </li>
              <li>
                <Link to="/docs" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1">
                  <span>Docs</span>
                  <ArrowUpRight size={13} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency & Municipal Notice */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Emergency Assistance</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              For immediate danger or emergencies:
            </p>
            <a 
              href="tel:112"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <PhoneCall size={16} />
              <span>Call 112</span>
            </a>

            <div className="pt-2 text-[11px] text-slate-400">
              <Link to="/admin/login" className="text-slate-400 hover:text-blue-400 underline transition-colors">
                Authority Portal →
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>Team Xieron • CivicPulse Prototype</p>
          <div className="flex items-center gap-4">
            <Link to="/docs#privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>•</span>
            <Link to="/docs#faq" className="hover:text-white transition-colors">FAQ</Link>
            <span>•</span>
            <span className="text-slate-400">Civic-Tech Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
