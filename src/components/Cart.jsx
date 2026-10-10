import { useState, useMemo } from "react";
import {
  buildOrder,
  DELIVERY_TIER,
  PAYMENT_METHOD,
  FULFILLMENT_RULES,
} from "../models/index.js";

const panel = "rounded-2xl border border-line bg-white p-6";
const qtyBtn =
  "h-[30px] w-[30px] cursor-pointer rounded-full border border-line bg-frost hover:bg-ice focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep";
const input =
  "rounded-lg border border-line p-2.5 text-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep";

export default function Cart({
  products,
  cart,
  onAdd,
  onRemove,
  onPlaceOrder,
  orderPlaced,
}) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    time: "10:00",
    deliveryTier: DELIVERY_TIER.STANDARD,
    paymentMethod: PAYMENT_METHOD.COD,
    tenderedAmount: "",
    referenceNumber: "",
    notes: "",
  });

  const [validationError, setValidationError] = useState(null);

  // Live domain order model instance connected via business rules
  const currentOrder = useMemo(() => {
    return buildOrder({
      products,
      cart,
      customer: {
        name: form.name,
        phone: form.phone,
        address: form.address,
      },
      preferredTime: form.time,
      deliveryTier: form.deliveryTier,
      paymentMethod: form.paymentMethod,
      tenderedAmount: parseFloat(form.tenderedAmount) || 0,
      referenceNumber: form.referenceNumber,
      notes: form.notes,
    });
  }, [products, cart, form]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    try {
      // Execute domain model validation & placement logic
      currentOrder.placeOrder();
      setValidationError(null);
      onPlaceOrder(currentOrder.toJSON());
      setForm({
        name: "",
        phone: "",
        address: "",
        time: "10:00",
        deliveryTier: DELIVERY_TIER.STANDARD,
        paymentMethod: PAYMENT_METHOD.COD,
        tenderedAmount: "",
        referenceNumber: "",
        notes: "",
      });
    } catch (err) {
      setValidationError(err.message || "Failed to validate order.");
    }
  };

  // Receipt view when order is successfully placed
  if (orderPlaced && currentOrder.items.length === 0) {
    const receiptOrder = orderPlaced;
    const isCod = receiptOrder.payment?.paymentMethod === PAYMENT_METHOD.COD;

    return (
      <div className={`${panel} bg-ice border-aqua`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-steel">
              Order Confirmed
            </span>
            <h3 className="font-display text-2xl text-deep">
              Order #{receiptOrder.orderId}
            </h3>
          </div>
          <span className="rounded-full bg-deep px-3 py-1 text-xs font-semibold text-white">
            Status: {receiptOrder.status}
          </span>
        </div>

        <p className="mt-3 text-deep">
          Thank you, <strong>{receiptOrder.customer?.name}</strong>! We have received your order and are preparing your ice.
        </p>

        {/* Fulfillment & Cold Chain summary */}
        <div className="my-4 grid gap-3 rounded-xl bg-white/80 p-4 text-sm sm:grid-cols-2">
          <div>
            <span className="font-bold text-steel">Delivery Window:</span>
            <p className="text-deep font-semibold">{receiptOrder.fulfillment?.preferredTime || "ASAP"}</p>
            <span className="mt-2 block font-bold text-steel">Destination:</span>
            <p className="text-deep">{receiptOrder.customer?.address}</p>
          </div>
          <div>
            <span className="font-bold text-steel">Handling & Cold-Chain:</span>
            <p className="text-deep">
              {receiptOrder.fulfillment?.coolerBagRequired ? (
                <span className="inline-flex items-center gap-1 font-bold text-aqua-dark">
                  ❄️ Insulated Cooler Bag Assigned ({receiptOrder.totalWeightKg} kg)
                </span>
              ) : (
                <span>Standard Ice Pack ({receiptOrder.totalWeightKg} kg)</span>
              )}
            </p>
            <span className="mt-2 block font-bold text-steel">Payment Method:</span>
            <p className="text-deep">
              {receiptOrder.payment?.paymentMethod}{" "}
              {isCod && receiptOrder.payment?.tenderedAmount > 0
                ? `(Tendered: ₱${receiptOrder.payment?.tenderedAmount} | Change: ₱${receiptOrder.payment?.changeDue})`
                : ""}
            </p>
          </div>
        </div>

        {/* Financial reconciliation */}
        <div className="rounded-xl bg-white p-4 text-sm">
          <div className="flex justify-between py-1 text-steel">
            <span>Subtotal</span>
            <span>₱{receiptOrder.subtotal}</span>
          </div>
          {receiptOrder.discount > 0 && (
            <div className="flex justify-between py-1 text-emerald-600 font-semibold">
              <span>Bulk Reseller Discount (5%)</span>
              <span>-₱{receiptOrder.discount}</span>
            </div>
          )}
          <div className="flex justify-between py-1 text-steel">
            <span>Delivery Fee ({receiptOrder.fulfillment?.deliveryTier})</span>
            <span>₱{receiptOrder.fulfillment?.deliveryFee}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 text-base font-bold text-deep">
            <span>Grand Total</span>
            <span>₱{receiptOrder.grandTotal}</span>
          </div>
        </div>
      </div>
    );
  }

  const hasItems = currentOrder.items.length > 0;

  return (
    <div className="grid items-start gap-8 md:grid-cols-[1.2fr_1fr]">
      {/* Items & Live Business Model Calculations */}
      <div className={panel}>
        {!hasItems && (
          <p className="text-steel">
            Your order is empty. Pick some items to add to your cart.
          </p>
        )}

        {products.map((p) => {
          const qty = cart[p.id] || 0;
          if (qty === 0) return null;
          return (
            <div
              className="grid grid-cols-[1fr_auto_70px] items-center gap-4 border-b border-line py-3"
              key={p.id}
            >
              <div>
                <strong>{p.name}</strong>
                <span className="text-sm text-steel"> ({p.size})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  className={qtyBtn}
                  onClick={() => onRemove(p.id)}
                  aria-label={`Remove one ${p.name}`}
                  type="button"
                >
                  −
                </button>
                <span className="font-semibold">{qty}</span>
                <button
                  className={qtyBtn}
                  onClick={() => onAdd(p.id)}
                  aria-label={`Add one ${p.name}`}
                  type="button"
                >
                  +
                </button>
              </div>
              <span className="text-right font-semibold">₱{p.price * qty}</span>
            </div>
          );
        })}

        {hasItems && (
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
            {/* Weight & Cold-chain Status */}
            <div className="flex items-center justify-between text-steel">
              <span>Total Ice Weight:</span>
              <span className="font-medium text-deep">
                {currentOrder.totalWeightKg} kg
              </span>
            </div>

            {currentOrder.fulfillment?.coolerBagRequired && (
              <div className="rounded-lg bg-ice/60 p-2 text-xs font-semibold text-deep">
                ❄️ <strong>Cold-Chain Protection:</strong> Insulated cooler bag included
                to prevent melting during transit.
              </div>
            )}

            {/* Subtotal */}
            <div className="flex justify-between text-steel">
              <span>Subtotal:</span>
              <span>₱{currentOrder.subtotal}</span>
            </div>

            {/* Bulk Discount Rule */}
            {currentOrder.discount > 0 ? (
              <div className="flex justify-between font-semibold text-emerald-600">
                <span>Bulk Discount (5% applied):</span>
                <span>-₱{currentOrder.discount}</span>
              </div>
            ) : (
              <div className="text-xs text-steel">
                Tip: Orders $\ge$ 10 kg or ₱500 receive an automatic 5% bulk discount!
              </div>
            )}

            {/* Delivery Fee Calculation */}
            <div className="flex justify-between text-steel">
              <span>
                Delivery Fee ({form.deliveryTier}):
                {currentOrder.subtotal >= FULFILLMENT_RULES.FREE_DELIVERY_THRESHOLD && (
                  <span className="ml-1 text-xs text-emerald-600 font-semibold">(Free base delivery)</span>
                )}
              </span>
              <span>₱{currentOrder.fulfillment?.deliveryFee || 0}</span>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between border-t border-line pt-3 text-xl font-bold text-deep">
              <span>Grand Total:</span>
              <span>₱{currentOrder.grandTotal}</span>
            </div>

            {/* COD Change Calculation Preview */}
            {form.paymentMethod === PAYMENT_METHOD.COD &&
              parseFloat(form.tenderedAmount) >= currentOrder.grandTotal && (
                <div className="rounded-md bg-emerald-50 p-2 text-xs font-medium text-emerald-800">
                  Change to be prepared by rider:{" "}
                  <strong>₱{currentOrder.payment.changeDue}</strong>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Checkout Form Connected to Fulfillment and Payment Models */}
      <form className={`${panel} flex flex-col gap-3.5`} onSubmit={handleSubmit}>
        <h3 className="font-display text-xl text-deep">Delivery & Payment</h3>

        {validationError && (
          <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 whitespace-pre-line border border-red-200">
            {validationError}
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm text-steel">
          Customer Name
          <input
            className={input}
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Maria Santos"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-steel">
          Phone Number
          <input
            className={input}
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="e.g. 0917-123-4567"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-steel">
          Delivery Address
          <input
            className={input}
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Barangay, Street, House/Store #"
            required
          />
        </label>

        {/* Fulfillment Model Fields */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-steel">
            Delivery Time
            <input
              className={input}
              type="time"
              name="time"
              min="08:00"
              max="20:00"
              value={form.time}
              onChange={handleChange}
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-steel">
            Delivery Speed
            <select
              className={input}
              name="deliveryTier"
              value={form.deliveryTier}
              onChange={handleChange}
            >
              <option value={DELIVERY_TIER.STANDARD}>Standard (₱30)</option>
              <option value={DELIVERY_TIER.EXPRESS}>Express (+₱25)</option>
            </select>
          </label>
        </div>

        {/* Payment Transaction Model Fields */}
        <label className="flex flex-col gap-1 text-sm text-steel">
          Payment Method
          <select
            className={input}
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
          >
            <option value={PAYMENT_METHOD.COD}>Cash on Delivery (COD)</option>
            <option value={PAYMENT_METHOD.GCASH}>GCash</option>
          </select>
        </label>

        {form.paymentMethod === PAYMENT_METHOD.COD ? (
          <label className="flex flex-col gap-1 text-sm text-steel">
            Cash to Tender (optional, for rider's change)
            <input
              className={input}
              type="number"
              name="tenderedAmount"
              value={form.tenderedAmount}
              onChange={handleChange}
              placeholder={`e.g. ${Math.ceil((currentOrder.grandTotal || 100) / 100) * 100}`}
              min={currentOrder.grandTotal}
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1 text-sm text-steel">
            GCash Reference Number
            <input
              className={input}
              type="text"
              name="referenceNumber"
              value={form.referenceNumber}
              onChange={handleChange}
              placeholder="e.g. 1002345678901"
              required
            />
          </label>
        )}

        <button
          className="mt-2 cursor-pointer rounded-lg bg-aqua px-5 py-3 font-bold text-deep hover:bg-aqua-dark hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-deep disabled:cursor-not-allowed disabled:bg-line disabled:text-steel"
          type="submit"
          disabled={!hasItems}
        >
          Place order (₱{currentOrder.grandTotal})
        </button>
      </form>
    </div>
  );
}
