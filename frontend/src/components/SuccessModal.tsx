import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShoppingBag, MapPin, Phone, Car, Sparkles } from 'lucide-react';
import { OrderDetails } from '../types';
import { fetchSiteContent } from '../api';

interface SuccessModalProps {
  orderDetails: OrderDetails | null;
  onClose: () => void;
}

export default function SuccessModal({ orderDetails, onClose }: SuccessModalProps) {
  const [mascotWaveUrl, setMascotWaveUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!orderDetails) return;
    let isMounted = true;
    fetchSiteContent()
      .then((content) => {
        if (isMounted) setMascotWaveUrl(content.mascotWaveUrl);
      })
      .catch((err) => console.error('Failed to load mascot image:', err));
    return () => {
      isMounted = false;
    };
  }, [orderDetails]);

  if (!orderDetails) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-md font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
        className="relative bg-white max-w-lg w-full rounded-3xl overflow-hidden shadow-2xl border border-surface-variant/30"
      >
        
        {/* Confetti / Top Header banner */}
        <div className="forest-gradient p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 text-white/10">
            <ShoppingBag className="w-24 h-24 rotate-12" />
          </div>

          <div className="flex justify-center mb-4">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 animate-bounce">
              {mascotWaveUrl && (
                <img 
                  src={mascotWaveUrl} 
                  alt="Waving Mello" 
                  className="w-16 h-16 object-cover rounded-full bg-white p-1"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          </div>

          <p className="text-[10px] uppercase tracking-[0.25em] text-tertiary-fixed-dim font-bold flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Sweet Success! <Sparkles className="w-3.5 h-3.5" />
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-extrabold tracking-tight mt-1.5">Your Order is Placed!</h2>
          <p className="text-xs text-white/80 mt-2">Mello is preparing your artisanal treats beneath the pines.</p>
        </div>

        {/* Content Details */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Summary Details */}
          <div className="bg-surface-container-low border border-surface-variant/10 rounded-2xl p-4 space-y-4 text-xs">
            
            <div className="flex justify-between items-start border-b border-surface-variant/20 pb-3">
              <div>
                <p className="font-bold text-primary text-sm">Receipt Summary</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">Order Type: <span className="capitalize font-semibold text-primary">{orderDetails.mode}</span></p>
                {orderDetails.orderId && (
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Order ID: <span className="font-semibold text-primary">#{orderDetails.orderId}</span></p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-primary bg-tertiary-fixed/40 px-3 py-1 rounded-full border border-tertiary-fixed-dim/20">
                  Paid Online
                </span>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1 no-scrollbar">
              {orderDetails.items.map((item) => (
                <div key={item.menuItemId} className="flex justify-between items-center text-on-surface-variant">
                  <span className="font-medium"><span className="font-bold text-primary mr-1">{item.quantity}x</span> {item.name}</span>
                  <span className="font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="border-t border-surface-variant/20 pt-3 space-y-1.5 text-on-surface-variant">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-primary">${orderDetails.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service/Delivery Fee</span>
                <span className="font-semibold text-primary">{orderDetails.fee === 0 ? 'Free' : `$${orderDetails.fee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-primary font-bold text-sm pt-1.5 border-t border-surface-variant/10">
                <span>Total Charge</span>
                <span>${orderDetails.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer / Service delivery specifics */}
          <div className="space-y-4 text-xs border-t border-surface-variant/10 pt-4">
            <h4 className="font-bold text-primary uppercase tracking-wide">Pickup & Delivery Coordinates</h4>
            
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="p-1.5 bg-surface-container rounded-lg text-primary">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-primary">Recipient</h5>
                  <p className="text-on-surface-variant mt-0.5 font-medium">{orderDetails.fullName} • {orderDetails.phone}</p>
                </div>
              </div>

              {orderDetails.mode === 'carhop' && (
                <div className="flex gap-3 items-start animate-in fade-in">
                  <div className="p-1.5 bg-surface-container rounded-lg text-primary">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-primary">Car-Hop Delivery Details</h5>
                    <p className="text-on-surface-variant mt-0.5 font-medium">Vehicle License Plate: <span className="font-bold uppercase text-primary">{orderDetails.vehicleLicense}</span></p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">Please park in any golden cone spot. Mello is heading out soon!</p>
                  </div>
                </div>
              )}

              {orderDetails.mode === 'delivery' && (
                <div className="flex gap-3 items-start animate-in fade-in">
                  <div className="p-1.5 bg-surface-container rounded-lg text-primary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-primary">Courier Coordinates</h5>
                    <p className="text-on-surface-variant mt-0.5 font-medium">{orderDetails.address}</p>
                  </div>
                </div>
              )}

              {orderDetails.mode === 'pickup' && (
                <div className="flex gap-3 items-start animate-in fade-in">
                  <div className="p-1.5 bg-surface-container rounded-lg text-primary">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-primary">Pickup Directions</h5>
                    <p className="text-on-surface-variant mt-0.5 font-medium">Head to the express bakes counter at 742 Evergreen Glen. Your delicacies will be ready in 15 minutes.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary-container text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow transition-all cursor-pointer text-center"
          >
            Delightful, Thanks!
          </button>

        </div>
      </motion.div>
    </div>
  );
}
