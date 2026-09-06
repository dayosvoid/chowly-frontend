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
      const updated = await loadOrder();
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
      <div className="page order-detail">
        <p>Loading order...</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="page order-detail">
        <p className="input-error">{error}</p>
      </div>
    );
  }

  const displayStatus = toDisplayStatus(order.status);
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(order.orderTime).getTime()) / 60000));
  const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="page order-detail">
      <div className="order-head">
        <button aria-label="Back" onClick={() => navigate("/waiter")}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Order #{String(order.id).slice(-6).toUpperCase()}</h1>
          <p>
            <strong>Table {order.tableNumber}</strong> • {order.customerName}
          </p>
        </div>
        <button aria-label="Refresh" onClick={handleRefresh}>
          <RefreshCw size={18} className={refreshing ? "spinning" : ""} />
        </button>
      </div>

      <section className="status-card">
        <div className="status-icon">
          <Flame size={22} />
        </div>
        <div>
          <h2>
            {displayStatus === "pending" ? "Awaiting Assignment" : displayStatus === "in_progress" ? "In Progress" : "Served"}
          </h2>
          <p>Est. wait: {order.estimatedWaitMinutes} min</p>
        </div>
        <div className="elapsed">
          <Clock3 size={14} />
          <strong>{elapsedMinutes}m</strong>
          <small>Elapsed</small>
        </div>
      </section>

      {!order.assignedWaiter && (
        <section className="claim-card">
          <b>Claim this order</b>
          <div className="claim-row">
            <select value={selectedWaiterId} onChange={(e) => setSelectedWaiterId(e.target.value)}>
              <option value="">Select yourself...</option>
              {waiters.map((w) => (
                <option key={w.id || w._id} value={w.id || w._id}>
                  {w.fullName}
                </option>
              ))}
            </select>
            <button onClick={handleClaim} disabled={!selectedWaiterId}>
              Claim
            </button>
          </div>
        </section>
      )}

      {order.assignedWaiter && (
        <section className="claimed-note">
          Assigned waiter: <strong>{order.assignedWaiter.fullName}</strong>
        </section>
      )}

      {order.kitchenNote && (
        <section className="service-note">
          <b>KITCHEN NOTE</b>
          <p>&ldquo;{order.kitchenNote}&rdquo;</p>
        </section>
      )}

      <div className="section-title">
        <h2>Order Items &amp; Stations</h2>
        <small>{order.items.length} ITEMS</small>
      </div>

      <div className="items">
        {order.items.map((item) => {
          const staffOptions = item.type === "food" ? chefs : bartenders;
          const currentStaffId = item.type === "food" ? item.chef?.id : item.bartender?.id;

          return (
            <article className="item-card" key={item.id}>
              <div className="item-top">
                <div className="item-copy">
                  <div className="item-title">
                    <h3>{item.name}</h3>
                    <strong>{"\u20A6"}{(item.unitPrice * item.quantity).toLocaleString()}</strong>
                  </div>
                  <div className="item-meta">
                    <span>Qty: {item.quantity}</span> • {item.type === "food" ? "Kitchen" : "Bar"}
                  </div>
                </div>
              </div>
              <div className="station">
                <div className="station-label">
                  <span>ASSIGN {item.type === "food" ? "CHEF" : "BARTENDER"}</span>
                  {currentStaffId && <b>● Assigned</b>}
                </div>
                <select
                  value={currentStaffId || ""}
                  onChange={(e) => handleAssignItem(item.id, item.type === "food" ? "chef" : "bartender", e.target.value)}
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

      <section className="accounting">
        <div className="accounting-head">
          <h2>Order Total</h2>
        </div>
        <div className="total">
          <strong>{order.items.length} items</strong>
          <b>{"\u20A6"}{total.toLocaleString()}</b>
        </div>
      </section>

      {error && <p className="input-error">{error}</p>}

      <button
        className={`serve ${displayStatus === "served" ? "served" : ""}`}
        onClick={handleMarkServed}
        disabled={displayStatus === "served"}
      >
        {displayStatus === "served" ? `Table ${order.tableNumber} Served` : `Mark Table ${order.tableNumber} as Served`}
      </button>
    </div>
  );
}
