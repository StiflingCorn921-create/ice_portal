export default function Header({ cartCount }) {
  return (
    <header className="header">
      <a href="#top" className="logo">Yulio's CubeIce</a>

      <nav className="nav">
        <a href="#products">Products</a>
        <a href="#order">Order ({cartCount})</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  );
}
