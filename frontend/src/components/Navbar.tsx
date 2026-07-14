import React from 'react';
import { Menu, X, ShoppingBag, LogIn, LogOut, User } from 'lucide-react';
import { useAuth, displayNameFromUser } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'home' | 'menu' | 'order' | 'about' | 'contact';
  setTab: (tab: 'home' | 'menu' | 'order' | 'about' | 'contact') => void;
  cartCount: number;
  toggleCart: () => void;
  onOpenAuth: () => void;
}

export default function Navbar({
  currentTab,
  setTab,
  cartCount,
  toggleCart,
  onOpenAuth,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, signOut, loading } = useAuth();

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'menu', label: 'Menu' },
    { id: 'order', label: 'Order' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ] as const;

  const handleLinkClick = (id: typeof navLinks[number]['id']) => {
    setTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const displayName = displayNameFromUser(user);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-surface-variant/20 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <button 
          onClick={() => handleLinkClick('home')}
          className="font-serif text-3xl font-bold text-primary tracking-tight cursor-pointer hover:opacity-95 transition-opacity"
        >
          Meltaro
        </button>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className={`text-sm font-sans font-semibold tracking-wide transition-all duration-300 pb-1 border-b-2 cursor-pointer ${
                  isActive 
                    ? 'text-primary border-tertiary-fixed-dim' 
                    : 'text-on-surface-variant hover:text-primary border-transparent hover:border-tertiary-fixed-dim/40'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {!loading && (
            user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-primary max-w-[140px] truncate">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  {displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant hover:text-primary transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-surface-container"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 hover:bg-surface-container px-4 py-2.5 rounded-full transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in
              </button>
            )
          )}

          <button 
            onClick={toggleCart}
            className="relative p-2.5 rounded-full hover:bg-surface-container transition-all text-primary active:scale-95 duration-200 cursor-pointer"
            aria-label="Toggle Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-tertiary-fixed-dim text-primary text-[10px] font-bold shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => handleLinkClick('order')}
            className="hidden sm:inline-block bg-primary text-white font-sans text-xs font-bold tracking-wider uppercase px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Order Online
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-primary hover:bg-surface-container rounded-full transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 border-b border-surface-variant/20 absolute top-full left-0 w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col px-6 py-6 gap-4">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`text-left font-sans font-semibold py-2.5 transition-all ${
                    isActive 
                      ? 'text-primary border-l-4 border-tertiary-fixed-dim pl-3' 
                      : 'text-on-surface-variant hover:text-primary pl-1'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
            {!loading && (
              user ? (
                <button
                  type="button"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-left font-sans font-semibold py-2.5 text-on-surface-variant cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out ({displayName || user.email})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-left font-sans font-semibold py-2.5 text-primary cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign in
                </button>
              )
            )}
            <button
              onClick={() => handleLinkClick('order')}
              className="mt-2 bg-primary text-white font-sans font-semibold text-center py-3 rounded-xl shadow-md cursor-pointer"
            >
              Order Online
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
