import React, { useState, useEffect } from 'react';
import { ArrowRight, Quote, Sparkles, MapPin, Clock, Loader2 } from 'lucide-react';
import { fetchCategories, fetchReviews, fetchSiteContent } from '../api';
import { MenuItem, Category, Review, SiteContent } from '../types';

interface HomeViewProps {
  setTab: (tab: 'home' | 'menu' | 'order' | 'about' | 'contact') => void;
  bestSellers: MenuItem[];
  onAddToBasket: (item: MenuItem) => void;
}

export default function HomeView({ setTab, bestSellers, onAddToBasket }: HomeViewProps) {
  const [activeReview, setActiveReview] = React.useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [content, setContent] = useState<SiteContent | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCategories(), fetchReviews(), fetchSiteContent()])
      .then(([cats, revs, siteContent]) => {
        if (!isMounted) return;
        setCategories(cats);
        setReviews(revs);
        setContent(siteContent);
      })
      .catch((err) => console.error('Failed to load homepage content:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  const activeReviewData = reviews[activeReview];

  return (
    <div className="font-sans text-on-background bg-background pb-12">
      
      {/* Hero Section */}
      <div className="relative h-[640px] flex items-center justify-center overflow-hidden pt-16">
        {/* Background Image with Dark Nature Overlay */}
        <div className="absolute inset-0 z-0">
          {content && (
            <img 
              src={content.heroBgUrl} 
              alt="Meltaro outdoor forest café" 
              className="w-full h-full object-cover scale-[1.02] transform transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#023625]/85 via-[#023625]/65 to-[#fff8f5]" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-6 text-white animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Mascot Logo Float */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28 bg-white/10 backdrop-blur-md rounded-full p-2 border border-white/20 shadow-xl flex items-center justify-center float-animation">
              {content && (
                <img 
                  src={content.mascotUrl} 
                  alt="Mello" 
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-tertiary-fixed-dim/90 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-tertiary-fixed-dim" />
              Artisan Bakery & Specialty Coffee
              <Sparkles className="w-4 h-4 text-tertiary-fixed-dim" />
            </p>
            <h1 className="font-serif text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
              Melt Into <span className="italic text-tertiary-fixed-dim">Every</span> Moment
            </h1>
          </div>

          <p className="text-sm md:text-base font-sans text-white/85 max-w-2xl mx-auto leading-relaxed">
            Specialty coffee, handcrafted desserts, and unforgettable outdoor café experiences nestled in nature, designed for the modern connoisseur.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button
              onClick={() => setTab('menu')}
              className="bg-tertiary-fixed-dim hover:bg-white text-primary font-sans text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              Explore Our Menu
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTab('about')}
              className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-sans text-xs font-bold uppercase tracking-wider px-8 py-4 rounded-full hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              Our Story
            </button>
          </div>
        </div>
      </div>

      {/* Featured Categories Bento Box */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
          {categories.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          ) : (
            categories.map((cat, idx) => (
              <div 
                key={idx}
                onClick={() => setTab('menu')}
                className="group h-48 rounded-2xl overflow-hidden relative shadow-lg cursor-pointer transform hover:-translate-y-1.5 transition-all duration-300 hover:shadow-2xl border border-white/10"
              >
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-tertiary-fixed-dim">{cat.sub}</p>
                  <h3 className="font-serif text-lg font-bold tracking-tight mt-0.5">{cat.name}</h3>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Best Sellers Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Our Masterpieces</span>
          <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-primary">Best Sellers of Meltaro</h2>
          <div className="h-0.5 w-16 bg-tertiary-fixed-dim mx-auto" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bestSellers.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl border border-surface-variant/20 transition-all flex flex-col justify-between"
            >
              <div className="relative h-64 overflow-hidden group">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-full shadow">
                  Must Try
                </div>
              </div>
              
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-serif text-lg font-bold text-primary leading-tight">{item.name}</h3>
                    <span className="text-primary font-bold text-lg">${item.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{item.description}</p>
                </div>

                <div className="pt-3 border-t border-surface-variant/20 flex items-center justify-between">
                  <div className="flex gap-1.5 flex-wrap">
                    {item.ingredients?.slice(0, 2).map((ing, i) => (
                      <span key={i} className="text-[9px] bg-surface-container font-semibold px-2.5 py-1 rounded-full text-on-surface-variant">
                        {ing}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => onAddToBasket(item)}
                    className="bg-primary hover:bg-primary-container text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hallmarks of Experience */}
      <div className="bg-surface-container py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Our Philosophy</span>
            <h2 className="font-serif text-3xl md:text-4xl font-extrabold text-primary">Why Choose Meltaro?</h2>
            <div className="h-0.5 w-16 bg-tertiary-fixed-dim mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-surface-variant/10 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-serif font-extrabold text-xl border border-tertiary-fixed-dim/20">
                01
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">Outdoor Pine Oasis</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enjoy your specialty coffee and crusty loaves surrounded by majestic pines, organic materials, and gentle mountain breezes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-surface-variant/10 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-serif font-extrabold text-xl border border-tertiary-fixed-dim/20">
                02
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">36-Hour Sourdough</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Slow-fermented using heirloom grains and pure mountain water to ensure exquisite digestibility, texture, and deep flavor profile.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-surface-variant/10 shadow-sm space-y-4">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-serif font-extrabold text-xl border border-tertiary-fixed-dim/20">
                03
              </div>
              <h3 className="font-serif text-xl font-bold text-primary">Car-Hop Delivery</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Drive into our scenic driveway lanes, place your order, and have our mascot Mello deliver fresh bakes directly to your window.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Review Section */}
      {activeReviewData && (
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="relative bg-white border border-surface-variant/20 rounded-3xl p-8 md:p-14 shadow-xl flex flex-col md:flex-row gap-8 md:gap-12 items-center">
            
            {/* Accent decoration */}
            <div className="absolute top-8 right-8 text-primary/5">
              <Quote className="w-32 h-32" />
            </div>

            <img 
              src={activeReviewData.avatar} 
              alt={activeReviewData.author}
              className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-md border border-surface-variant"
              referrerPolicy="no-referrer"
            />

            <div className="space-y-6 relative z-10 text-center md:text-left flex-1">
              <Quote className="w-8 h-8 text-tertiary-fixed-dim" />
              <p className="font-serif text-base md:text-lg italic text-primary leading-relaxed">
                "{activeReviewData.quote}"
              </p>
              <div>
                <h4 className="font-sans text-sm font-bold text-primary">{activeReviewData.author}</h4>
                <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold mt-0.5">{activeReviewData.role}</p>
              </div>

              {/* Slider dots */}
              <div className="flex justify-center md:justify-start gap-2 pt-2">
                {reviews.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveReview(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeReview === idx ? 'w-8 bg-primary' : 'w-2.5 bg-surface-variant'
                    }`}
                    aria-label={`Show testimonial ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info strip */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="bg-primary text-white p-6 rounded-3xl flex items-center gap-5 border border-tertiary-fixed-dim/20 shadow">
          <div className="p-3 bg-white/10 rounded-2xl">
            <MapPin className="w-6 h-6 text-tertiary-fixed-dim" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-base">Visit our pine sanctuary</h4>
            <p className="text-xs text-white/80 mt-0.5">{content?.contact.address ?? 'Loading address...'}</p>
          </div>
        </div>
        
        <div className="bg-primary text-white p-6 rounded-3xl flex items-center gap-5 border border-tertiary-fixed-dim/20 shadow">
          <div className="p-3 bg-white/10 rounded-2xl">
            <Clock className="w-6 h-6 text-tertiary-fixed-dim" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-base">Opening Hours</h4>
            <p className="text-xs text-white/80 mt-0.5">{content?.contact.hours ?? 'Loading hours...'}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
