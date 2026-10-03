export default function ProductCard({ product, onAdd }) {
  return (
    <article className="card">
      <div className="card-top">
        <h3>{product.name}</h3>
        <span className="card-size">{product.size}</span>
      </div>

      {/* The note and price come from the PRODUCTS list in App.jsx */}
      <p className="card-note">{product.note}</p>

      <div className="card-bottom">
        <strong>₱{product.price}</strong>
        <button className="btn btn-small" onClick={onAdd}>Add to order</button>
      </div>
    </article>
  );
}
