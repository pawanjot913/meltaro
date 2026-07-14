import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuViewProps {
  menuItems: MenuItem[];
  isLoading?: boolean;
  error?: string | null;
  onAddToBasket: (item: MenuItem) => void;
}

export default function MenuView({ menuItems, isLoading = false, error = null, onAddToBasket }: MenuViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const categories = [
    'All',
    'Coffee',
    'Cold Coffee',
    'Shakes',
    'Cheesecakes',
    'Pancakes',
    'Fries',
    'Pastries',
    'Artisan Sourdough',
    'Bakery Specials',
    'Seasonals'
  ];

  const tags = ['All', 'Popular', 'Desserts', 'Snacks', 'Gluten Free'];

  // Filter items based on category, search query, and tags
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTag = true;
    if (selectedTag !== 'All') {
      if (selectedTag === 'Popular') {
        matchesTag = !!item.isPopular;
      } else {
        matchesTag = !!item.tags?.includes(selectedTag);
      }
    }

    return matchesCategory && matchesSearch && matchesTag;
  });

  return (
    <div className="font-sans text-on-background bg-background min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Title */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Fresh From Our Pines</span>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-primary">Meltaro Artisan Menu</h1>
          <p className="text-xs text-on-surface-variant max-w-xl mx-auto leading-relaxed">
            Every item is handcrafted with specialty organic ingredients. Hover over any item to discover its ingredient composition.
          </p>
          <div className="h-0.5 w-16 bg-tertiary-fixed-dim mx-auto mt-4" />
        </div>

        {/* Filter and Search Bar Panel */}
        <div className="bg-white rounded-3xl border border-surface-variant/20 p-6 shadow-md mb-10 space-y-5">
          {/* Search bar & Tag filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specialty lattes, biscoff cakes..."
                className="w-full pl-11 pr-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
              />
            </div>

            {/* Tag Selection Row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider mr-1">Diet / Type:</span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-primary text-white'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Horizontal scroll category bar */}
          <div className="border-t border-surface-variant/20 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-surface-variant/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-surface-variant/20 shadow-sm max-w-2xl mx-auto space-y-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-on-surface-variant font-medium">Fetching our fresh menu...</p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="text-center py-20 bg-white rounded-3xl border border-red-200 shadow-sm max-w-2xl mx-auto space-y-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-primary">Couldn't load the menu</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 px-6">{error}</p>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        {!isLoading && !error && (filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-surface-variant/20 shadow-sm max-w-2xl mx-auto space-y-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-primary">No items matched your criteria</h3>
              <p className="text-xs text-on-surface-variant mt-1.5 px-6">
                Try searching for something else, clearing your filters, or browsing other categories.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedTag('All');
              }}
              className="bg-primary hover:bg-primary-container text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => {
              const isPopular = item.isPopular;
              const showIngredients = hoveredItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-surface-variant/20 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative"
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  
                  {/* Image wrapper */}
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transform hover:scale-[1.03] transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />

                    {/* Popups & badging overlay */}
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                      {isPopular && (
                        <div className="bg-primary text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-tertiary-fixed-dim" />
                          Popular
                        </div>
                      )}
                      {item.tags?.includes('Gluten Free') && (
                        <div className="bg-emerald-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow">
                          GF
                        </div>
                      )}
                    </div>

                    {/* Hover ingredient details container */}
                    <div 
                      className={`absolute inset-0 bg-primary/95 text-white p-6 flex flex-col justify-center gap-4 transition-all duration-300 ${
                        showIngredients ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
                      }`}
                    >
                      <h4 className="font-serif text-lg font-bold text-tertiary-fixed-dim">Composed of:</h4>
                      <ul className="text-xs space-y-2 list-disc list-inside text-white/90">
                        {item.ingredients?.map((ing, i) => (
                          <li key={i} className="capitalize">{ing}</li>
                        )) || <li>Natural farm-sourced organic ingredients</li>}
                      </ul>
                      <p className="text-[10px] text-white/75 italic">Handcrafted with care by Meltaro chefs.</p>
                    </div>
                  </div>

                  {/* Text Details Area */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="font-serif text-base md:text-lg font-bold text-primary leading-tight">{item.name}</h3>
                        <span className="text-primary font-bold text-base md:text-lg flex-shrink-0">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">{item.description}</p>
                    </div>

                    {/* Add to Basket Control */}
                    <div className="pt-3 border-t border-surface-variant/20 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-on-surface-variant/80 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <button
                        onClick={() => onAddToBasket(item)}
                        className="bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        Add to Basket
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ))}
        
      </div>
    </div>
  );
}
