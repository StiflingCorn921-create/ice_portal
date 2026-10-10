/**
 * src/models/index.js
 * Central exports for Domain Models and business logic rules.
 */

export {
  OrderModel,
  ORDER_STATUS,
  ORDER_RULES,
  parseWeightKg,
} from "./OrderModel.js";

export {
  PaymentTransactionModel,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "./PaymentTransactionModel.js";

export {
  FulfillmentModel,
  DELIVERY_TIER,
  FULFILLMENT_STATUS,
  FULFILLMENT_RULES,
} from "./FulfillmentModel.js";

import { OrderModel } from "./OrderModel.js";
import { FulfillmentModel, DELIVERY_TIER } from "./FulfillmentModel.js";
import { PaymentTransactionModel, PAYMENT_METHOD } from "./PaymentTransactionModel.js";

/**
 * Factory helper: Seamlessly constructs and connects Order, Fulfillment,
 * and Payment models directly from application/UI state.
 *
 * @param {Object} params
 * @param {Array} params.products - Products list [{ id, name, size, price }]
 * @param {Object} params.cart - Cart mapping { [productId]: quantity }
 * @param {Object} params.customer - { name, phone, address }
 * @param {string} [params.preferredTime] - Delivery time (HH:MM)
 * @param {string} [params.deliveryTier] - 'STANDARD' | 'EXPRESS'
 * @param {string} [params.paymentMethod] - 'COD' | 'GCASH'
 * @param {number} [params.tenderedAmount] - Cash tendered for COD
 * @param {string} [params.referenceNumber] - GCash reference code
 * @param {string} [params.notes] - Special instructions
 * @returns {OrderModel} Fully initialized, interconnected domain order aggregate
 */
export function buildOrder({
  products = [],
  cart = {},
  customer = {},
  preferredTime = "",
  deliveryTier = DELIVERY_TIER.STANDARD,
  paymentMethod = PAYMENT_METHOD.COD,
  tenderedAmount = 0,
  referenceNumber = "",
  notes = "",
} = {}) {
  // 1. Transform cart map into order items
  const items = products
    .filter((p) => cart[p.id] && cart[p.id] > 0)
    .map((p) => ({
      id: p.id,
      name: p.name,
      size: p.size,
      price: p.price,
      quantity: cart[p.id],
    }));

  // 2. Initialize Order Model
  const order = new OrderModel({
    customer: {
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
    },
    items,
    notes,
  });

  // 3. Connect Fulfillment Model
  order.attachFulfillment({
    address: customer.address || "",
    preferredTime,
    deliveryTier,
    notes,
  });

  // 4. Connect Payment Transaction Model
  order.attachPayment({
    paymentMethod,
    tenderedAmount,
    referenceNumber,
  });

  return order;
}

