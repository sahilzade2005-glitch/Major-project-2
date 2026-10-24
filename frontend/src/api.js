
const BASE = "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(BASE + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch {
    throw new Error(
      "Cannot connect to backend. Start it with npm start in the backend folder."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  menu: () => request("/menu"),

  orders: () => request("/orders"),

  createOrder: (body) =>
    request("/orders", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  updateOrder: (id, status) =>
    request(`/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
};
