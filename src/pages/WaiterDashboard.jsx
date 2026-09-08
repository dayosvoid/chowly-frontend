import { useEffect, useState } from "react";
import { getRestaurants, getOrders, updateOrderStatus, getRestaurantStaff, assignStaffToItem } from "../api/client";

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
  if (!dateString) return 0;
  const diffMs = Date.now() - new Date(dateString).getTime();
  return Math.max(0, Math.round(diffMs / 60000));
}

function isBarOnlyOrder(order) {
  const hasChef = order.items.some((item) => item.chef || item.assignedStaff?.role === "chef");
  const hasBartender = order.items.some((item) => item.bartender || item.assignedStaff?.role === "bartender");
  return hasBartender && !hasChef;
}

function assignedStaffNames(order) {
  const names = new Set();
  order.items.forEach((item) => {
    if (item.chef?.fullName) names.add(item.chef.fullName);
    if (item.bartender?.fullName) names.add(item.bartender.fullName);
    if (item.assignedStaff?.fullName) names.add(item.assignedStaff.fullName);
  });
  return Array.from(names);
}

function itemsSummary(order) {
  return order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ");
}

const STATUS_BADGE = {
  pending: { label: "Pending Kitchen", icon: "priority_high", bg: "bg-error-container", text: "text-on-error-container", pulse: true },
  in_progress_kitchen: { label: "In Progress", icon: "skillet", bg: "bg-tertiary-container", text: "text-on-tertiary-container" },
  in_progress_bar: { label: "Bar Prep", icon: "local_bar", bg: "bg-tertiary-fixed", text: "text-on-tertiary-fixed" },
  served: { label: "Served", icon: "check_circle", bg: "bg-secondary-fixed", text: "text-on-secondary-fixed-variant" },
};

export default function WaiterDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [firingOrderId, setFiringOrderId] = useState(null);
  const [markingServedId, setMarkingServedId] = useState(null);
  const [clearedTableOrderIds, setClearedTableOrderIds] = useState(new Set());
  const [staffAssignmentLoading, setStaffAssignmentLoading] = useState({});

  useEffect(() => {
    getRestaurants()
      .then((restaurants) => {
        if (restaurants.length > 0) {
          const rest = restaurants[0];
          setRestaurant(rest);
          const restId = rest.id || rest._id;
          getRestaurantStaff(restId)
            .then((staff) => setStaffList(staff || []))
            .catch(() => {});
        }
      })
      .catch(() => setError("Could not load restaurant."));
  }, []);

  useEffect(() => {
    const restaurantId = restaurant?.id || restaurant?._id;
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
  }, [restaurant]);

  const activeOrders = orders.filter((o) => !clearedTableOrderIds.has(o.id || o._id));
  const visibleOrders = activeOrders.filter((order) => filter === "all" || toDisplayStatus(order.status) === filter);

  const counts = {
    all: activeOrders.length,
    pending: activeOrders.filter((o) => toDisplayStatus(o.status) === "pending").length,
    in_progress: activeOrders.filter((o) => toDisplayStatus(o.status) === "in_progress").length,
    served: activeOrders.filter((o) => toDisplayStatus(o.status) === "served").length,
  };

  const activeTableNumbers = [...new Set(activeOrders.map((o) => o.tableNumber))].sort((a, b) => a - b);
  const tableRangeLabel =
    activeTableNumbers.length > 0
      ? `Table ${activeTableNumbers[0]}${activeTableNumbers.length > 1 ? `-${activeTableNumbers[activeTableNumbers.length - 1]}` : ""}`
      : "No active tables";

  const selectedOrder = activeOrders.find((o) => (o.id || o._id) === selectedOrderId) || null;

  const chefs = staffList.filter((s) => s.role === "chef");
  const bartenders = staffList.filter((s) => s.role === "bartender");

  const handleFireOrder = async (orderId) => {
    setFiringOrderId(orderId);
    try {
      await updateOrderStatus(orderId, "assigned");
      setOrders((current) => current.map((o) => ((o.id || o._id) === orderId ? { ...o, status: "assigned" } : o)));
    } catch {
      setError("Could not fire order to kitchen.");
    } finally {
      setFiringOrderId(null);
    }
  };

  const handleMarkServed = async (orderId) => {
    setMarkingServedId(orderId);
    try {
      await updateOrderStatus(orderId, "paid");
      setOrders((current) => current.map((o) => ((o.id || o._id) === orderId ? { ...o, status: "paid", paidAt: new Date().toISOString() } : o)));
      setSelectedOrderId(null);
    } catch {
      setError("Could not update order status.");
    } finally {
      setMarkingServedId(null);
    }
  };

  const handleAssignItemStaff = async (orderId, itemId, staffId) => {
    const key = `${orderId}-${itemId}`;
    setStaffAssignmentLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const chosenStaff = staffList.find((s) => (s.id || s._id) === staffId);
      const payload = chosenStaff?.role === "bartender" ? { bartenderId: staffId } : { chefId: staffId };
      
      await assignStaffToItem(orderId, itemId, payload);
      
      setOrders((current) =>
        current.map((o) => {
          if ((o.id || o._id) === orderId) {
            return {
              ...o,
              items: o.items.map((i) => {
                const curId = i.id || i._id;
                if (curId === itemId) {
                  return {
                    ...i,
                    assignedStaff: chosenStaff || staffId,
                    chef: chosenStaff?.role === "chef" ? chosenStaff : i.chef,
                    bartender: chosenStaff?.role === "bartender" ? chosenStaff : i.bartender,
                  };
                }
                return i;
              }),
            };
          }
          return o;
        })
      );
    } catch {
      setError("Failed to assign staff member to item.");
    } finally {
      setStaffAssignmentLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleClearTable = (orderId) => {
    setClearedTableOrderIds((current) => new Set(current).add(orderId));
  };

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center relative w-full pt-20 pb-28 bg-surface">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading orders...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface">
      <div className="flex flex-col w-full px-screen-margin-mobile pb-6 gap-gutter-lg">
        <div className="flex flex-col gap-gutter-sm">
          <div className="flex items-center justify-between bg-secondary p-gutter-sm rounded-xl text-on-secondary shadow-sm">
            <div className="flex items-center gap-gutter-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-fixed animate-pulse" />
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary-fixed">Staff Mode</span>
                <span className="font-title-md text-title-md leading-none text-on-secondary">Active Floor • {tableRangeLabel}</span>
              </div>
            </div>
            <div className="flex items-center gap-gutter-xs bg-on-secondary/10 px-gutter-sm py-1 rounded-full">
              <span className="material-symbols-outlined text-[16px] text-secondary-fixed">sensors</span>
              <span className="font-label-sm text-label-sm text-secondary-fixed">Live Sync</span>
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface">Floor Service Dashboard</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {restaurant?.name} • {activeTableNumbers.length} Active Table{activeTableNumbers.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="font-label-md text-label-md px-gutter-sm py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
              {activeOrders.length} Orders
            </span>
          </div>
        </div>

        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

        <div className="flex items-center gap-gutter-xs overflow-x-auto pb-1 no-scrollbar -mx-screen-margin-mobile px-screen-margin-mobile">
          {FILTERS.map(({ key, label }) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                className={`flex items-center gap-1.5 h-10 px-gutter-md rounded-full font-label-md text-label-md transition-all flex-shrink-0 ${
                  isActive ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-high text-on-surface-variant"
                }`}
                onClick={() => setFilter(key)}
              >
                <span>{label}</span>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-white/20" : "bg-surface-container-highest text-on-surface"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-gutter-md">
          {visibleOrders.map((order) => {
            const orderId = order.id || order._id;
            const displayStatus = toDisplayStatus(order.status);
            const barOnly = isBarOnlyOrder(order);
            const badgeKey = displayStatus === "in_progress" ? (barOnly ? "in_progress_bar" : "in_progress_kitchen") : displayStatus;
            const badge = STATUS_BADGE[badgeKey];
            const elapsed = minutesAgo(order.orderTime);
            const progressPct = order.estimatedWaitMinutes ? Math.min(100, Math.round((elapsed / order.estimatedWaitMinutes) * 100)) : 0;
            const staffNames = assignedStaffNames(order);

            return (
              <div
                className={`flex flex-col bg-surface-container-lowest rounded-xl p-gutter-md shadow-[0_2px_12px_rgba(28,26,23,0.06)] cursor-pointer active:scale-[0.99] transition-transform ${
                  displayStatus === "served" ? "opacity-90" : ""
                }`}
                key={orderId}
                onClick={() => setSelectedOrderId(orderId)}
              >
                <div className="flex items-start justify-between gap-gutter-sm pb-gutter-sm">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-gutter-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface">Table {order.tableNumber}</span>
                      <span className="text-outline text-xs">•</span>
                      <span className="font-label-md text-label-md text-on-surface-variant font-semibold">
                        #{String(orderId).slice(-6).toUpperCase()}
                      </span>
                    </div>
                    {order.section && <span className="font-body-sm text-body-sm text-on-surface-variant">{order.section}</span>}
                  </div>
                  <span
                    className={`flex items-center gap-1 px-gutter-sm py-1 rounded-full font-label-sm text-label-sm flex-shrink-0 ${badge.bg} ${badge.text} ${
                      badge.pulse ? "animate-pulse" : ""
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                    {badge.label}
                  </span>
                </div>

                {displayStatus === "pending" ? (
                  <>
                    <div className="flex items-center justify-between bg-error-container/30 px-gutter-sm py-2 rounded-lg mb-gutter-sm">
                      <div className="flex items-center gap-1.5 text-error font-semibold font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        <span>{elapsed} min elapsed (Awaiting Fire)</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-error uppercase font-bold">New Ticket</span>
                    </div>

                    <div className="flex items-center gap-gutter-sm py-1 mb-gutter-sm">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                        {order.items[0]?.imageUrl && (
                          <img className="w-full h-full object-cover" src={order.items[0].imageUrl} alt={order.items[0].name} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-title-md text-title-md text-on-surface truncate">
                          {order.items.length} Item{order.items.length === 1 ? "" : "s"}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{itemsSummary(order)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-gutter-sm pt-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="flex-1 h-12 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-md active:bg-primary-container transition-colors disabled:opacity-70"
                        onClick={() => handleFireOrder(orderId)}
                        disabled={firingOrderId === orderId}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${firingOrderId === orderId ? "animate-spin" : ""}`}>
                          {firingOrderId === orderId ? "refresh" : "local_fire_department"}
                        </span>
                        {firingOrderId === orderId ? "Firing..." : "Assign & Fire"}
                      </button>
                      <button
                        className="w-12 h-12 rounded-xl bg-surface-container-high text-on-surface flex items-center justify-center active:bg-surface-container-highest transition-colors"
                        onClick={() => setSelectedOrderId(orderId)}
                      >
                        <span className="material-symbols-outlined text-[20px]">edit_note</span>
                      </button>
                    </div>
                  </>
                ) : displayStatus === "in_progress" ? (
                  <>
                    <div className="flex flex-col gap-1.5 bg-surface-container-low p-gutter-sm rounded-lg mb-gutter-sm">
                      <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                        <span className={`flex items-center gap-1 font-semibold ${barOnly ? "text-on-surface" : "text-tertiary"}`}>
                          <span className={`material-symbols-outlined text-[16px] ${barOnly ? "text-tertiary" : ""}`}>
                            {barOnly ? "hourglass_bottom" : "timer"}
                          </span>
                          {elapsed} min elapsed
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Est. {order.estimatedWaitMinutes}m</span>
                      </div>
                      <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barOnly ? "bg-tertiary-container" : "bg-tertiary"}`} style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-gutter-sm py-1">
                      <div className="flex items-center gap-gutter-sm min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                          {order.items[0]?.imageUrl && (
                            <img className="w-full h-full object-cover" src={order.items[0].imageUrl} alt={order.items[0].name} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-title-md text-title-md text-on-surface truncate">
                            {order.items.length} Item{order.items.length === 1 ? "" : "s"}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{itemsSummary(order)}</span>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline text-[20px] flex-shrink-0">chevron_right</span>
                    </div>

                    {staffNames.length > 0 && (
                      <div className="flex items-center justify-between pt-gutter-sm mt-gutter-xs bg-surface-container-low/50 -mx-gutter-md -mb-gutter-md px-gutter-md py-2 rounded-b-xl">
                        <div className="flex items-center gap-gutter-xs">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{barOnly ? "sports_bar" : "person_apron"}</span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            Assigned: <strong className="text-on-surface font-semibold">{staffNames.join(" & ")}</strong>
                          </span>
                        </div>
                        {barOnly ? (
                          <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                            Ready for pickup
                          </span>
                        ) : (
                          order.kitchenStation && (
                            <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface">
                              {order.kitchenStation}
                            </span>
                          )
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between bg-surface-container-low px-gutter-sm py-2 rounded-lg mb-gutter-sm">
                      <div className="flex items-center gap-1.5 text-secondary font-semibold font-body-sm text-body-sm">
                        <span className="material-symbols-outlined text-[16px]">task_alt</span>
                        <span>Completed {minutesAgo(order.paidAt)}m ago</span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface">
                        <span className="font-label-sm text-label-sm uppercase font-bold text-secondary">Bill Paid</span>
                        <span className="font-title-md text-title-md font-bold text-on-surface">
                          {"\u20A6"}
                          {(order.amount ?? order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-gutter-sm py-1">
                      <div className="flex items-center gap-gutter-sm min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                          {order.items[0]?.imageUrl && (
                            <img className="w-full h-full object-cover" src={order.items[0].imageUrl} alt={order.items[0].name} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-title-md text-title-md text-on-surface truncate">
                            {order.items.length} Item{order.items.length === 1 ? "" : "s"}
                          </span>
                          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{itemsSummary(order)}</span>
                        </div>
                      </div>
                      <button
                        className="px-gutter-sm py-1 rounded-lg bg-surface-container-highest text-on-surface font-label-sm text-label-sm hover:bg-outline-variant transition-colors flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearTable(orderId);
                        }}
                      >
                        Clear Table
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {visibleOrders.length === 0 && <p className="font-body-md text-body-md text-on-surface-variant">No orders in this view.</p>}
        </div>

        {selectedOrder && (
          <div
            className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-50 transition-opacity flex items-end justify-center"
            onClick={() => setSelectedOrderId(null)}
          >
            <div
              className="w-full max-w-lg bg-surface-container-lowest rounded-t-2xl p-gutter-lg flex flex-col gap-gutter-md max-h-[85vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-1" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                    {STATUS_BADGE[
                      toDisplayStatus(selectedOrder.status) === "in_progress"
                        ? isBarOnlyOrder(selectedOrder)
                          ? "in_progress_bar"
                          : "in_progress_kitchen"
                        : toDisplayStatus(selectedOrder.status)
                    ].label}{" "}
                    Ticket
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Order #{String(selectedOrder.id || selectedOrder._id).slice(-6).toUpperCase()}</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Table {selectedOrder.tableNumber}
                    {selectedOrder.section ? ` • ${selectedOrder.section}` : ""}
                  </p>
                </div>
                <button
                  className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant"
                  onClick={() => setSelectedOrderId(null)}
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="flex flex-col gap-gutter-md py-1">
                <span className="font-label-md text-label-md text-on-surface font-semibold">Ordered Dishes &amp; Staff Assignment</span>
                {selectedOrder.items.map((item) => {
                  const itemId = item.id || item._id;
                  const assignedStaffId =
                    typeof item.assignedStaff === "object" && item.assignedStaff !== null
                      ? item.assignedStaff._id || item.assignedStaff.id
                      : item.assignedStaff || item.chef?._id || item.bartender?._id || "";

                  const itemKey = `${selectedOrder.id || selectedOrder._id}-${itemId}`;
                  const isUpdating = staffAssignmentLoading[itemKey];

                  return (
                    <div className="flex flex-col gap-2 p-gutter-sm bg-surface-container-low rounded-xl" key={itemId}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-gutter-sm">
                          <span className="w-6 h-6 rounded-md bg-primary-fixed text-on-primary-fixed font-bold flex items-center justify-center text-xs">
                            {item.quantity}x
                          </span>
                          <div className="flex flex-col">
                            <span className="font-title-md text-title-md text-on-surface">{item.name}</span>
                            {item.note && <span className="font-body-sm text-body-sm text-on-surface-variant">{item.note}</span>}
                          </div>
                        </div>
                        <span className="font-title-md text-title-md text-on-surface font-semibold">
                          {"\u20A6"}
                          {(item.unitPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-surface-container px-3 py-1.5 rounded-lg gap-2 mt-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm shrink-0">
                          <span className="material-symbols-outlined text-[16px] text-primary">person_check</span>
                          <span>Assigned Staff:</span>
                        </div>
                        <div className="relative flex items-center w-full max-w-[180px]">
                          <select
                            className="bg-surface-container-lowest text-on-surface font-label-sm text-label-sm px-2 py-1 rounded-md border border-outline/20 focus:outline-none focus:border-primary w-full disabled:opacity-60"
                            value={assignedStaffId}
                            disabled={isUpdating}
                            onChange={(e) => handleAssignItemStaff(selectedOrder.id || selectedOrder._id, itemId, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {chefs.length > 0 && (
                              <optgroup label="Chefs">
                                {chefs.map((chef) => (
                                  <option key={chef._id || chef.id} value={chef._id || chef.id}>
                                    {chef.fullName}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {bartenders.length > 0 && (
                              <optgroup label="Bartenders">
                                {bartenders.map((bartender) => (
                                  <option key={bartender._id || bartender.id} value={bartender._id || bartender.id}>
                                    {bartender.fullName}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          {isUpdating && (
                            <span className="absolute right-2 material-symbols-outlined text-[14px] text-primary animate-spin">
                              refresh
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedOrder.kitchenNote && (
                <div className="flex flex-col gap-1 p-gutter-sm bg-surface-container-highest/60 rounded-xl">
                  <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Table Note</span>
                  <p className="font-body-sm text-body-sm text-on-surface">"{selectedOrder.kitchenNote}"</p>
                </div>
              )}

              <div className="flex flex-col gap-gutter-xs pt-2">
                {toDisplayStatus(selectedOrder.status) !== "served" && (
                  <button
                    className="w-full h-12 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
                    onClick={() => handleMarkServed(selectedOrder.id || selectedOrder._id)}
                    disabled={markingServedId === (selectedOrder.id || selectedOrder._id)}
                  >
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                    {markingServedId === (selectedOrder.id || selectedOrder._id) ? "Updating..." : "Notify Table / Mark Delivered"}
                  </button>
                )}
                <button
                  className="w-full h-10 rounded-xl text-on-surface-variant font-label-md text-label-md flex items-center justify-center"
                  onClick={() => setSelectedOrderId(null)}
                >
                  Back to Floor List
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}