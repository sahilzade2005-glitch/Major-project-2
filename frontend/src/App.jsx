
import React, { useEffect, useState } from "react";
import { api } from "./api";
import "./style.css";

const stages = [
  "Order Placed",
  "Preparing",
  "Picked Up",
  "On the Way",
  "Delivered"
];

const money = (amount) => `₹${amount.toLocaleString("en-IN")}`;

export default function App() {
  const [page, setPage] = useState("Dashboard");
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [customer, setCustomer] = useState({
    customer: "",
    phone: "",
    address: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadData() {
    try {
      const [menuData, orderData] = await Promise.all([
        api.menu(),
        api.orders()
      ]);
      setFoods(menuData);
      setOrders(orderData);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 5000);
    return () => clearInterval(timer);
  }, []);

  const categories = ["All", ...new Set(foods.map(f => f.category))];

  const filteredFoods = foods.filter(food => {
    const matchesCategory =
      category === "All" || food.category === category;

    const matchesSearch =
      food.name.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const cartItems = foods
    .filter(food => cart[food.id] > 0)
    .map(food => ({ ...food, quantity: cart[food.id] }));

  const cartCount = cartItems.reduce(
    (sum, food) => sum + food.quantity, 0
  );

  const subtotal = cartItems.reduce(
    (sum, food) => sum + food.price * food.quantity, 0
  );

  const deliveryFee = subtotal >= 499 || subtotal === 0 ? 0 : 39;
  const total = subtotal + deliveryFee;

  const activeOrder =
    orders.find(order => order.id === selectedOrder) || orders[0];

  function changeQuantity(id, amount) {
    setCart(previous => {
      const updated = { ...previous };
      updated[id] = Math.max(0, (updated[id] || 0) + amount);
      if (updated[id] === 0) delete updated[id];
      return updated;
    });
  }

  async function placeOrder(event) {
    event.preventDefault();
    if (!cartItems.length) return;

    setBusy(true);

    try {
      const order = await api.createOrder({
        ...customer,
        items: cartItems.map(food => ({
          id: food.id,
          quantity: food.quantity
        }))
      });

      setCart({});
      setCheckout(false);
      setSelectedOrder(order.id);
      setPage("Track Order");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.updateOrder(id, status);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  function FoodCard({ food }) {
    return (
      <div className="food-card">
        <div className="food-image" style={{ background: food.color }}>
          <span>{food.emoji}</span>
          <div className="food-badge">{food.tag}</div>
        </div>

        <div className="food-details">
          <div className="food-info">
            <span>{food.category}</span>
            <span>⭐ {food.rating}</span>
          </div>

          <h3>{food.name}</h3>
          <p>{food.description}</p>

          <div className="food-footer">
            <div>
              <strong>{money(food.price)}</strong>
              <small>⏱ {food.time}</small>
            </div>

            <button
              className="add-button"
              onClick={() => changeQuantity(food.id, 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">🍔 food<span>track</span></div>
        <p className="sidebar-label">MAIN MENU</p>

        {[
          ["🏠", "Dashboard"],
          ["🍽️", "Explore Menu"],
          ["🛒", "My Cart"],
          ["🛵", "Track Order"],
          ["📦", "Order History"],
          ["⚙️", "Admin Panel"]
        ].map(([icon, name]) => (
          <button
            key={name}
            className={`nav-item ${page === name ? "active" : ""}`}
            onClick={() => setPage(name)}
          >
            <span>{icon}</span>
            {name}
            {name === "My Cart" && cartCount > 0 && (
              <b className="cart-count">{cartCount}</b>
            )}
          </button>
        ))}

        <div className="sidebar-offer">
          <div>🍟</div>
          <h3>Feeling hungry?</h3>
          <p>Delicious food is just one click away.</p>
          <button onClick={() => setPage("Explore Menu")}>
            Order Now →
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Pages / <b>{page}</b></span>
          <div className="profile">
            <span>📍 Nagpur, India</span>
            <div className="avatar">FT</div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="error">
              {error}
              <button onClick={loadData}>Retry</button>
            </div>
          )}

          {page === "Dashboard" && (
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">YOUR FOOD, YOUR WAY</span>
                  <h1>Good food. <em>Great mood.</em> ✨</h1>
                  <p>
                    Discover amazing flavors delivered right to your doorstep.
                  </p>
                </div>
              </div>

              <div className="hero">
                <div className="hero-content">
                  <span className="hero-label">🔥 TODAY'S SPECIAL</span>
                  <h2>Cravings calling?<br />We've got you.</h2>
                  <p>
                    Explore irresistible meals, freshly prepared and
                    delivered with love.
                  </p>
                  <button onClick={() => setPage("Explore Menu")}>
                    Explore Menu →
                  </button>
                </div>
                <div className="hero-art">🍔</div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>🛍️</span>
                  <div>
                    <p>Total Orders</p>
                    <h2>{orders.length}</h2>
                  </div>
                </div>
                <div className="stat-card">
                  <span>🛵</span>
                  <div>
                    <p>In Progress</p>
                    <h2>
                      {orders.filter(o => o.status !== "Delivered").length}
                    </h2>
                  </div>
                </div>
                <div className="stat-card">
                  <span>✅</span>
                  <div>
                    <p>Delivered</p>
                    <h2>
                      {orders.filter(o => o.status === "Delivered").length}
                    </h2>
                  </div>
                </div>
                <div className="stat-card">
                  <span>🍕</span>
                  <div>
                    <p>Menu Items</p>
                    <h2>{foods.length}</h2>
                  </div>
                </div>
              </div>

              <div className="section-heading">
                <h2>Popular Right Now 🔥</h2>
                <button onClick={() => setPage("Explore Menu")}>
                  View All →
                </button>
              </div>

              <div className="food-grid">
                {foods.slice(0, 4).map(food => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>
            </>
          )}

          {page === "Explore Menu" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">DISCOVER DELICIOUSNESS</span>
                <h1>Explore Our Menu 🍽️</h1>
                <p>Fresh food, amazing flavors and happy moments.</p>
              </div>

              <div className="search-bar">
                <span>🔍</span>
                <input
                  placeholder="Search your favorite food..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="categories">
                {categories.map(item => (
                  <button
                    key={item}
                    className={category === item ? "selected" : ""}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="food-grid">
                {filteredFoods.map(food => (
                  <FoodCard key={food.id} food={food} />
                ))}
              </div>

              {filteredFoods.length === 0 && (
                <div className="empty-state">No matching dishes found.</div>
              )}
            </>
          )}

          {page === "My Cart" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">READY TO ORDER?</span>
                <h1>Your Happy Basket 🛒</h1>
                <p>Review your delicious selections.</p>
              </div>

              {cartItems.length === 0 ? (
                <div className="empty-state">
                  <div>🛒</div>
                  <h2>Your cart is empty</h2>
                  <p>Let's add something delicious!</p>
                  <button onClick={() => setPage("Explore Menu")}>
                    Browse Menu
                  </button>
                </div>
              ) : (
                <div className="cart-layout">
                  <div className="panel">
                    <h2>Your Items ({cartCount})</h2>

                    {cartItems.map(food => (
                      <div className="cart-row" key={food.id}>
                        <div
                          className="cart-emoji"
                          style={{ background: food.color }}
                        >
                          {food.emoji}
                        </div>

                        <div className="cart-description">
                          <h3>{food.name}</h3>
                          <p>{food.category}</p>
                          <strong>{money(food.price)}</strong>
                        </div>

                        <div className="quantity">
                          <button onClick={() => changeQuantity(food.id, -1)}>
                            −
                          </button>
                          <span>{food.quantity}</span>
                          <button onClick={() => changeQuantity(food.id, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="panel summary">
                    <h2>Order Summary</h2>
                    <div><span>Subtotal</span><b>{money(subtotal)}</b></div>
                    <div>
                      <span>Delivery Fee</span>
                      <b>{deliveryFee ? money(deliveryFee) : "FREE"}</b>
                    </div>
                    <div className="total">
                      <span>Total</span><b>{money(total)}</b>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => setCheckout(true)}
                    >
                      Proceed to Checkout →
                    </button>
                    <small>Cash on Delivery — Demo</small>
                  </div>
                </div>
              )}
            </>
          )}

          {page === "Track Order" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">LIVE DELIVERY UPDATES</span>
                <h1>Track Your Order 🛵</h1>
                <p>Follow your food's journey from kitchen to doorstep.</p>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state">
                  <div>📦</div>
                  <h2>No orders yet</h2>
                  <button onClick={() => setPage("Explore Menu")}>
                    Order Food
                  </button>
                </div>
              ) : (
                <>
                  <div className="order-selector">
                    <label>Select Order: </label>
                    <select
                      value={activeOrder?.id || ""}
                      onChange={e => setSelectedOrder(e.target.value)}
                    >
                      {orders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.id} — {order.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="tracking-layout">
                    <div className="panel tracking-panel">
                      <div className="tracking-visual">🛵</div>
                      <h2>
                        {activeOrder.status === "Delivered"
                          ? "Delivered Successfully!"
                          : "Your food is on its way!"}
                      </h2>
                      <p>Order #{activeOrder.id}</p>

                      <div className="tracking-steps">
                        {stages.map((stage, index) => {
                          const completed =
                            index <= stages.indexOf(activeOrder.status);

                          return (
                            <div
                              key={stage}
                              className={`tracking-step ${
                                completed ? "completed" : ""
                              }`}
                            >
                              <span>{completed ? "✓" : "○"}</span>
                              <div>
                                <strong>{stage}</strong>
                                <small>
                                  {index === stages.indexOf(activeOrder.status)
                                    ? "Current status"
                                    : completed
                                      ? "Completed"
                                      : "Upcoming"}
                                </small>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <p className="update-note">
                        Status refreshes automatically every 5 seconds.
                      </p>
                    </div>

                    <div className="panel delivery-details">
                      <h2>Delivery Details</h2>
                      <p>📍 {activeOrder.address}</p>
                      <p>👤 {activeOrder.customer}</p>
                      <p>📞 {activeOrder.phone}</p>
                      <p>💵 Cash on Delivery (Demo)</p>
                      <hr />
                      <h3>Order Items</h3>
                      {activeOrder.items.map((food, index) => (
                        <p key={index}>
                          {food.emoji} {food.name} × {food.quantity}
                        </p>
                      ))}
                      <h2>Total: {money(activeOrder.total)}</h2>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {page === "Order History" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">YOUR FOOD JOURNEY</span>
                <h1>Order History 📦</h1>
                <p>All your orders in one place.</p>
              </div>

              {orders.length === 0 ? (
                <div className="empty-state">No orders placed yet.</div>
              ) : (
                <div className="order-list">
                  {orders.map(order => (
                    <div className="order-card" key={order.id}>
                      <div className="order-symbol">🍽️</div>
                      <div className="order-description">
                        <h3>{order.id}</h3>
                        <p>
                          {order.items.map(food => food.name).join(", ")}
                        </p>
                        <small>
                          {new Date(order.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <div className="order-end">
                        <strong>{money(order.total)}</strong>
                        <span className="status-badge">{order.status}</span>
                        <button onClick={() => {
                          setSelectedOrder(order.id);
                          setPage("Track Order");
                        }}>
                          Track →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {page === "Admin Panel" && (
            <>
              <div className="page-heading">
                <span className="eyebrow">OPERATIONS CENTER</span>
                <h1>Admin Dashboard 📊</h1>
                <p>Manage customer orders and delivery statuses.</p>
              </div>

              <div className="admin-warning">
                Educational demo only — this admin panel has no login protection.
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>📦</span>
                  <div><p>Total Orders</p><h2>{orders.length}</h2></div>
                </div>
                <div className="stat-card">
                  <span>🛵</span>
                  <div>
                    <p>Active Orders</p>
                    <h2>
                      {orders.filter(o => o.status !== "Delivered").length}
                    </h2>
                  </div>
                </div>
                <div className="stat-card">
                  <span>✅</span>
                  <div>
                    <p>Completed</p>
                    <h2>
                      {orders.filter(o => o.status === "Delivered").length}
                    </h2>
                  </div>
                </div>
                <div className="stat-card">
                  <span>💰</span>
                  <div>
                    <p>Total Order Value</p>
                    <h2>{money(orders.reduce((s, o) => s + o.total, 0))}</h2>
                  </div>
                </div>
              </div>

              <div className="panel admin-table">
                <h2>Manage Deliveries</h2>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Update Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.id}</td>
                          <td>{order.customer}</td>
                          <td>{money(order.total)}</td>
                          <td>
                            <span className="status-badge">
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={e =>
                                updateStatus(order.id, e.target.value)
                              }
                            >
                              {stages.map(stage => (
                                <option key={stage} value={stage}>
                                  {stage}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {orders.length === 0 && (
                    <p>No orders to manage yet.</p>
                  )}
                </div>
              </div>
            </>
          )}

          <footer>
            FoodTrack © 2026 | Real-Time Food Delivery Tracking System
          </footer>
        </div>
      </main>

      {checkout && (
        <div className="modal-overlay">
          <div className="checkout-modal">
            <div className="modal-header">
              <h2>Complete Your Order</h2>
              <button onClick={() => setCheckout(false)}>✕</button>
            </div>

            <p>Enter your delivery details.</p>

            <form onSubmit={placeOrder}>
              <label>Full Name</label>
              <input
                required
                maxLength={80}
                placeholder="Enter your name"
                value={customer.customer}
                onChange={e => setCustomer({
                  ...customer,
                  customer: e.target.value
                })}
              />

              <label>Phone Number</label>
              <input
                required
                minLength={7}
                maxLength={18}
                placeholder="Enter phone number"
                value={customer.phone}
                onChange={e => setCustomer({
                  ...customer,
                  phone: e.target.value
                })}
              />

              <label>Delivery Address</label>
              <textarea
                required
                maxLength={240}
                placeholder="Enter delivery address"
                value={customer.address}
                onChange={e => setCustomer({
                  ...customer,
                  address: e.target.value
                })}
              />

              <h3>Total: {money(total)}</h3>

              <button
                className="primary-button"
                type="submit"
                disabled={busy}
              >
                {busy ? "Placing Order..." : "Place Order →"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
