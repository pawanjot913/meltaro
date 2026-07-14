import React, { useState, useEffect } from 'react';
import { Car, MapPin, Navigation, Sparkles, AlertCircle, ShieldAlert, BadgeCheck, Loader2 } from 'lucide-react';
import { MenuItem, CartItem, OrderMode, OrderDetails } from '../types';
import { submitOrder, ApiError } from '../api';
import { SITE_CONTENT } from '../mockData';
import { useAuth, displayNameFromUser } from '../context/AuthContext';

interface OrderViewProps {
  freshBakedItems: MenuItem[];
  cartItems: CartItem[];
  onAddToBasket: (item: MenuItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (details: OrderDetails) => void;
  onRequireAuth: () => void;
}

export default function OrderView({
  freshBakedItems,
  cartItems,
  onAddToBasket,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  onRequireAuth,
}: OrderViewProps) {
  const { user, session, getAccessToken } = useAuth();
  const [orderMode, setOrderMode] = useState<OrderMode>('carhop'); // Default to carhop as shown on screen 3
  const [licensePlate, setLicensePlate] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill name from signed-in user once, without overwriting edits
  useEffect(() => {
    if (!fullName.trim()) {
      const suggested = displayNameFromUser(user);
      if (suggested) setFullName(suggested);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculations (client-side estimate only — the server recomputes the
  // authoritative totals from current menu prices when the order is placed)
  const subtotal = cartItems.reduce((acc, item) => acc + item.menuItem.price * item.quantity, 0);
  
  let fee = 0;
  if (orderMode === 'delivery') fee = 5.99;
  if (orderMode === 'carhop') fee = 2.50;

  const total = subtotal + fee;

  const validateDetails = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[0-9\s-]{7,15}$/.test(phone.trim())) {
      newErrors.phone = "Invalid phone number format";
    }

    if (orderMode === 'delivery' && !address.trim()) {
      newErrors.address = "Delivery address is required";
    }

    if (orderMode === 'carhop' && !licensePlate.trim()) {
      newErrors.licensePlate = "License plate details are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert("Please add some delicacies to your basket first!");
      return;
    }
    if (!validateDetails()) return;

    if (!session) {
      onRequireAuth();
      return;
    }

    const addressValue = orderMode === 'delivery' ? address : (orderMode === 'carhop' ? `Car-Hop License: ${licensePlate}` : 'In-Store Pickup');

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        onRequireAuth();
        return;
      }

      const response = await submitOrder(
        cartItems,
        {
          fullName,
          phone,
          address: addressValue,
          vehicleLicense: orderMode === 'carhop' ? licensePlate : undefined,
          mode: orderMode
        },
        accessToken
      );

      const details: OrderDetails = {
        orderId: response.orderId,
        fullName: response.fullName,
        phone: response.phone,
        address: response.address,
        vehicleLicense: response.vehicleLicense,
        items: response.items,
        subtotal: response.subtotal,
        fee: response.fee,
        total: response.total,
        mode: response.mode
      };

      onOrderSuccess(details);
      // Reset inputs
      setFullName('');
      setPhone('');
      setAddress('');
      setLicensePlate('');
    } catch (err) {
      console.error('Failed to submit order:', err);
      if (err instanceof ApiError && err.status === 401) {
        setSubmitError('Please sign in to place your order.');
        onRequireAuth();
      } else {
        setSubmitError('We couldn\'t place your order right now. Please try again in a moment.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-sans text-on-background bg-background min-h-screen pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Page Title */}
        <div className="text-center space-y-3 mb-10">
          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Oven Fresh Real-Time Order</span>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-primary">Freshly Baked & Brewed</h1>
          <div className="h-0.5 w-16 bg-tertiary-fixed-dim mx-auto mt-4" />
        </div>

        {/* Two Column Layout: Items Selector on left, Order checkout box on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* LEFT: Bakeries selection and delivery toggle */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Mode Select panel */}
            <div className="bg-white rounded-3xl border border-surface-variant/20 p-6 shadow-md space-y-5">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">How would you like your order?</h3>
                <p className="text-[11px] text-on-surface-variant mt-1">Select your service style. Car-Hop has custom mascot delivery!</p>
              </div>

              {/* Switches */}
              <div className="grid grid-cols-3 gap-3 bg-surface-container-low p-1.5 rounded-2xl border border-surface-variant/20">
                <button
                  onClick={() => setOrderMode('pickup')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    orderMode === 'pickup' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  <Navigation className="w-4 h-4" />
                  Pickup
                </button>
                <button
                  onClick={() => setOrderMode('carhop')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    orderMode === 'carhop' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  Car-Hop
                </button>
                <button
                  onClick={() => setOrderMode('delivery')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    orderMode === 'delivery' 
                      ? 'bg-primary text-white shadow-md' 
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Delivery
                </button>
              </div>

              {/* Mode Specific Inputs */}
              {orderMode === 'carhop' && (
                <div className="bg-tertiary-fixed/30 border border-tertiary-fixed-dim/40 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img 
                        src={SITE_CONTENT.mascotUrl} 
                        alt="Mello mascot" 
                        className="w-12 h-12 rounded-full bg-white p-1 border border-tertiary-fixed-dim/30 object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-primary">License Plate Required</h4>
                      <p className="text-[10px] text-on-secondary-container leading-relaxed mt-0.5">Mello uses this to spot your vehicle immediately and rush your order right out to your window!</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Vehicle License Plate</label>
                    <input
                      type="text"
                      value={licensePlate}
                      onChange={(e) => setLicensePlate(e.target.value)}
                      placeholder="e.g. ABC-7890"
                      className="w-full uppercase px-4 py-3 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/30"
                    />
                    {errors.licensePlate && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.licensePlate}</p>}
                  </div>
                </div>
              )}

              {orderMode === 'delivery' && (
                <div className="bg-surface-container border border-surface-variant/20 rounded-2xl p-5 space-y-4 animate-in fade-in duration-300">
                  <div>
                    <h4 className="text-xs font-bold text-primary">Direct Home Courier</h4>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">Delivered fresh in double insulated containers to secure appropriate hot/cold temperatures.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Delivery Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Suite #, Street name, City, Postcode"
                      rows={3}
                      className="w-full px-4 py-3 bg-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/30 resize-none"
                    />
                    {errors.address && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.address}</p>}
                  </div>
                </div>
              )}

              {orderMode === 'pickup' && (
                <div className="bg-surface-container border border-surface-variant/20 rounded-2xl p-5 space-y-1.5 animate-in fade-in duration-300 text-xs text-on-surface-variant">
                  <p className="font-bold text-primary">Ready in 15 Minutes</p>
                  <p>Walk directly to our express pickup counter at our Forest Sanctuary. Simply show your order confirmation to receive your delicacies.</p>
                </div>
              )}
            </div>

            {/* Fresh baked list of items */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-primary tracking-tight">Oven-Fresh Baked Specialties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {freshBakedItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-surface-variant/10 p-4 flex gap-4 shadow-sm hover:shadow-md transition-all">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-20 h-20 rounded-xl object-cover border border-surface-variant/10 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-primary leading-snug">{item.name}</h4>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-variant/10">
                        <span className="text-primary font-bold text-xs">${item.price.toFixed(2)}</span>
                        <button
                          onClick={() => onAddToBasket(item)}
                          className="bg-primary hover:bg-primary-container text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        >
                          Add +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: Basket Summary & Checkout details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-surface-variant/20 shadow-md p-6 space-y-6">
              
              <div className="border-b border-surface-variant/20 pb-4">
                <h3 className="font-serif text-lg font-bold text-primary">Basket Summary</h3>
                <p className="text-[11px] text-on-surface-variant">Review items in your order.</p>
              </div>

              {/* Items listing */}
              {cartItems.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="p-3 bg-surface-container rounded-full w-12 h-12 flex items-center justify-center mx-auto text-on-surface-variant">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium">Your basket is empty.</p>
                  <p className="text-[10px] text-on-surface-variant px-4">Click "Add +" on any of our freshly baked specialties on the left to start building your order!</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                  {cartItems.map((item) => (
                    <div key={item.menuItem.id} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary">{item.quantity}x</span>
                        <span className="font-semibold text-primary">{item.menuItem.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary">${(item.menuItem.price * item.quantity).toFixed(2)}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                            className="bg-surface-container hover:bg-surface-container-high p-1 rounded text-primary text-[10px] font-bold"
                          >
                            -
                          </button>
                          <button
                            onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                            className="bg-surface-container hover:bg-surface-container-high p-1 rounded text-primary text-[10px] font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Input fields */}
              <div className="border-t border-surface-variant/20 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wide">Customer Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-primary mb-1 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2.5 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div className="border-t border-surface-variant/20 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span>
                  <span className="font-semibold text-primary">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>Service/Delivery Fee</span>
                  <span className="font-semibold text-primary">{fee === 0 ? 'Free' : `$${fee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm text-primary font-bold pt-2 border-t border-surface-variant/20">
                  <span>Grand Total</span>
                  <span className="text-base font-extrabold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              {/* Submission error message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-[11px] text-red-600 font-semibold">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              {/* Proceed to Details / Submit Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={cartItems.length === 0 || isSubmitting}
                className="w-full bg-primary hover:bg-primary-container disabled:opacity-40 text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase shadow hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    Placing Order...
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : (
                  <>
                    {session ? 'Place Order' : 'Sign in to Place Order'}
                    <Sparkles className="w-4 h-4 text-tertiary-fixed-dim" />
                  </>
                )}
              </button>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
