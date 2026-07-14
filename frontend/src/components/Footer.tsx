import React, { useState, useEffect } from 'react';
import { Mail, Navigation, Sparkles, Check, ShieldAlert, Loader2 } from 'lucide-react';
import { fetchSiteContent, subscribeNewsletter } from '../api';
import { SiteContent } from '../types';

interface FooterProps {
  setTab: (tab: 'home' | 'menu' | 'order' | 'about' | 'contact') => void;
}

export default function Footer({ setTab }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchSiteContent()
      .then((data) => {
        if (isMounted) setContent(data);
      })
      .catch((err) => console.error('Failed to load footer content:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await subscribeNewsletter({ email });
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err) {
      console.error('Failed to subscribe to newsletter:', err);
      setSubmitError('Could not subscribe right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabChange = (tab: 'home' | 'menu' | 'order' | 'about' | 'contact') => {
    setTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary text-white font-sans mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-16 space-y-12">
        
        {/* Main Footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand info */}
          <div className="space-y-4">
            <button 
              onClick={() => handleTabChange('home')}
              className="font-serif text-3xl font-extrabold text-white tracking-tight cursor-pointer block text-left hover:opacity-90"
            >
              Meltaro
            </button>
            <p className="text-xs text-white/75 leading-relaxed">
              Premium woodland café and artisan bakery serving slow-fermented crusty breads and micro-lot specialty single origin brews.
            </p>
            <div className="flex gap-1.5 items-center text-[10px] uppercase font-bold text-tertiary-fixed-dim/95 tracking-widest">
              <Sparkles className="w-4 h-4" />
              Melt Into Every Moment
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-white tracking-tight">Explore</h4>
            <div className="flex flex-col gap-2.5 text-xs text-white/75">
              <button onClick={() => handleTabChange('home')} className="hover:text-tertiary-fixed-dim transition-colors text-left cursor-pointer">Sanctuary Home</button>
              <button onClick={() => handleTabChange('menu')} className="hover:text-tertiary-fixed-dim transition-colors text-left cursor-pointer">Artisan Menu</button>
              <button onClick={() => handleTabChange('order')} className="hover:text-tertiary-fixed-dim transition-colors text-left cursor-pointer">Online Order & Car-Hop</button>
              <button onClick={() => handleTabChange('about')} className="hover:text-tertiary-fixed-dim transition-colors text-left cursor-pointer">Our Bread & Story</button>
              <button onClick={() => handleTabChange('contact')} className="hover:text-tertiary-fixed-dim transition-colors text-left cursor-pointer">Get in Touch</button>
            </div>
          </div>

          {/* Opening hours info */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-white tracking-tight">Hours & Visits</h4>
            <div className="space-y-2 text-xs text-white/75">
              <p className="font-semibold text-white">Every Day of the Week</p>
              <p>{content?.contact.hours.replace('Monday - Sunday: ', '') ?? '7:00 AM – 9:00 PM'}</p>
              <p className="pt-2">{content?.contact.address ?? '742 Evergreen Glen, Forest Sanctuary Drive'}</p>
            </div>
          </div>

          {/* Newsletter signup */}
          <div className="space-y-4">
            <h4 className="font-serif text-base font-bold text-white tracking-tight font-medium">Under the Canopy</h4>
            <p className="text-xs text-white/75 leading-relaxed">
              Subscribe to receive morning sourdough baking alerts, secret recipes, and special outdoor events.
            </p>
            
            {subscribed ? (
              <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-2 text-xs animate-in fade-in duration-200">
                <Check className="w-4 h-4 text-tertiary-fixed-dim" />
                <span className="text-white font-medium">Subscribed! Welcome under the pines.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email"
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-tertiary-fixed-dim/40 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-tertiary-fixed-dim hover:bg-white disabled:opacity-50 text-primary rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join'}
                  </button>
                </form>
                {submitError && (
                  <p className="text-[10px] text-red-300 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    {submitError}
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Bottom divider bar with cute Mascot and credits */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {content && (
              <img 
                src={content.mascotWaveUrl} 
                alt="Mello mascot wave" 
                className="w-12 h-12 object-cover rounded-full bg-white/10 p-1 border border-white/20"
                referrerPolicy="no-referrer"
              />
            )}
            <p className="text-[11px] text-white/60">
              © {new Date().getFullYear()} Meltaro Artisan Bakery & Café. All rights reserved. Built beneath the pine canopy.
            </p>
          </div>
          
          <div className="text-[10px] text-white/40 flex gap-4 uppercase font-bold tracking-widest">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Sourdough Codex</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
