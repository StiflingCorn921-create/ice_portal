import { useState } from "react";

export default function Cart({ products, cart, onAdd, onRemove, onPlaceOrder, orderPlaced }) {
  const [form, setForm] = useState({ name: "", phone: "", address: "", time: "" });

  const items = products.filter((p) => cart[p.id]);
  const total = items.reduce((sum, p) => sum + p.price * cart[p.id], 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    onPlaceOrder(form);
    setForm({ name: "", phone: "", address: "", time: "" });
  };

  if (orderPlaced && items.length === 0) {
    return (
      <div className="confirmation">
        <p>Thank you for your order!</p>
        <h3>Order received, {orderPlaced.name}!</h3>
        <p>Thank you! We will call you shortly to confirm your order.</p>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart-list">
        {items.length === 0 && (
          <p className="empty">Your order is empty. pick some items to add to your cart.</p>
        )}

        {items.map((p) => (
          <div className="cart-row" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <span className="card-size"> {p.size}</span>
            </div>
            <div className="qty">
              <button onClick={() => onRemove(p.id)} aria-label={`Remove one ${p.name}`}>−</button>
              <span>{cart[p.id]}</span>
              <button onClick={() => onAdd(p.id)} aria-label={`Add one ${p.name}`}>+</button>
            </div>
            <span className="line-total">₱{p.price * cart[p.id]}</span>
          </div>
        ))}

        <div className="cart-total">
          <span>Total</span>
          <strong>₱{total}</strong>
        </div>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <h3>Delivery details</h3>

        <label>Name
          <input name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>Phone number
          <input name="phone" value={form.phone} onChange={handleChange} required />
        </label>
        <label>Delivery address
          <input name="address" value={form.address} onChange={handleChange} required />
        </label>
        <label>Preferred delivery time
          <input type="time" name="time" value={form.time} onChange={handleChange} required />
        </label>

        <button className="btn" type="submit" disabled={items.length === 0}>
          Place order
        </button>
      </form>
    </div>
  );
}
