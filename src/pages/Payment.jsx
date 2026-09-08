import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder, submitPayment } from "../api/client";
 
/**
 * NOTE: renders only the <main> content of the mockup — the fixed
 * <header> and bottom <nav> are assumed to live in a shared Layout,
 * same as the ServiceCall and ComplaintRating conversions.
 *
 * Needs the Material Symbols font loaded once, globally, plus the
 * design system's Tailwind tokens configured in tailwind.config.js.
 */
 
const PAYMENT_OPTIONS = [
  {
    id: "card",
    icon: "credit_card",
    title: "Debit / Credit Card",
    description: "Visa, Mastercard, Verve & Apple Pay",
    recommended: true,
  },
  {
    id: "transfer",
    icon: "account_balance",
    title: "Direct Bank Transfer",
    description: "Virtual account auto-assigned to Table",
  },
  {
    id: "ussd",
    icon: "dialpad",
    title: "USSD Quick Code",
    description: "Dial *737*... or select your bank code",
  },
];
 
const VAT_RATE = 0.12;
 
export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
 
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paying, setPaying] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
 
  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load order."))
      .finally(() => setLoading(false));
  }, [orderId]);
 
  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      await submitPayment(orderId, paymentMethod);
      setShowSuccessModal(true);
    } catch (err) {
      setError(err.message || "Payment simulation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };
 
  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading bill...</p>
      </main>
    );
  }
 
  if (error && !order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-error">{error}</p>
      </main>
    );
  }
 
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const vatRate = order.vatRate ?? VAT_RATE;
  const vatAmount = subtotal * vatRate;
  const grandTotal = subtotal + vatAmount;
  const vatPercentLabel = `${Math.round(vatRate * 100)}%`;
 
  const formatCurrency = (amount) => `\u20A6${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
 
  return (
    <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
      <div className="flex flex-col w-full px-screen-margin-mobile pb-gutter-2xl">
        {/* Top Role Visual State Sub-indicator */}
        <div className="flex items-center justify-between mt-gutter-sm mb-gutter-md">
          <div className="inline-flex items-center gap-gutter-xs bg-secondary-container text-on-secondary-container px-gutter-sm py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Customer Mode • Table {order.tableNumber}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            <span>Session #{String(order.id).slice(-6).toUpperCase()}</span>
          </div>
        </div>
 
        {/* Screen Header Badge & Context */}
        <div className="flex flex-col gap-1 mb-gutter-lg">
          <div className="flex items-center gap-gutter-xs">
            <span className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface font-bold tracking-tight">Table Bill &amp; Payment</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {order.restaurantName} • Table {order.tableNumber} • Order #{String(order.id).slice(-6).toUpperCase()}
          </p>
        </div>
 
        {/* Main Order Breakdown Card */}
        <div className="bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm mb-gutter-lg">
          <div className="flex items-center justify-between pb-gutter-sm mb-gutter-sm">
            <div className="flex items-center gap-gutter-xs text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">receipt</span>
              <span className="font-title-md text-title-md font-bold">Order Summary</span>
            </div>
            <span className="font-label-sm text-label-sm uppercase tracking-wide bg-surface-container px-gutter-sm py-0.5 rounded-full text-on-surface-variant font-semibold">
              {order.items.length} item{order.items.length === 1 ? "" : "s"}
            </span>
          </div>
 
          {/* Items List */}
          <div className="flex flex-col gap-gutter-md">
            {order.items.map((item) => (
              <div className="flex items-center justify-between gap-gutter-sm" key={item.id}>
                <div className="flex items-center gap-gutter-sm min-w-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container shadow-inner">
                    {item.imageUrl && <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.name} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-label-sm text-label-sm bg-primary-fixed text-on-primary-fixed-variant px-1.5 py-0.5 rounded font-bold">
                        {item.quantity}x
                      </span>
                      <span className="font-title-md text-title-md text-on-surface truncate">{item.name}</span>
                    </div>
                    {item.note && <span className="font-body-sm text-body-sm text-on-surface-variant">{item.note}</span>}
                  </div>
                </div>
                <span className="font-title-md text-title-md text-on-surface font-semibold flex-shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
 
          {/* Calculations Sub-block */}
          <div className="mt-gutter-md pt-gutter-md flex flex-col gap-gutter-xs bg-surface-container-low p-gutter-md rounded-lg">
            <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
              <span>Subtotal</span>
              <span className="text-on-surface font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-on-surface-variant font-body-md text-body-md">
              <div className="flex items-center gap-1">
                <span>VAT &amp; Service Fee</span>
                <span className="font-label-sm text-label-sm bg-surface-container-highest px-1 rounded text-on-surface-variant">{vatPercentLabel}</span>
              </div>
              <span className="text-on-surface font-medium">{formatCurrency(vatAmount)}</span>
            </div>
            <div className="h-0.5 bg-surface-variant my-1 rounded-full" />
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Grand Total</span>
                <span className="font-label-sm text-label-sm text-secondary font-semibold">Taxes &amp; Gratuity included</span>
              </div>
              <span className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
 
        {/* Select Payment Method Section */}
        <div className="flex flex-col gap-gutter-sm mb-gutter-xl">
          <div className="flex items-center justify-between px-1">
            <span className="font-title-md text-title-md font-bold text-on-surface">Payment Method</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Instant confirmation</span>
          </div>
 
          {/* Radio Card Group */}
          <div aria-label="Select Payment Method" className="flex flex-col gap-gutter-sm" role="radiogroup">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = paymentMethod === option.id;
              return (
                <label className="cursor-pointer transition-all duration-200" key={option.id}>
                  <input
                    className="peer sr-only"
                    name="payment_method"
                    type="radio"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => setPaymentMethod(option.id)}
                  />
                  <div
                    className={`p-gutter-md rounded-xl shadow-sm flex items-center justify-between gap-gutter-md relative overflow-hidden ${
                      isSelected ? "bg-primary-fixed/20 shadow-md" : "bg-surface-container-lowest"
                    }`}
                  >
                    <div className="flex items-center gap-gutter-md min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-on-surface-variant"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[24px]">{option.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-gutter-xs">
                          <span className="font-title-md text-title-md font-bold text-on-surface">{option.title}</span>
                          {option.recommended && (
                            <span className="bg-secondary-container text-on-secondary-container font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                          {option.id === "transfer" ? `Virtual account auto-assigned to Table ${order.tableNumber}` : option.description}
                        </span>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container text-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
 
        {/* Dynamic Detail Card for Selected Method */}
        <div className="bg-surface-container p-gutter-md rounded-xl mb-gutter-lg flex items-center gap-gutter-md">
          <span className="material-symbols-outlined text-secondary text-[28px] flex-shrink-0">lock</span>
          <div className="flex flex-col min-w-0">
            <span className="font-label-lg text-label-lg text-on-surface font-semibold">End-to-End Encrypted Simulation</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Tap below to preview the tableside settlement flow with zero actual charges.
            </span>
          </div>
        </div>
 
        {error && <p className="font-body-sm text-body-sm text-error px-1 mb-gutter-sm">{error}</p>}
 
        {/* Prominent Pretend Payment Call-to-Action */}
        <div className="flex flex-col items-center gap-gutter-xs w-full">
          <div className="flex items-center gap-1.5 text-on-surface-variant font-label-md text-label-md">
            <span className="material-symbols-outlined text-[16px] text-primary">info</span>
            <span>This is a simulation — no real charge will be made.</span>
          </div>
          <button
            className="w-full h-14 bg-primary hover:bg-primary-container active:scale-[0.98] transition-all duration-150 text-on-primary rounded-xl font-headline-sm text-headline-sm flex items-center justify-center gap-gutter-sm shadow-md cursor-pointer disabled:opacity-70"
            onClick={handlePay}
            disabled={paying}
          >
            <span className="material-symbols-outlined text-[22px]">lock_open</span>
            <span>{paying ? "Processing..." : `Pay (Pretend Payment) • ${formatCurrency(grandTotal)}`}</span>
          </button>
        </div>
 
        {/* Interactive Simulation Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-screen-margin-mobile bg-inverse-surface/60 backdrop-blur-sm transition-opacity">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-xl p-gutter-xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-gutter-md shadow-inner">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface font-bold mb-1">Pretend Payment Successful!</span>
              <p className="font-body-md text-body-md text-on-surface-variant mb-gutter-md">
                Table {order.tableNumber} is settled. Receipt #{String(order.id).slice(-6).toUpperCase()} has been saved to your digital guestbook.
              </p>
              <div className="w-full bg-surface-container p-gutter-sm rounded-lg flex justify-between text-on-surface mb-gutter-lg font-label-md text-label-md">
                <span>Amount Simulated</span>
                <span className="font-bold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
              <button
                className="w-full h-12 bg-secondary text-on-secondary rounded-xl font-label-lg text-label-lg font-bold hover:bg-on-secondary-container transition-colors"
                onClick={() => navigate(`/orders/${orderId}/receipt`)}
              >
                Done &amp; Return to Table
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
 