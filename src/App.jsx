import { useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import ProductCard from "./components/ProductCard.jsx";
import Cart from "./components/Cart.jsx";
import Footer from "./components/Footer.jsx";

// "id" must be unique for each product.
const PRODUCTS = [
  { id: 1, name: "Cube Ice", size: "1 kg", price: 30, note: "Perfect for a few drinks." },
  { id: 2, name: "Cube Ice", size: "3 kg", price: 80, note: "Good for small gatherings." },
  { id: 3, name: "Cube Ice", size: "5 kg", price: 120, note: "Great for get-together parties and coolers." },
  { id: 4, name: "Cube Ice", size: "10 kg", price: 220, note: "Best for resellers and bulk orders." },
];

export default function App() {
  // cart looks like { 1: 2, 3: 1 } meaning 2 of product 1 and 1 of product 3
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
    <div className="app">
      <Header cartCount={Object.values(cart).reduce((a, b) => a + b, 0)} />

      <main>
        <Hero />

        <section id="products" className="section">
          <h2>Here are our products:</h2>
          <p className="section-sub">Don’t let warm drinks steal the fun!</p>

          <div className="product-grid">
            {PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={() => addToCart(p.id)} />
            ))}
          </div>
        </section>

        <section id="order" className="section">
          <h2>Your order</h2>
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
