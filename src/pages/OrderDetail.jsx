import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, RefreshCw, Flame, Clock3 } from "lucide-react";
import { getOrder, getStaff, assignWaiter, assignStaffToItem, serveOrder } from "../api/client";
import "./OrderDetail.css";

function toDisplayStatus(status) {
  if (status === "assigned") return "in_progress";
  if (status === "paid") return "served";
  return status;
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [waiters, setWaiters] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [bartenders, setBartenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedWaiterId, setSelectedWaiterId] = useState("");

  const loadOrder = () => {
    return getOrder(orderId).then(setOrder);
  };

  useEffect(() => {
    loadOrder()
      .then((o) => {
        // order comes from state closure below via .then chain instead
      })
      .catch(() => setError("Could not load order."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    getStaff(order.restaurantId, "waiter").then(setWaiters).catch(() => {});
    getStaff(order.restaurantId, "chef").then(setChefs).catch(() => {});
    getStaff(order.restaurantId, "bartender").then(setBartenders).catch(() => {});
  }, [order?.restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrder().finally(() => setTimeout(() => setRefreshing(false), 400));
  };

  const handleClaim = async () => {
    if (!selectedWaiterId) return;
    setError("");
    try {
      const updated = await assignWaiter(orderId, selectedWaiterId);
      setOrder(updated);
    } catch (err) {
      setError(err.message || "Could not claim order.");
    }
  };

  const handleAssignItem = async (itemId, type, staffId) => {
    if (!staffId) return;
    setError("");
    try {
      const payload = type === "chef" ? { chefId: staffId } : { bartenderId: staffId };
      await assignStaffToItem(orderId, itemId, payload);
      await loadOrder();
    } catch (err) {
      setError(err.message || "Could not assign staff to item.");
    }
  };

  const handleMarkServed = async () => {
    setError("");
    try {
      await serveOrder(orderId);
      navigate("/waiter");
    } catch (err) {
      setError(err.message || "Could not mark order as served.");
    }
  };

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
        <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
          <div className="flex flex-col w-full px-screen-margin-mobile pb-6 gap-gutter-lg">
            <p>Loading order...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
        <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
          <div className="flex flex-col w-full px-screen-margin-mobile pb-6 gap-gutter-lg">
            <p className="input-error">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const displayStatus = toDisplayStatus(order.status);
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(order.orderTime).getTime()) / 60000));
  const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md text-body-md selection:bg-primary-fixed">
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 px-screen-margin-mobile flex items-center justify-between gap-gutter-sm">
          <div className="flex items-center gap-gutter-sm min-w-0">
            <button aria-label="Back" onClick={() => navigate("/waiter")} className="flex items-center justify-center">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-gutter-xs">
                <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight truncate">
                  Order #{String(order.id).slice(-6).toUpperCase()}
                </span>
                <span className="hidden xs:inline-block w-1 h-1 rounded-full bg-outline"></span>
                <span className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">Service Call</span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                Table {order.tableNumber} • {order.customerName}
              </span>
            </div>
          </div>
          <div className="flex items-center bg-surface-container p-gutter-xs rounded-full shadow-inner flex-shrink-0">
            <button aria-label="Refresh" onClick={handleRefresh} className="flex items-center justify-center px-gutter-md h-9 rounded-full font-label-md text-label-md transition-all text-on-surface-variant hover:text-on-surface">
              <RefreshCw size={18} className={refreshing ? "spinning" : ""} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
        <div className="flex flex-col w-full px-screen-margin-mobile pb-6 gap-gutter-lg">
          
          <section className="status-card relative overflow-hidden bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-md">
            <div className="flex items-start justify-between">
              <div className="status-icon flex items-center justify-center w-12 h-12 rounded-xl bg-primary-fixed text-on-primary-fixed-variant">
                <Flame size={22} />
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface mt-0.5">
                  {displayStatus === "pending" ? "Awaiting Assignment" : displayStatus === "in_progress" ? "In Progress" : "Served"}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Est. wait: {order.estimatedWaitMinutes} min</p>
              </div>
              <div className="elapsed flex flex-col items-end">
                <Clock3 size={14} />
                <strong className="font-headline-lg text-headline-lg text-primary font-bold">{elapsedMinutes}m</strong>
                <small className="font-label-sm text-label-sm text-on-surface-variant">Elapsed</small>
              </div>
            </div>
          </section>

          {!order.assignedWaiter && (
            <section className="claim-card bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-md">
              <b className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wide">Claim this order</b>
              <div className="claim-row flex items-center gap-gutter-sm">
                <select value={selectedWaiterId} onChange={(e) => setSelectedWaiterId(e.target.value)} className="flex-1 h-touch-target-min px-gutter-md rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant">
                  <option value="">Select yourself...</option>
                  {waiters.map((w) => (
                    <option key={w.id || w._id} value={w.id || w._id}>
                      {w.fullName}
                    </option>
                  ))}
                </select>
                <button onClick={handleClaim} disabled={!selectedWaiterId} className="h-touch-target-min px-gutter-lg rounded-xl bg-primary text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] hover:bg-primary-container disabled:opacity-50">
                  Claim
                </button>
              </div>
            </section>
          )}

          {order.assignedWaiter && (
            <section className="claimed-note bg-surface-container-low p-gutter-md rounded-xl font-title-md text-on-surface">
              Assigned waiter: <strong>{order.assignedWaiter.fullName}</strong>
            </section>
          )}

          {order.kitchenNote && (
            <section className="service-note flex items-start gap-gutter-md bg-secondary-container/40 p-gutter-md rounded-xl">
              <b>KITCHEN NOTE</b>
              <p>&ldquo;{order.kitchenNote}&rdquo;</p>
            </section>
          )}

          <div className="section-title flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Order Items &amp; Stations</h2>
            <small className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{order.items.length} ITEMS</small>
          </div>

          <div className="items flex flex-col gap-gutter-sm">
            {order.items.map((item) => {
              const staffOptions = item.type === "food" ? chefs : bartenders;
              const currentStaffId = item.type === "food" ? item.chef?.id : item.bartender?.id;

              return (
                <article className="item-card flex flex-col bg-surface-container-lowest p-gutter-md rounded-xl shadow-sm gap-gutter-sm" key={item.id}>
                  <div className="item-top flex items-start justify-between">
                    <div className="item-copy flex flex-col min-w-0">
                      <div className="item-title flex items-center justify-between gap-gutter-md">
                        <h3 className="font-title-md text-title-md text-on-surface truncate">{item.name}</h3>
                        <strong className="font-label-lg text-label-lg text-primary font-bold">{"\u20A6"}{(item.unitPrice * item.quantity).toLocaleString()}</strong>
                      </div>
                      <div className="item-meta font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        <span>Qty: {item.quantity}</span> • {item.type === "food" ? "Kitchen" : "Bar"}
                      </div>
                    </div>
                  </div>
                  <div className="station flex flex-col gap-gutter-xs">
                    <div className="station-label flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider">
                      <span>ASSIGN {item.type === "food" ? "CHEF" : "BARTENDER"}</span>
                      {currentStaffId && <b className="text-secondary">● Assigned</b>}
                    </div>
                    <select
                      value={currentStaffId || ""}
                      onChange={(e) => handleAssignItem(item.id, item.type === "food" ? "chef" : "bartender", e.target.value)}
                      className="h-touch-target-min px-gutter-md rounded-xl bg-surface-container text-on-surface font-body-md border border-outline-variant"
                    >
                      <option value="">Unassigned</option>
                      {staffOptions.map((s) => (
                        <option key={s.id || s._id} value={s.id || s._id}>
                          {s.fullName}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              );
            })}
          </div>

          <section className="accounting bg-surface-container-lowest rounded-xl p-gutter-lg shadow-sm flex flex-col gap-gutter-md">
            <div className="accounting-head">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Order Total</h2>
            </div>
            <div className="total flex items-center justify-between font-title-md text-on-surface">
              <strong>{order.items.length} items</strong>
              <b className="font-headline-md text-headline-md text-primary">{"\u20A6"}{total.toLocaleString()}</b>
            </div>
          </section>

          {error && <p className="input-error text-error font-body-sm">{error}</p>}

          <button
            className={`serve w-full h-touch-target-min rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
              displayStatus === "served" ? "bg-surface-container-high text-on-surface-variant opacity-60 cursor-not-allowed" : "bg-primary text-on-primary hover:bg-primary-container"
            }`}
            onClick={handleMarkServed}
            disabled={displayStatus === "served"}
          >
            {displayStatus === "served" ? `Table ${order.tableNumber} Served` : `Mark Table ${order.tableNumber} as Served`}
          </button>
        </div>
      </main>
    </div>
  );
}