export default function ProductCard({ product, onAdd }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-xl leading-tight">{product.name}</h3>
        <span className="text-sm text-steel">{product.size}</span>
      </div>

      {/* The note and price come from the PRODUCTS list in App.jsx */}
      <p className="flex-1 text-steel">{product.note}</p>

      <div className="flex items-center justify-between">
        <strong>₱{product.price}</strong>
        <button
          className="cursor-pointer rounded-lg bg-aqua px-4 py-2 font-bold text-deep hover:bg-aqua-dark hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep"
          onClick={onAdd}
        >
          Add to order
        </button>
      </div>
    </article>
  );
}
