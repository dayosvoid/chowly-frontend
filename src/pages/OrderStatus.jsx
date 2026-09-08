import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getOrder } from "../api/client";
 
/**
 * NOTE: This component renders only the <main> content of the mockup.
 * The fixed <header> (logo / Customer-Waiter switch / avatar) and the
 * bottom <nav> bar are assumed to be rendered once by a shared Layout
 * component that wraps every page (as in the existing OrderStatus
 * screen), so they aren't duplicated here. If that's not the case in
 * this app, lift them back in around the <main> element below.
 *
 * This screen also needs the Material Symbols font loaded once,
 * globally (it's not something a single component can pull in):
 *   <link rel="preconnect" href="https://fonts.googleapis.com" />
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
 *   <link
 *     href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
 *     rel="stylesheet"
 *   />
 * and the custom Tailwind tokens from the design system (surface-*,
 * primary, gutter-*, etc.) configured in tailwind.config.js.
 */
 
const STATUS_STEPS = ["pending", "in_progress", "served"];
 
function toDisplayStatus(status) {
  if (status === "assigned") return "in_progress";
  if (status === "paid") return "served";
  return status;
}
 
const STEP_CONFIG = {
  pending: {
    label: "Pending",
    currentIcon: "hourglass_top",
    upcomingIcon: "hourglass_top",
    currentDescription: "Waiting to be picked up by the kitchen.",
    completedDescription: "Received & confirmed by dining terminal",
  },
  in_progress: {
    label: "In Progress",
    currentIcon: "cyclone",
    upcomingIcon: "skillet",
    currentDescription: "Kitchen & bar teams actively crafting your items.",
    completedDescription: "Fired and prepared by the kitchen & bar.",
  },
  served: {
    label: "Served",
    currentIcon: "dinner_dining",
    upcomingIcon: "dinner_dining",
    currentDescription: "Delivered table-side with fresh pairings.",
    completedDescription: "Delivered table-side with fresh pairings",
  },
};
 
const HERO_META = {
  pending: { percent: 10, icon: "receipt_long", title: "Order Received", description: "Your order has been sent to the kitchen and bar." },
  in_progress: { percent: 65, icon: "skillet", title: "Firing Table Order", description: "Dishes are sizzling on the pass, cocktails being shaken." },
  served: { percent: 100, icon: "check_circle", title: "Order Served", description: "Enjoy your meal! Let us know if you need anything." },
};
 
const CIRCUMFERENCE = 2 * Math.PI * 20; // r = 20
 
function formatTime(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
 
function findStatusTime(order, status) {
  const entry = order.statusHistory?.find((h) => h.status === status);
  return formatTime(entry?.timestamp);
}
 
export default function ServiceCall() {
  const { orderId } = useParams();
  const navigate = useNavigate();
 
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
 
  useEffect(() => {
    let cancelled = false;
 
    const fetchOrder = () => {
      getOrder(orderId)
        .then((data) => {
          if (!cancelled) setOrder(data);
        })
        .catch(() => {
          if (!cancelled) setError("Could not load order status.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };
 
    fetchOrder();
 
    const interval = setInterval(() => {
      const current = toDisplayStatus(order?.status);
      if (current !== "served") fetchOrder();
    }, 5000);
 
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, order?.status]);
 
  const notifyStaff = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4500);
  };
 
  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading order status...</p>
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
 
  const displayStatus = toDisplayStatus(order.status);
  const stepIndex = STATUS_STEPS.indexOf(displayStatus);
  const hero = HERO_META[displayStatus];
  const dashOffset = CIRCUMFERENCE * (1 - hero.percent / 100);
 
  const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const stemHeightPct = stepIndex === 0 ? 0 : stepIndex === 1 ? 52 : 100;
  const placedAt = findStatusTime(order, "pending") ?? formatTime(order.createdAt);
 
  // dedupe staff who worked on this order
  const staffMap = new Map();
  order.items.forEach((item) => {
    if (item.chef) {
      const key = `chef-${item.chef.id}`;
      if (!staffMap.has(key)) {
        staffMap.set(key, { id: item.chef.id, name: item.chef.fullName, photoUrl: item.chef.photoUrl, role: "chef", items: [] });
      }
      staffMap.get(key).items.push(item.name);
    }
    if (item.bartender) {
      const key = `bartender-${item.bartender.id}`;
      if (!staffMap.has(key)) {
        staffMap.set(key, { id: item.bartender.id, name: item.bartender.fullName, photoUrl: item.bartender.photoUrl, role: "bartender", items: [] });
      }
      staffMap.get(key).items.push(item.name);
    }
  });
  const staffList = Array.from(staffMap.values());
 
  return (
    <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
      <div className="flex flex-col w-full px-screen-margin-mobile pb-6 gap-gutter-lg">
        {/* Role Indicator Capsule (Customer Active) */}
        <div className="flex items-center justify-between bg-surface-container-low p-gutter-xs rounded-full shadow-sm">
          <div className="flex items-center gap-gutter-sm pl-gutter-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">Dining Session</span>
          </div>
          <div className="flex items-center bg-surface-container-highest p-1 rounded-full">
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm transition-transform active:scale-95">
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>Customer</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1 rounded-full text-on-surface-variant font-label-md text-label-md hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[16px]">badge</span>
              <span>Staff View</span>
            </button>
          </div>
        </div>
 
        {/* Order Title Card & ETA Hero */}
        <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-md">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm uppercase text-primary font-bold tracking-wider">Order Tracker</span>
              <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">
                Order #{String(order.id).slice(-6).toUpperCase()}
              </h2>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                {order.restaurantName} • Table {order.tableNumber}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-label-sm text-label-sm text-on-surface-variant">Est. Arrival</span>
              <span className="font-headline-lg text-headline-lg text-primary font-bold">~{order.estimatedWaitMinutes} min</span>
            </div>
          </div>
 
          {/* Radial Progress & Visual Pulse Ring */}
          <div className="flex items-center gap-gutter-md bg-surface-container p-gutter-md rounded-xl">
            <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
                <circle className="text-surface-variant" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4" />
                <circle
                  className="text-primary"
                  cx="24"
                  cy="24"
                  fill="transparent"
                  r="20"
                  stroke="currentColor"
                  strokeDasharray={CIRCUMFERENCE.toFixed(1)}
                  strokeDashoffset={dashOffset.toFixed(1)}
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="material-symbols-outlined absolute text-primary text-[20px] animate-pulse">{hero.icon}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface truncate">{hero.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  {hero.percent}%
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{hero.description}</p>
            </div>
          </div>
        </div>
 
        {/* 3-State Progress Flow Tracker */}
        <div className="bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-md">
          <div className="flex items-center justify-between pb-gutter-xs">
            <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">Status Milestones</span>
            {placedAt && <span className="font-body-sm text-body-sm text-on-surface-variant">Order placed at {placedAt}</span>}
          </div>
 
          {/* Timeline Steps Container */}
          <div className="relative flex flex-col gap-6 pl-2 pt-1">
            {/* Vertical connecting stem */}
            <div className="absolute left-6 top-3 bottom-5 w-0.5 bg-surface-variant" />
            <div
              className="absolute left-6 top-3 w-0.5 bg-primary transition-all duration-700"
              style={{ height: `${stemHeightPct}%` }}
            />
 
            {STATUS_STEPS.map((step, i) => {
              const config = STEP_CONFIG[step];
              const state = i < stepIndex ? "completed" : i === stepIndex ? "current" : "upcoming";
              const stepTime = findStatusTime(order, step);
 
              if (state === "completed") {
                return (
                  <div className="relative flex items-start gap-gutter-md z-10" key={step}>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                    <div className="flex flex-col min-w-0 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-title-md text-title-md text-on-surface line-through opacity-80">
                          {i + 1}. {config.label}
                        </span>
                        {stepTime && <span className="font-label-sm text-label-sm text-on-surface-variant">{stepTime}</span>}
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{config.completedDescription}</span>
                    </div>
                  </div>
                );
              }
 
              if (state === "current") {
                return (
                  <div className="relative flex items-start gap-gutter-md z-10" key={step}>
                    <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0 shadow-md ring-4 ring-primary-fixed">
                      <span className={`material-symbols-outlined text-[18px] ${config.currentIcon === "cyclone" ? "animate-spin" : ""}`}>
                        {config.currentIcon}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0 pt-0.5 bg-primary-fixed/30 p-gutter-md rounded-xl w-full">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-title-md text-title-md text-on-surface font-bold">
                            {i + 1}. {config.label}
                          </span>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                          </span>
                        </div>
                        {stepTime && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-bold">
                            Started {stepTime}
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{config.currentDescription}</p>
                    </div>
                  </div>
                );
              }
 
              return (
                <div className="relative flex items-start gap-gutter-md z-10 opacity-60" key={step}>
                  <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">{config.upcomingIcon}</span>
                  </div>
                  <div className="flex flex-col min-w-0 pt-1">
                    <span className="font-title-md text-title-md text-on-surface">
                      {i + 1}. {config.label}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{config.completedDescription}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        {/* Assigned Artisan Staff Section */}
        {staffList.length > 0 && (
          <div className="flex flex-col gap-gutter-sm">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-on-surface">Crafted By</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Kitchen &amp; Bar</span>
            </div>
            <div className="grid grid-cols-1 gap-gutter-sm">
              {staffList.map((person) => (
                <div className="flex items-center justify-between bg-surface-container-lowest p-gutter-md rounded-xl shadow-sm" key={`${person.role}-${person.id}`}>
                  <div className="flex items-center gap-gutter-md min-w-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container flex items-center justify-center">
                      {person.photoUrl ? (
                        <img className="w-full h-full object-cover" src={person.photoUrl} alt={`${person.name} portrait`} />
                      ) : (
                        <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                          {person.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-[18px] ${person.role === "chef" ? "text-primary" : "text-tertiary-container"}`}>
                          {person.role === "chef" ? "restaurant" : "local_bar"}
                        </span>
                        <span className="font-title-md text-title-md text-on-surface truncate">{person.name}</span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {person.role === "chef" ? "Kitchen" : "Bar"} • {person.items.length} item{person.items.length === 1 ? "" : "s"}
                      </span>
                      <span className={`font-label-sm text-label-sm font-semibold mt-0.5 ${person.role === "chef" ? "text-secondary" : "text-tertiary"}`}>
                        {person.items.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
 
        {/* Live Table Note / Hospitality Touch */}
        {order.kitchenNote && (
          <div className="flex items-start gap-gutter-md bg-secondary-container/40 p-gutter-md rounded-xl">
            <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[18px]">wb_twilight</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-title-md text-title-md text-on-secondary-container font-semibold">Table {order.tableNumber} Vibe</span>
              <p className="font-body-sm text-body-sm text-on-secondary-container/90 mt-0.5">{order.kitchenNote}</p>
            </div>
          </div>
        )}
 
        {/* Service Actions & Bill Inspection */}
        <div className="flex flex-col gap-gutter-sm mt-gutter-xs">
          <div className="grid grid-cols-2 gap-gutter-sm">
            <button
              className="h-touch-target-min px-gutter-md rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 hover:bg-surface-container-highest"
              onClick={() => notifyStaff(order.waiter?.fullName ? `${order.waiter.fullName} has been notified and is heading to Table ${order.tableNumber}` : "A server has been notified.")}
            >
              <span className="material-symbols-outlined text-primary text-[20px]">room_service</span>
              <span>Call Waiter</span>
            </button>
            <button
              className="h-touch-target-min px-gutter-md rounded-xl bg-surface-container-high text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95 hover:bg-surface-container-highest"
              onClick={() => navigate(`/orders/${orderId}/payment`)}
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              <span>View Bill ({"\u20A6"}{total.toLocaleString()})</span>
            </button>
          </div>
 
          {/* Request Dedicated Service Bar */}
          <button 
            className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary-container text-on-secondary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all mt-3" 
            type="button"
            onClick={() => navigate(`/orders/${orderId}/payment`)}
          >
            <span className="material-symbols-outlined text-[20px]">receipt</span>
            <span>Proceed to Payment (₦{total.toLocaleString()})</span>
          </button>

          <button
            className="w-full h-touch-target-min rounded-xl bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] hover:bg-primary-container"
            onClick={() => notifyStaff(order.waiter?.fullName ? `${order.waiter.fullName} has been notified and is heading to Table ${order.tableNumber}` : "Our team has been notified and is on the way.")}
          >
            <span className="material-symbols-outlined text-[20px]">notifications_active</span>
            <span>Request Table Assistance or Refills</span>
          </button>
        </div>
 
        {/* Toast Notification for Interactions */}
        {toast && (
          <div className="fixed bottom-20 left-4 right-4 bg-inverse-surface text-inverse-on-surface p-4 rounded-xl shadow-xl z-50 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[24px]">support_agent</span>
              <div className="flex flex-col">
                <span className="font-title-md text-title-md">Staff Notified</span>
                <span className="font-body-sm text-body-sm opacity-80">{toast}</span>
              </div>
            </div>
            <button className="p-2 text-inverse-on-surface hover:opacity-100 opacity-70" onClick={() => setToast(null)}>
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}