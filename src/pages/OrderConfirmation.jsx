import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  Radar,
  ConciergeBell,
  PlusCircle,
  Utensils,
  Shield,
  Leaf,
  Menu as MenuIcon,
  Receipt,
  Table,
} from "lucide-react";
import { getOrder } from "../api/client";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const navigateInstance = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [trackBtnState, setTrackBtnState] = useState("default");

  useEffect(() => {
    getOrder(orderId)
      .then(setOrder)
      .catch(() => setError("Could not load your order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const showNotice = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };

  const handleTrackOrder = () => {
    navigateInstance(`/orders/${orderId}/status`);
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
        <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface items-center justify-center">
          <p>Loading your order...</p>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
        <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface items-center justify-center">
          <p className="text-error">{error || "Order not found."}</p>
        </main>
      </div>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
      <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
        <div className="flex flex-col w-full px-screen-margin-mobile pb-6 gap-gutter-lg">
          <div className="flex items-center justify-between pt-2">
            <div className="inline-flex items-center bg-surface-container p-gutter-xs rounded-full shadow-inner">
              <button
                className="flex items-center gap-1.5 px-gutter-md h-9 rounded-full bg-surface-container-lowest text-primary shadow-sm font-label-md text-label-md transition-transform active:scale-95"
                type="button"
              >
                <Utensils size={16} />
                <span>Active Items</span>
              </button>
              <button
                className="flex items-center gap-1.5 px-gutter-md h-9 rounded-full text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors"
                type="button"
              >
                <Receipt size={16} />
                <span>Table Bill</span>
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-surface-container-high px-gutter-md py-1.5 rounded-full text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>Table {order.tableNumber} • Dine-in</span>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary rounded-xl p-gutter-xl shadow-md">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-on-primary/10 blur-xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-on-primary/15 flex items-center justify-center mb-3 shadow-inner">
                <CheckCircle2
                  className="text-on-primary"
                  size={30}
                  style={{ fill: "currentColor" }}
                />
              </div>
              <div className="inline-block bg-on-primary/20 px-3 py-0.5 rounded-full font-label-sm text-label-sm tracking-wider uppercase mb-1">
                Sent To Kitchen Station
              </div>
              <h2 className="font-headline-xl-mobile text-headline-xl-mobile font-bold tracking-tight text-on-primary">
                Order #{String(order.id).slice(-6).toUpperCase()} Submitted!
              </h2>
              <p className="font-body-sm text-body-sm text-on-primary/80 mt-1 max-w-xs">
                Chef Marco and the team have received your ticket. Relax, pour
                some water, and we’ll take care of the rest.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
                  <Clock3 size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-bold">
                    Estimated Wait Time
                  </span>
                  <span className="font-headline-md text-headline-md font-bold text-on-surface">
                    ~{order.estimatedWaitMinutes} minutes
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold">
                On Schedule
              </span>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: "38%" }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                  Order Queued
                </span>
                <span>Prepping Ingredients</span>
                <span className="opacity-50">Plating &amp; Serving</span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-md">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                Items in this Ticket
              </h3>
              <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                {order.items.length} dish{order.items.length !== 1 ? "es" : ""}
              </span>
            </div>

            {order.items.map((item) => (
              <div className="flex items-center gap-3 py-1" key={item.id}>
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container">
                  <img
                    className="w-full h-full object-cover"
                    src={
                      item.imageUrl ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuCLqE9w3jaD0AgyUH3Chzt3hQuD4auZaoONb_HUrvx4BeTsjx69wAQFZI2vSeRvswGSei_7MIRYSglCLqv7IZZXLHJcQv48HVieozkMzKu17tW8VkiWC57H2JvlWh5_NnI0q8GkpeQ76ge6Im8IskjQiFE2GrHDKsZutctCfceHP46avdp0v1N3hBBgTWJZjTpKP_j60_IFSIJnSn4HH6b58GaozI_Dts-wrarPQay0F-KbsOKXRPlZag"
                    }
                    alt={item.name}
                  />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="font-body-md text-body-md font-semibold text-on-surface truncate">
                      {item.name}
                    </h4>
                    <span className="font-label-lg text-label-lg font-bold text-on-surface shrink-0">
                      {"\u20A6"}
                      {(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold">
                      {item.quantity}×
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {item.description || "Handmade specialty dish"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-surface-container-low rounded-lg p-gutter-md flex flex-col gap-2 mt-1">
              <div className="flex justify-between items-center text-body-sm font-body-sm text-on-surface-variant">
                <span>Subtotal</span>
                <span>
                  {"\u20A6"}
                  {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-body-sm font-body-sm text-on-surface-variant">
                <span>Table Order Status</span>
                <span className="text-secondary font-semibold">
                  Billed to Table {order.tableNumber}
                </span>
              </div>
              <div className="pt-2 mt-1 flex justify-between items-baseline bg-surface-container-lowest rounded-md px-3 py-2">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-outline uppercase font-bold tracking-wider">
                    Total Amount Due
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Pay upon departure or split bill
                  </span>
                </div>
                <span className="font-headline-lg text-headline-lg font-bold text-primary">
                  {"\u20A6"}
                  {subtotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            <button
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg font-semibold flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all"
              id="trackOrderBtn"
              type="button"
              onClick={handleTrackOrder}
            >
              <Radar size={20} />
              <span>Track Order Status</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="h-12 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
                type="button"
                onClick={() => navigateInstance("/menu")}
              >
                <PlusCircle size={18} />
                <span>Add More Items</span>
              </button>
              <button
                className="h-12 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md font-semibold flex items-center justify-center gap-1.5 active:scale-[0.99] transition-all"
                type="button"
                onClick={() => showNotice("A waiter has been notified.")}
              >
                <ConciergeBell size={18} />
                <span>Call Waiter</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-center text-on-surface-variant font-body-sm text-body-sm pt-2">
            <Leaf className="text-secondary" size={18} />
            <span>Ingredients freshly picked &amp; prepared sustainably</span>
          </div>
        </div>

        {notice && (
          <div
            className="toast fixed bottom-20 left-1/2 -translate-x-1/2 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium"
            role="status"
          >
            {notice}
          </div>
        )}
      </main>

      <nav
        className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)]"
        data-active-classes="text-primary font-label-md font-bold"
      >
        <div className="flex justify-around items-center h-16 px-screen-margin-mobile max-w-lg mx-auto">
          <a
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors"
            href="#menu"
          >
            <MenuIcon size={22} />
            <span className="font-label-sm text-label-sm mt-0.5">Menu</span>
          </a>
          <a
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors"
            href="#table-order"
          >
            <Receipt size={22} />
            <span className="font-label-sm text-label-sm mt-0.5">
              Table Bill
            </span>
          </a>
          <a
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors"
            href="#service-call"
          >
            <ConciergeBell size={22} />
            <span className="font-label-sm text-label-sm mt-0.5">Service</span>
          </a>
          <a
            className="flex flex-col items-center justify-center min-w-[48px] min-h-[48px] text-on-surface-variant transition-colors"
            href="#waiter-tables"
          >
            <Table size={22} />
            <span className="font-label-sm text-label-sm mt-0.5">Tables</span>
          </a>
        </div>
      </nav>
    </div>
  );
}
