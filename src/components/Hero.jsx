export default function Hero() {
  return (
    <section
      id="top"
      className="grid items-center gap-8 bg-linear-to-br from-ice to-frost to-70% px-[5vw] py-16 md:grid-cols-[1.6fr_1fr]"
    >
      <div>
        <h1 className="font-display text-[clamp(2.2rem,6vw,3.8rem)] leading-[1.15]">
          Your trusted provider of high-quality Cube Ice!
        </h1>

        <p className="mt-4 mb-6 max-w-[52ch] text-steel">
          We accept reseller and bulk order. We deliver straight right to your door
        </p>

        <a
          href="#products"
          className="inline-block cursor-pointer rounded-lg bg-aqua px-5 py-3 font-bold text-deep no-underline hover:bg-aqua-dark hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep"
        >
          Order Now
        </a>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="mb-1 font-bold">Delivery hours</p>
        <p>Monday - Saturday, 10:00 AM to 8:00 PM</p>
      </div>
    </section>
  );
}
