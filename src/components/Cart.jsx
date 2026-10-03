import { useState } from "react";

const panel = "rounded-2xl border border-line bg-white p-6";
const qtyBtn =
  "h-[30px] w-[30px] cursor-pointer rounded-full border border-line bg-frost hover:bg-ice focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep";
const input =
  "rounded-lg border border-line p-2.5 text-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep";

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
      <div className={`${panel} bg-ice`}>
        <p>Thank you for your order!</p>
        <h3 className="font-display text-xl">Order received, {orderPlaced.name}!</h3>
        <p>Thank you! We will call you shortly to confirm your order.</p>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-8 md:grid-cols-[1.3fr_1fr]">
      <div className={panel}>
        {items.length === 0 && (
          <p className="text-steel">Your order is empty. Pick some items to add to your cart.</p>
        )}

        {items.map((p) => (
          <div className="grid grid-cols-[1fr_auto_70px] items-center gap-4 border-b border-line py-3" key={p.id}>
            <div>
              <strong>{p.name}</strong>
              <span className="text-sm text-steel"> {p.size}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <button className={qtyBtn} onClick={() => onRemove(p.id)} aria-label={`Remove one ${p.name}`}>−</button>
              <span>{cart[p.id]}</span>
              <button className={qtyBtn} onClick={() => onAdd(p.id)} aria-label={`Add one ${p.name}`}>+</button>
            </div>
            <span className="text-right">₱{p.price * cart[p.id]}</span>
          </div>
        ))}

        <div className="flex justify-between pt-4 text-xl">
          <span>Total</span>
          <strong>₱{total}</strong>
        </div>
      </div>

      <form className={`${panel} flex flex-col gap-3.5`} onSubmit={handleSubmit}>
        <h3 className="font-display text-xl">Delivery details</h3>

        <label className="flex flex-col gap-1 text-sm text-steel">Name
          <input className={input} name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-steel">Phone number
          <input className={input} name="phone" value={form.phone} onChange={handleChange} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-steel">Delivery address
          <input className={input} name="address" value={form.address} onChange={handleChange} required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-steel">Preferred delivery time
          <input className={input} type="time" name="time" value={form.time} onChange={handleChange} required />
        </label>

        <button
          className="cursor-pointer rounded-lg bg-aqua px-5 py-3 font-bold text-deep hover:bg-aqua-dark hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-steel"
          type="submit"
          disabled={items.length === 0}
        >
          Place order
        </button>
      </form>
    </div>
  );
}
