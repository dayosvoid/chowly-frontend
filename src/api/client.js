const API_URL = import.meta.env.VITE_API_URL;

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function getRestaurants() {
  const res = await fetch(`${API_URL}/restaurants`);
  return handleResponse(res);
}

export async function getMenuItems(restaurantId) {
  const res = await fetch(`${API_URL}/restaurants/${restaurantId}/menu-items`);
  return handleResponse(res);
}

export async function getStaff(restaurantId, role) {
  const url = role
    ? `${API_URL}/restaurants/${restaurantId}/staff?role=${role}`
    : `${API_URL}/restaurants/${restaurantId}/staff`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function createOrder({ restaurantId, tableNumber, customerName, kitchenNote, items }) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ restaurantId, tableNumber, customerName, kitchenNote, items }),
  });
  return handleResponse(res);
}

export async function getOrders({ status, restaurantId } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (restaurantId) params.set("restaurantId", restaurantId);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/orders${query}`);
  return handleResponse(res);
}

export async function getOrder(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}`);
  return handleResponse(res);
}

export async function assignWaiter(orderId, waiterId) {
  const res = await fetch(`${API_URL}/orders/${orderId}/assign-waiter`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ waiterId }),
  });
  return handleResponse(res);
}

export async function assignStaffToItem(orderId, itemId, { chefId, bartenderId }) {
  const res = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chefId ? { chefId } : { bartenderId }),
  });
  return handleResponse(res);
}

export async function serveOrder(orderId) {
  const res = await fetch(`${API_URL}/orders/${orderId}/serve`, {
    method: "PATCH",
  });
  return handleResponse(res);
}

export async function submitComplaint(orderId, { description, rating }) {
  const res = await fetch(`${API_URL}/orders/${orderId}/complaint`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description, rating }),
  });
  return handleResponse(res);
}

export async function submitPayment(orderId, method) {
  const res = await fetch(`${API_URL}/orders/${orderId}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method }),
  });
  return handleResponse(res);
}