import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Trash2, ShieldAlert, Car, MapPin, Navigation, ShoppingBag, Sparkles, Loader2 } from 'lucide-react';
import { CartItem, OrderMode, OrderDetails } from '../types';
import { submitOrder, ApiError } from '../api';
import { SITE_CONTENT } from '../mockData';
import { useAuth, displayNameFromUser } from '../context/AuthContext';

interface BasketSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOrderSuccess: (details: OrderDetails) => void;
  onRequireAuth: () => void;
}

export default function BasketSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
  onRequireAuth,
}: BasketSidebarProps) {
  const { user, session, getAccessToken } = useAuth();
  const [orderMode, setOrderMode] = useState<OrderMode>('pickup');
  const [licensePlate, setLicensePlate] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'details'>('cart');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!fullName.trim()) {
      const suggested = displayNameFromUser(user);
      if (suggested) setFullName(suggested);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  // Pricing calculations (client-side estimate only — the server recomputes
  // the authoritative totals from current menu prices when the order is placed)
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
      newErrors.licensePlate = "Vehicle license plate is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToDetails = () => {
    if (!session) {
      onRequireAuth();
      return;
    }
    setCheckoutStep('details');
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;

    if (!session) {
      onRequireAuth();
      return;
    }

    const addressValue = orderMode === 'delivery' ? address : (orderMode === 'carhop' ? `Car-Hop: ${licensePlate}` : 'In-Store Pickup');

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

      const orderDetails: OrderDetails = {
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

      onOrderSuccess(orderDetails);
      // Reset form
      setFullName('');
      setPhone('');
      setAddress('');
      setLicensePlate('');
      setCheckoutStep('cart');
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
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Overlay Backdrop */}
      <div 
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="forest-gradient px-6 py-5 flex items-center justify-between border-b border-surface-variant/10 text-white">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-tertiary-fixed-dim" />
              <h2 className="font-serif text-xl font-bold tracking-tight">Your Basket</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/90 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          </div>

          {/* Cart View or Details View */}
          {checkoutStep === 'cart' ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              
              {/* Service Selection Toggle */}
              <div className="p-5 border-b border-surface-variant/20 bg-surface-container-low">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Service Preference</p>
                <div className="grid grid-cols-3 gap-2 bg-white p-1 rounded-xl border border-surface-variant/40">
                  <button
                    onClick={() => setOrderMode('pickup')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      orderMode === 'pickup' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Pickup
                  </button>
                  <button
                    onClick={() => setOrderMode('carhop')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      orderMode === 'carhop' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    Car-Hop
                  </button>
                  <button
                    onClick={() => setOrderMode('delivery')}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      orderMode === 'delivery' 
                        ? 'bg-primary text-white shadow-md' 
                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Delivery
                  </button>
                </div>

                {orderMode === 'carhop' && (
                  <div className="mt-4 bg-tertiary-fixed/30 border border-tertiary-fixed-dim/40 rounded-xl p-3 flex gap-3 items-center animate-in fade-in duration-200">
                    <img 
                      src={SITE_CONTENT.mascotUrl} 
                      alt="Mello" 
                      className="w-10 h-10 rounded-full bg-white p-1 border border-tertiary-fixed-dim/20 object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-primary">Mello Car Service</h4>
                      <p className="text-[10px] text-on-secondary-container leading-relaxed">Park beneath our forest canopy and we will run your treats directly to your car window!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 no-scrollbar">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="p-4 bg-surface-container rounded-full text-secondary">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-primary">Your basket is empty</h3>
                      <p className="text-xs text-on-surface-variant mt-1">Explore our menu and add artisan coffee or fresh bakeries to begin your delight.</p>
                    </div>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.menuItem.id} className="flex gap-4 p-3 bg-surface-container-low border border-surface-variant/10 rounded-xl hover:shadow-sm transition-all">
                      <img 
                        src={item.menuItem.image} 
                        alt={item.menuItem.name} 
                        className="w-16 h-16 rounded-lg object-cover border border-surface-variant/10"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-primary leading-snug">{item.menuItem.name}</h4>
                          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">${item.menuItem.price.toFixed(2)} each</p>
                        </div>
                        
                        {/* Quantity controls */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center bg-white rounded-lg border border-surface-variant/40 p-0.5">
                            <button 
                              onClick={() => onUpdateQuantity(item.menuItem.id, -1)}
                              className="p-1 hover:bg-surface-container rounded text-primary transition-colors cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-bold text-primary">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.menuItem.id, 1)}
                              className="p-1 hover:bg-surface-container rounded text-primary transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button 
                            onClick={() => onRemoveItem(item.menuItem.id)}
                            className="text-on-surface-variant hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bill Details & Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-surface-variant/30 p-5 bg-surface-container-lowest">
                  <div className="space-y-2 text-xs text-on-surface-variant mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-primary">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        {orderMode === 'pickup' && 'Pickup Fee'}
                        {orderMode === 'carhop' && 'Car-Hop Fee'}
                        {orderMode === 'delivery' && 'Delivery Fee'}
                      </span>
                      <span className="font-semibold text-primary">{fee === 0 ? 'Free' : `$${fee.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between text-sm text-primary font-bold pt-2 border-t border-surface-variant/30">
                      <span>Total Amount</span>
                      <span className="text-base text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToDetails}
                    className="w-full bg-primary hover:bg-primary-container text-white py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {session ? 'Proceed to Details' : 'Sign in to Checkout'}
                    <Sparkles className="w-4 h-4 text-tertiary-fixed-dim" />
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* DETAILS STEP */
            <div className="flex-1 flex flex-col justify-between overflow-y-auto">
              <form onSubmit={handleCheckoutSubmit} className="flex-1 p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-surface-variant/20 pb-3 mb-2">
                  <h3 className="font-serif text-lg font-bold text-primary">Checkout Details</h3>
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('cart')}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Back to Basket
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
                    />
                    {errors.fullName && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20"
                    />
                    {errors.phone && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.phone}</p>}
                  </div>

                  {/* Mode Specific Inputs */}
                  {orderMode === 'delivery' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">Delivery Address</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Woodland Avenue, Apt 4B, Pine Ridge"
                        rows={3}
                        className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20 resize-none"
                      />
                      {errors.address && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.address}</p>}
                    </div>
                  )}

                  {orderMode === 'carhop' && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">Vehicle License Plate</label>
                        <input
                          type="text"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          placeholder="ABC-1234"
                          className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-xs font-sans text-on-background focus:outline-none focus:ring-1 focus:ring-primary/40 border border-surface-variant/20 uppercase"
                        />
                        {errors.licensePlate && <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />{errors.licensePlate}</p>}
                      </div>
                      
                      <div className="bg-surface-container-low border border-surface-variant/30 rounded-xl p-4 flex gap-3">
                        <img 
                          src={SITE_CONTENT.mascotUrl} 
                          alt="Mello carhop helper" 
                          className="w-9 h-9 rounded-full object-cover bg-white p-1 flex-shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-[11px] leading-relaxed text-on-surface-variant">
                          <p className="font-semibold text-primary mb-0.5">Where to park:</p>
                          Our carhop spots are marked with a golden pine cone emblem. Park in any empty slot, and Mello will head right out.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>

              {/* Submission error message */}
              {submitError && (
                <div className="px-5 pt-3">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-[11px] text-red-600 font-semibold">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    {submitError}
                  </div>
                </div>
              )}

              {/* Submit panel */}
              <div className="border-t border-surface-variant/30 p-5 bg-surface-container-lowest">
                <div className="space-y-1 text-xs text-on-surface-variant mb-4">
                  <div className="flex justify-between">
                    <span>Summary</span>
                    <span>{cartItems.length} items</span>
                  </div>
                  <div className="flex justify-between text-primary font-bold text-sm pt-1">
                    <span>Grand Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white py-3.5 px-4 rounded-xl text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      Placing Order...
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </>
                  ) : (
                    'Confirm & Place Order'
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
