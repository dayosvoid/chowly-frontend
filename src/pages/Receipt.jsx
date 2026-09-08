import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder } from "../api/client";
 
/**
 * NOTE: renders only the <main> content of the mockup — the fixed
 * <header> and bottom <nav> are assumed to live in a shared Layout,
 * same as the ServiceCall, ComplaintRating, and Payment conversions.
 *
 * Needs the Material Symbols font loaded once, globally, plus the
 * design system's Tailwind tokens configured in tailwind.config.js.
 */
 
const VAT_RATE = 0.12;
 
function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}
 
export default function Receipt() {
  const { orderId } = useParams();
  const navigate = useNavigate();
 
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shared, setShared] = useState(false);
  const [complimentSent, setComplimentSent] = useState(false);
 
  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load receipt."))
      .finally(() => setLoading(false));
  }, [orderId]);
 
  const shareReceipt = async () => {
    const text = `Receipt for Table ${order.tableNumber} at ${order.restaurantName}: \u20A6${order.amount.toLocaleString()} paid via Chowly.`;
 
    if (navigator.share) {
      try {
        await navigator.share({ title: "Chowly Receipt", text });
      } catch {
        // user dismissed the share sheet
      }
    } else {
      setShared(true);
      window.setTimeout(() => setShared(false), 2200);
    }
  };
 
  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading receipt...</p>
      </main>
    );
  }
 
  if (error || !order) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-error">{error || "Order not found."}</p>
      </main>
    );
  }
 
  const paidTime = order.paidAt
    ? new Date(order.paidAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "--";
 
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const taxAmount = order.amount != null ? Math.max(order.amount - subtotal, 0) : subtotal * VAT_RATE;
  const totalPaid = order.amount ?? subtotal + taxAmount;
 
  const formatCurrency = (amount) => `\u20A6${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
 
  return (
    <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
      <div className="flex flex-col w-full px-screen-margin-mobile pb-gutter-2xl">
        {/* Customer / Waiter Role Quick Bar (Customer Active) */}
        <div className="flex items-center justify-between mb-gutter-lg pt-gutter-xs">
          <div className="inline-flex p-1 rounded-full bg-surface-container shadow-inner">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-lowest text-primary shadow-sm font-label-md text-label-md transition-transform active:scale-95" type="button">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                person
              </span>
              <span>Customer</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-on-surface-variant font-label-md text-label-md opacity-70 hover:opacity-100 transition-opacity" type="button">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>Waiter</span>
            </button>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span>Paid &amp; Settled</span>
          </div>
        </div>
 
        {/* Hero Success Badge & Delight Visual */}
        <div className="flex flex-col items-center text-center my-gutter-sm relative">
          <div className="relative flex items-center justify-center mb-gutter-md">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[44px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-fixed text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                celebration
              </span>
            </div>
          </div>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold mb-1">Receipt Confirmed</span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface">Payment Confirmed — Table {order.tableNumber}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs mt-1">
            Thank you for dining with us! A warm toast to your visit at {order.restaurantName}.
          </p>
        </div>
 
        {/* Artisanal Dining Receipt Card */}
        <div className="relative w-full mt-gutter-md rounded-2xl bg-surface-container-lowest shadow-md overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-tertiary to-secondary" />
          <div className="p-gutter-lg flex flex-col gap-gutter-md">
            {/* Restaurant Details */}
            <div className="flex items-center justify-between pb-gutter-xs">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{order.restaurantName}</h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Table {order.tableNumber} (Dine-In) • Order #{String(order.id).slice(-6).toUpperCase()}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[22px]">storefront</span>
              </div>
            </div>
 
            {/* Quick Meta Badges */}
            <div className="grid grid-cols-2 gap-gutter-xs py-gutter-xs px-gutter-sm rounded-xl bg-surface-container-low text-on-surface">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Time</span>
                <span className="font-label-md text-label-md font-semibold">{paidTime}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Auth Method</span>
                <span className="font-label-md text-label-md font-semibold truncate">
                  {capitalize(order.paymentMethod)}
                  {order.authCode ? ` • Auth #${order.authCode}` : ""}
                </span>
              </div>
            </div>
 
            {/* Itemized Receipt List */}
            <div className="flex flex-col gap-gutter-sm mt-gutter-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Itemized Details</span>
              {order.items.map((item) => (
                <div className="flex items-center justify-between py-1" key={item.id}>
                  <div className="flex items-start gap-2 min-w-0 pr-2">
                    <span className="font-label-md text-label-md px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">{item.quantity}x</span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-title-md text-title-md text-on-surface truncate">{item.name}</span>
                      {item.note && <span className="font-body-sm text-body-sm text-on-surface-variant">{item.note}</span>}
                    </div>
                  </div>
                  <span className="font-title-md text-title-md text-on-surface font-semibold flex-shrink-0">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
 
            {/* Tear-line visual divider */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="w-full border-t border-dashed border-outline-variant opacity-60" />
            </div>
 
            {/* Financial Calculation Breakdown */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-body-md text-body-md">Subtotal</span>
                <span className="font-body-md text-body-md text-on-surface">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-body-md text-body-md">Tax &amp; Service Charge</span>
                <span className="font-body-md text-body-md text-on-surface">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-gutter-xs">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">Total Paid</span>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Pretend {capitalize(order.paymentMethod)}
                    {order.cardLast4 ? ` (•••• ${order.cardLast4})` : ""}
                  </span>
                </div>
                <span className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          </div>
 
          {/* Scannable Micro Barcode / Ticket Footer */}
          <div className="bg-surface-container-low px-gutter-lg py-gutter-sm flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
              <span className="font-label-sm text-label-sm tracking-wide">VERIFIED RECEIPT • Chowly Pay</span>
            </div>
            <span className="font-label-sm text-label-sm font-semibold text-secondary">APPROVED</span>
          </div>
        </div>
 
        {/* Post-Meal Delight Card */}
        <div className="mt-gutter-md p-gutter-md rounded-xl bg-surface-container-low flex items-center gap-gutter-md">
          <div className="w-12 h-12 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary flex-shrink-0">
            <span className="material-symbols-outlined text-[26px]">favorite</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-title-md text-title-md text-on-surface">Enjoyed the Experience?</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">Compliments sent directly to our kitchen squad.</p>
          </div>
          <button
            className={`px-3 py-2 rounded-full shadow-sm font-label-md text-label-md active:scale-95 transition-transform flex-shrink-0 flex items-center gap-1 ${
              complimentSent ? "bg-primary-fixed text-primary" : "bg-surface-container-lowest text-tertiary"
            }`}
            type="button"
            disabled={complimentSent}
            onClick={() => setComplimentSent(true)}
          >
            {complimentSent ? (
              <>
                <span className="material-symbols-outlined text-[16px] text-primary">volunteer_activism</span> Sent!
              </>
            ) : (
              "Send 👏"
            )}
          </button>
        </div>
 
        {/* Primary and Secondary Actions */}
        <div className="flex flex-col gap-gutter-sm mt-gutter-xl w-full">
          <button
            className="w-full h-touch-target-min flex items-center justify-center gap-2 rounded-xl bg-surface-container-highest text-on-surface-variant font-label-lg text-label-lg active:scale-[0.99] transition-transform"
            type="button"
            onClick={shareReceipt}
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
            <span>{shared ? "Copied to share!" : "Download / Share Receipt"}</span>
          </button>
          <button
            className="w-full h-touch-target-min flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary font-headline-sm text-headline-sm shadow-md active:scale-[0.99] hover:bg-primary-container transition-all"
            type="button"
            onClick={() => navigate(`/orders/${orderId}/review`)}
          >
            <span>Done</span>
            <span className="material-symbols-outlined text-[20px]">done_all</span>
          </button>
        </div>
      </div>
    </main>
  );
}
 