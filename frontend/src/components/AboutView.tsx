import React, { useState, useEffect } from 'react';
import { Send, MapPin, Clock, Phone, Mail, Instagram, Sparkles, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { fetchSiteContent, submitContactMessage } from '../api';
import { SiteContent } from '../types';

export default function AboutView() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchSiteContent()
      .then((data) => {
        if (isMounted) setContent(data);
      })
      .catch((err) => console.error('Failed to load page content:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitContactMessage(formData);
      setIsSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch (err) {
      console.error('Failed to submit contact message:', err);
      setSubmitError('We couldn\'t send your message right now. Please try again shortly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!content) {
    return (
      <div className="font-sans text-on-background bg-background min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-on-surface-variant font-medium">Loading our story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-on-background bg-background min-h-screen pt-28 pb-16">
      
      {/* 1. Narrative Section - Story Header */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="text-center space-y-3 mb-14">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Our Sanctuary</span>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-primary">Crafting Nature in Every Bite</h1>
          <div className="h-0.5 w-16 bg-tertiary-fixed-dim mx-auto" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 rounded-3xl overflow-hidden shadow-2xl h-[440px]">
            <img 
              src={content.aboutInteriorUrl} 
              alt="Meltaro Dawn Cozy Interior" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary leading-snug">
              Nestled Under the Whispering Pines
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Meltaro was born out of a simple, beautiful vision: to marry the raw, wild beauty of evergreen forests with the precise, high-end discipline of European pastry crafting.
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Every morning, as dawn light filters through our surrounding pine canopy, our ovens come to life. We slow-bake sourdough loaves, glaze organic honey pastries, and extract single-origin espresso with absolute artistic dedication. It is more than bread; it is a ritual.
            </p>
            <div className="flex gap-4 items-center">
              <span className="text-3xl font-serif font-extrabold text-primary">100%</span>
              <p className="text-[11px] font-bold text-primary uppercase tracking-wider leading-tight">
                Organic heirloom wheat flour <br/>
                & shade-grown beans
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Coffee & Bread Philosophy Row */}
      <div className="bg-surface-container py-20 px-6 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider bg-white/65 px-3.5 py-1.5 rounded-full shadow-sm">
                Our Brew & Crumb Standard
              </span>
              <h2 className="font-serif text-3xl font-extrabold text-primary leading-tight">
                Slow Roasted, <br/>
                Slow Fermented.
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Our coffee beans are shade-grown on micro-lots, ensuring deep soil enrichment and complex acidity. We slow-roast them in small batches to preserve profiles of dark cocoa, roasted hazelnut, and wild forest berries.
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                For our loaves, we rely strictly on natural wild yeast starters passed down through baking generations. This 36-hour proofing cycle breaks down gluten proteins, providing a crust with an explosive shatter and an open, glossy crumb.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl overflow-hidden h-72 shadow-md">
                <img 
                  src={content.baristaPourUrl} 
                  alt="Barista pouring a latte" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="rounded-2xl overflow-hidden h-72 shadow-md translate-y-6">
                <img 
                  src={content.roastBeansUrl} 
                  alt="Slow roasted coffee beans" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Outdoor Culture & Forest Canopy */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6 lg:order-last">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary leading-snug">
              Unwinding in the Woodland Air
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              We believe great pastry cannot be rushed, and neither should its enjoyment. Our café grounds feature private, heated seating pods, gravel paths, and fire pits cradled beneath the giant redwood and pine trees.
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Whether you are working from our high-speed woodland desks, cozying up with a book, or driving in for our custom car-hop window service, Meltaro provides an escape from city speed.
            </p>
          </div>
          
          <div className="lg:col-span-7 rounded-3xl overflow-hidden shadow-xl h-[400px]">
            <img 
              src={content.mistyForestUrl} 
              alt="Misty woodlands forest" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* 4. Instagram gallery */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Our Forest Community</span>
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold text-primary">Captured on Instagram</h2>
          <p className="text-xs text-on-surface-variant">Follow @MeltaroBakery to share your quiet woodland moments</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {content.instagramPhotos.map((photo, idx) => (
            <div 
              key={idx}
              className="group aspect-square rounded-2xl overflow-hidden shadow-sm relative cursor-pointer"
            >
              <img 
                src={photo} 
                alt={`Instagram Post ${idx + 1}`} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#023625]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Instagram className="w-6 h-6 text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Contact Form and Visiting details Map */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Contact form column */}
        <div className="lg:col-span-6 bg-white border border-surface-variant/20 rounded-3xl p-8 shadow-md">
          <div className="space-y-3 mb-6">
            <h3 className="font-serif text-2xl font-bold text-primary">Get in Touch</h3>
            <p className="text-xs text-on-surface-variant">Have questions about event catering, wholesale sourdough, or our café operations? Reach out directly.</p>
          </div>

          {isSubmitted ? (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center space-y-3 animate-in fade-in duration-300">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <div>
                <h4 className="font-serif font-bold text-primary text-base">Message Sent Successfully!</h4>
                <p className="text-xs text-on-surface-variant mt-1">Thank you for writing. Our fluffy companion Mello or a team member will write back to you shortly.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help you..."
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20 resize-none"
                />
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-[11px] text-red-600 font-semibold">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    Sending...
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Visitor map info column */}
        <div className="lg:col-span-6 flex flex-col justify-between gap-8">
          
          {/* Card list details */}
          <div className="bg-white border border-surface-variant/20 rounded-3xl p-8 shadow-md space-y-6 flex-1">
            <h3 className="font-serif text-xl font-bold text-primary border-b border-surface-variant/20 pb-3">Visit Details</h3>
            
            <div className="space-y-5 text-xs text-on-surface-variant">
              <div className="flex gap-4 items-start">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-primary">Café Address</h4>
                  <p className="mt-0.5 text-on-surface-variant font-medium">{content.contact.address}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-primary">Café Hours</h4>
                  <p className="mt-0.5 text-on-surface-variant font-medium">{content.contact.hours}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{content.contact.kitchenNote}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-primary">Call Us</h4>
                  <p className="mt-0.5 text-on-surface-variant font-medium">{content.contact.phone}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-primary">Email Support</h4>
                  <p className="mt-0.5 text-on-surface-variant font-medium">{content.contact.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Image Section */}
          <div className="bg-white border border-surface-variant/20 rounded-3xl overflow-hidden shadow-md relative h-56 flex-shrink-0">
            <img 
              src={content.mapUrl} 
              alt="Meltaro Forest Location Map" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Float directions box overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl flex items-center justify-between border border-surface-variant/30 shadow-sm">
              <div>
                <h4 className="font-serif text-xs font-bold text-primary">Meltaro Sanctuary</h4>
                <p className="text-[10px] text-on-surface-variant font-medium">Parking & car-hop lanes directly accessible.</p>
              </div>
              <button 
                onClick={() => window.open('https://maps.google.com', '_blank')}
                className="bg-primary text-white text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer hover:bg-primary-container"
              >
                Directions
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
