import { useState } from "react";

const input =
  "rounded-lg border border-line p-2.5 text-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true); // kon way server, mopakita rag thank-you message
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section id="message" className="mx-auto max-w-[1100px] px-[5vw] py-14">
      <h2 className="mb-1.5 font-display text-3xl leading-tight">For any inquiries or feedback, please feel free to contact us:</h2>
      <p className="mb-6 text-steel">We reply as soon as possible.</p>

      {sent ? (
        <div className="max-w-xl rounded-2xl border border-line bg-ice p-6">
          <h3 className="font-display text-xl">Message sent!</h3>
          <p>Thank you for your continued interest</p>
          <button
            className="mt-4 cursor-pointer font-bold underline"
            onClick={() => setSent(false)}
          >
            Send another message
          </button>
        </div>
      ) : (
        <form
          className="flex max-w-xl flex-col gap-3.5 rounded-2xl border border-line bg-white p-6"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-1 text-sm text-steel">Name
            <input className={input} name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-steel">Email
            <input className={input} type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-steel">Message
            <textarea className={`${input} min-h-32`} name="message" value={form.message} onChange={handleChange} required />
          </label>
          <button
            className="cursor-pointer rounded-lg bg-aqua px-5 py-3 font-bold text-deep hover:bg-aqua-dark hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep"
            type="submit"
          >
            Send message
          </button>
        </form>
      )}
    </section>
  );
}
