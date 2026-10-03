export default function Header({ cartCount }) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 bg-deep px-[5vw] py-4 text-white">
      <a href="#top" className="font-display text-xl no-underline">Yulio's CubeIce</a>

      <nav className="flex gap-4 sm:gap-6">
        <a href="#products" className="text-ice no-underline hover:text-white hover:underline">Products</a>
        <a href="#order" className="text-ice no-underline hover:text-white hover:underline">Order ({cartCount})</a>
        <a href="#contact" className="text-ice no-underline hover:text-white hover:underline">Contact</a>
      </nav>
    </header>
  );
}
