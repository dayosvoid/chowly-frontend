import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Clock3, ChevronRight } from "lucide-react";
import { getRestaurants, getOrders } from "../api/client";
import "./WaiterDashboard.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "served", label: "Served" },
];

function toDisplayStatus(status) {
  if (status === "assigned") return "in_progress";
  if (status === "paid") return "served";
  return status;
}

function minutesAgo(dateString) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

export default function WaiterDashboard() {
  const navigate = useNavigate();

  const [restaurantId, setRestaurantId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getRestaurants()
      .then((restaurants) => {
        if (restaurants.length > 0) {
          setRestaurantId(restaurants[0].id || restaurants[0]._id);
        }
      })
      .catch(() => setError("Could not load restaurant."));
  }, []);

  useEffect(() => {
    if (!restaurantId) return;

    const fetchOrders = () => {
      getOrders({ restaurantId })
        .then(setOrders)
        .catch(() => setError("Could not load orders."))
        .finally(() => setLoading(false));
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [restaurantId]);

  const visibleOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return toDisplayStatus(order.status) === filter;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => toDisplayStatus(o.status) === "pending").length,
    in_progress: orders.filter((o) => toDisplayStatus(o.status) === "in_progress").length,
    served: orders.filter((o) => toDisplayStatus(o.status) === "served").length,
  };

  if (loading) {
    return (
      <div className="page waiter-dashboard">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="page waiter-dashboard">
      <div className="staff-bar">
        <div>
          <span className="live-dot" />
          <small>STAFF MODE</small>
        </div>
        <span className="sync">
          <Radio size={14} /> Live
        </span>
      </div>

      <div className="title-row">
        <div>
          <h1>Floor Service Dashboard</h1>
          <p>{orders.length} active order{orders.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {error && <p className="input-error">{error}</p>}

      <div className="filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={filter === key ? "active" : ""}
            onClick={() => setFilter(key)}
          >
            {label} <b>{counts[key]}</b>
          </button>
        ))}
      </div>

      <div className="orders-list">
        {visibleOrders.map((order) => {
          const displayStatus = toDisplayStatus(order.status);
          const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");
          const assignedStaff = order.items
            .flatMap((i) => [i.chef?.fullName, i.bartender?.fullName])
            .filter(Boolean);

          return (
            <article
              className={`order-card ${displayStatus}`}
              key={order.id}
              onClick={() => navigate(`/waiter/orders/${order.id}`)}
            >
              <div className="card-head">
                <div>
                  <h2>
                    Table {order.tableNumber} <small>• #{String(order.id).slice(-6).toUpperCase()}</small>
                  </h2>
                  <p>{order.customerName}</p>
                </div>
                <span className={`status-badge ${displayStatus}`}>
                  {displayStatus === "pending" ? "Pending" : displayStatus === "in_progress" ? "In Progress" : "Served"}
                </span>
              </div>

              <div className="elapsed-row">
                <Clock3 size={14} />
                <span>{minutesAgo(order.orderTime)} min elapsed</span>
                <span className="estimate">Est. {order.estimatedWaitMinutes}m</span>
              </div>

              <div className="items-preview">
                <strong>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</strong>
                <p>{itemsSummary}</p>
              </div>

              {assignedStaff.length > 0 && (
                <div className="assignment-row">
                  <span>Assigned: {assignedStaff.join(", ")}</span>
                </div>
              )}

              {displayStatus === "pending" && (
                <button
                  className="open-order-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/waiter/orders/${order.id}`);
                  }}
                >
                  Open Order <ChevronRight size={16} />
                </button>
              )}
            </article>
          );
        })}
        {visibleOrders.length === 0 && <p>No orders in this view.</p>}
      </div>
    </div>
  );
}