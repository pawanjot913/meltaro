/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import MenuView from './components/MenuView';
import AboutView from './components/AboutView';
import OrderView from './components/OrderView';
import BasketSidebar from './components/BasketSidebar';
import SuccessModal from './components/SuccessModal';
import SupportChatModal from './components/SupportChatModal';
import AuthModal from './components/AuthModal';
import { fetchMenuItems } from './api';
import { MenuItem, CartItem, OrderDetails } from './types';

export default function App() {
  const [currentTab, setTab] = useState<'home' | 'menu' | 'order' | 'about' | 'contact'>('home');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [successDetails, setSuccessDetails] = useState<OrderDetails | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Fetch the menu from the backend on first load
  useEffect(() => {
    let isMounted = true;
    setIsMenuLoading(true);
    fetchMenuItems()
      .then((items) => {
        if (isMounted) {
          setMenuItems(items);
          setMenuError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to load menu:', err);
        if (isMounted) setMenuError('Could not load the menu right now. Please try again shortly.');
      })
      .finally(() => {
        if (isMounted) setIsMenuLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize cart with localStorage for persistent state across session reloads
  useEffect(() => {
    try {
      const stored = localStorage.getItem('meltaro_cart');
      if (stored) {
        setCartItems(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Error loading cart state:', err);
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    try {
      localStorage.setItem('meltaro_cart', JSON.stringify(items));
    } catch (err) {
      console.error('Error storing cart state:', err);
    }
  };

  const handleAddToBasket = (item: MenuItem) => {
    const existing = cartItems.find((ci) => ci.menuItem.id === item.id);
    if (existing) {
      const updated = cartItems.map((ci) =>
        ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
      );
      saveCart(updated);
    } else {
      const updated = [...cartItems, { menuItem: item, quantity: 1 }];
      saveCart(updated);
    }
    // Briefly open cart for micro-feedback, unless on order screen where the sidebar is already shown on the right side
    if (currentTab !== 'order') {
      setIsCartOpen(true);
    }
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    const updated = cartItems
      .map((ci) => {
        if (ci.menuItem.id === id) {
          const newQty = ci.quantity + delta;
          return { ...ci, quantity: newQty };
        }
        return ci;
      })
      .filter((ci) => ci.quantity > 0);
    saveCart(updated);
  };

  const handleRemoveItem = (id: string) => {
    const updated = cartItems.filter((ci) => ci.menuItem.id !== id);
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const handleOrderSuccess = (details: OrderDetails) => {
    setSuccessDetails(details);
    saveCart([]);
    setIsCartOpen(false);
  };

  // Filter menu data for different pages
  const bestSellers = menuItems.filter(
    (item) =>
      item.id === 'lotus-cheesecake' ||
      item.id === 'chocolate-shake' ||
      item.id === 'nutella-pancakes'
  );

  const freshBakedItems = menuItems.filter(
    (item) =>
      item.id === 'honey-croissant' ||
      item.id === 'dark-cake' ||
      item.id === 'sourdough' ||
      item.id === 'macarons'
  );

  const cartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);

  return (
    <div className="min-h-screen bg-[#fff8f5] text-[#1e1b18] flex flex-col selection:bg-primary selection:text-white">
      {/* Top sticky Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setTab={setTab}
        cartCount={cartCount}
        toggleCart={() => setIsCartOpen(!isCartOpen)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Primary Page Views mounting */}
      <main className="flex-grow">
        {currentTab === 'home' && (
          <HomeView
            setTab={setTab}
            bestSellers={bestSellers}
            onAddToBasket={handleAddToBasket}
          />
        )}

        {currentTab === 'menu' && (
          <MenuView
            menuItems={menuItems}
            isLoading={isMenuLoading}
            error={menuError}
            onAddToBasket={handleAddToBasket}
          />
        )}

        {currentTab === 'order' && (
          <OrderView
            freshBakedItems={freshBakedItems}
            cartItems={cartItems}
            onAddToBasket={handleAddToBasket}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onOrderSuccess={handleOrderSuccess}
            onRequireAuth={() => setIsAuthOpen(true)}
          />
        )}

        {(currentTab === 'about' || currentTab === 'contact') && (
          <AboutView />
        )}
      </main>

      {/* Footer Block */}
      <Footer setTab={setTab} />

      {/* Right Side Basket Slide-out Drawer */}
      <BasketSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
        onRequireAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* Sweet Success Screen Modal Overlay */}
      <SuccessModal
        orderDetails={successDetails}
        onClose={() => {
          setSuccessDetails(null);
          setTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Floating Action Mascot Chat Support */}
      <SupportChatModal />
    </div>
  );
}