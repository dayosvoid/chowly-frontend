import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BellRing, Check, ChefHat, Martini, ReceiptText, Sparkles, UtensilsCrossed } from "lucide-react";
import { getOrder } from "../api/client";
import "./OrderStatus.css";

const STATUS_STEPS = ["pending", "in_progress", "served"];

function toDisplayStatus(status) {
  if (status === "assigned") return "in_progress";
  if (status === "paid") return "served";
  return status;
}

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4000);
  };

  if (loading) {
    return (
      <div className="page order-status">
        <p>Loading order status...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page order-status">
        <p className="input-error">{error || "Order not found."}</p>
      </div>
    );
  }

  const displayStatus = toDisplayStatus(order.status);
  const stepIndex = STATUS_STEPS.indexOf(displayStatus);
  const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // dedupe staff who worked on this order
  const staffMap = new Map();
  order.items.forEach((item) => {
    if (item.chef) {
      const key = `chef-${item.chef.id}`;
      if (!staffMap.has(key)) {
        staffMap.set(key, { name: item.chef.fullName, role: "chef", items: [] });
      }
      staffMap.get(key).items.push(item.name);
    }
    if (item.bartender) {
      const key = `bartender-${item.bartender.id}`;
      if (!staffMap.has(key)) {
        staffMap.set(key, { name: item.bartender.fullName, role: "bartender", items: [] });
      }
      staffMap.get(key).items.push(item.name);
    }
  });
  const staffList = Array.from(staffMap.values());

  return (
    <div className="page order-status">
      <section className="order-card card">
        <div className="order-heading">
          <div>
            <span className="eyebrow">Order Tracker</span>
            <h1>Order #{String(order.id).slice(-6).toUpperCase()}</h1>
            <p>{order.restaurantName} • Table {order.tableNumber}</p>
          </div>
          <div className="arrival">
            <span>Est. wait</span>
            <strong>~{order.estimatedWaitMinutes} min</strong>
          </div>
        </div>
      </section>

      <section className="milestone-card card">
        <div className="section-heading">
          <strong>Status Milestones</strong>
        </div>
        <div className="timeline">
          <div className="timeline-line" />
          <div
            className="timeline-line-complete"
            style={{ height: `${stepIndex === 0 ? 0 : stepIndex === 1 ? 50 : 100}%` }}
          />
          {STATUS_STEPS.map((step, i) => {
            const label = step === "pending" ? "Pending" : step === "in_progress" ? "In Progress" : "Served";
            const state = i < stepIndex ? "completed" : i === stepIndex ? "current" : "upcoming";
            return (
              <div className={`timeline-item ${state}`} key={step}>
                <span className="timeline-icon">
                  {state === "completed" ? (
                    <Check size={18} />
                  ) : state === "current" ? (
                    <Sparkles size={17} />
                  ) : (
                    <UtensilsCrossed size={17} />
                  )}
                </span>
                <div>
                  <div className="timeline-title">
                    <span>{i + 1}. {label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {staffList.length > 0 && (
        <section className="crafted-section">
          <div className="section-heading crafted-heading">
            <h2>Crafted By</h2>
          </div>
          <div className="staff-list">
            {staffList.map((person) => (
              <article className="staff-card" key={person.name + person.role}>
                <span className="staff-icon">
                  {person.role === "chef" ? <ChefHat size={20} /> : <Martini size={20} />}
                </span>
                <div className="staff-copy">
                  <span className="staff-name">{person.name}</span>
                  <span className="staff-order">{person.items.join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {order.kitchenNote && (
        <section className="vibe-card">
          <div>
            <h3>Kitchen note</h3>
            <p>{order.kitchenNote}</p>
          </div>
        </section>
      )}

      <section className="actions">
        <div className="action-grid">
          <button className="secondary-action" onClick={() => notifyStaff("A server has been notified.")}>
            <BellRing size={20} /> Call Waiter
          </button>
          <button className="secondary-action" onClick={() => navigate(`/orders/${orderId}/payment`)}>
            <ReceiptText size={20} /> View Bill ({"\u20A6"}{total.toLocaleString()})
          </button>
        </div>
      </section>

      {notice && (
        <div className="toast visible" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}