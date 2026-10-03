import { useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import ProductCard from "./components/ProductCard.jsx";
import Cart from "./components/Cart.jsx";
import Footer from "./components/Footer.jsx";

const PRODUCTS = [
  { id: 1, name: "Cube Ice", size: "1 kg", price: 30, note: "Perfect for a few drinks." },
  { id: 2, name: "Cube Ice", size: "3 kg", price: 80, note: "Good for small gatherings." },
  { id: 3, name: "Cube Ice", size: "5 kg", price: 120, note: "Great for get-together parties and coolers." },
  { id: 4, name: "Cube Ice", size: "10 kg", price: 220, note: "Best for resellers and bulk orders." },
];

export default function App() {
  const [cart, setCart] = useState({});
  const [orderPlaced, setOrderPlaced] = useState(null);

  const addToCart = (id) =>
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));

  const removeFromCart = (id) =>
    setCart((c) => {
      const next = { ...c };
      if (next[id] > 1) next[id] -= 1;
      else delete next[id];
      return next;
    });

  const placeOrder = (customer) => {
    setOrderPlaced(customer);
    setCart({});
  };

  return (
    <div>
      <Header cartCount={Object.values(cart).reduce((a, b) => a + b, 0)} />

      <main>
        <Hero />

        <section id="products" className="mx-auto max-w-[1100px] px-[5vw] py-14">
          <h2 className="mb-1.5 font-display text-3xl leading-tight">Here are our products:</h2>
          <p className="mb-6 text-steel">Don't let warm drinks steal the fun!</p>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5">
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => addToCart(p.id)} />
            ))}
          </div>
        </section>

        <section id="order" className="mx-auto max-w-[1100px] px-[5vw] py-14">
          <h2 className="mb-1.5 font-display text-3xl leading-tight">Your order</h2>
          <Cart
            products={PRODUCTS}
            cart={cart}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onPlaceOrder={placeOrder}
            orderPlaced={orderPlaced}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
