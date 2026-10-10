/**
 * OrderModel.js
 * The core domain aggregate representing a customer's ice order.
 * Coordinates items, weight calculation, bulk discounts, fulfillment,
 * and payment transaction models in a cohesive business graph.
 */

import { FulfillmentModel, FULFILLMENT_STATUS } from "./FulfillmentModel.js";
import { PaymentTransactionModel, PAYMENT_STATUS } from "./PaymentTransactionModel.js";

export const ORDER_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
});

export const ORDER_RULES = Object.freeze({
  MINIMUM_ORDER_SUBTOTAL: 30, // Minimum order subtotal is ₱30
  BULK_DISCOUNT_MIN_WEIGHT_KG: 10, // 10 kg qualifies for reseller/party discount
  BULK_DISCOUNT_MIN_SUBTOTAL: 500, // Or subtotal >= ₱500 qualifies
  BULK_DISCOUNT_RATE: 0.05, // 5% bulk discount
});

/**
 * Extracts weight in kilograms from size string (e.g. "1 kg" -> 1, "10 kg" -> 10).
 */
export function parseWeightKg(sizeStr = "") {
  if (typeof sizeStr === "number") return sizeStr;
  const match = String(sizeStr).match(/([\d.]+)\s*kg/i);
  return match ? parseFloat(match[1]) : 1;
}

export class OrderModel {
  constructor({
    orderId = `ICE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customer = { name: "", phone: "", address: "" },
    items = [],
    fulfillment = null,
    payment = null,
    status = ORDER_STATUS.DRAFT,
    subtotal = 0,
    discount = 0,
    grandTotal = 0,
    totalWeightKg = 0,
    createdAt = new Date().toISOString(),
    notes = "",
  } = {}) {
    this.orderId = orderId;
    this.customer = {
      name: String(customer?.name || "").trim(),
      phone: String(customer?.phone || "").trim(),
      address: String(customer?.address || "").trim(),
    };
    this.status = status;
    this.createdAt = createdAt;
    this.notes = notes;

    // Items list: [{ id, name, size, price, quantity, weightKg, lineTotal }]
    this.items = (items || []).map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const price = Number(item.price) || 0;
      const weightKg = item.weightKg !== undefined ? item.weightKg : parseWeightKg(item.size);
      return {
        id: item.id,
        name: item.name,
        size: item.size,
        price,
        quantity,
        weightKg,
        lineTotal: Number((price * quantity).toFixed(2)),
      };
    });

    // Seamless connection: Initialize domain children models
    if (fulfillment instanceof FulfillmentModel) {
      this.fulfillment = fulfillment;
      this.fulfillment.orderId = this.orderId;
    } else if (fulfillment && typeof fulfillment === "object") {
      this.fulfillment = new FulfillmentModel({ ...fulfillment, orderId: this.orderId });
    } else {
      this.fulfillment = null;
    }

    if (payment instanceof PaymentTransactionModel) {
      this.payment = payment;
      this.payment.orderId = this.orderId;
    } else if (payment && typeof payment === "object") {
      this.payment = new PaymentTransactionModel({ ...payment, orderId: this.orderId });
    } else {
      this.payment = null;
    }

    // Initialize totals and propagate rules across connected models
    this.subtotal = Number(subtotal) || 0;
    this.discount = Number(discount) || 0;
    this.grandTotal = Number(grandTotal) || 0;
    this.totalWeightKg = Number(totalWeightKg) || 0;

    this.recalculateTotals();
  }

  /**
   * Recalculates all order figures and synchronizes connected Fulfillment and Payment models.
   */
  recalculateTotals() {
    // 1. Calculate raw subtotal and total ice weight
    this.subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.totalWeightKg = this.items.reduce(
      (sum, item) => sum + (item.weightKg || 1) * item.quantity,
      0
    );

    // 2. Evaluate bulk discount rule
    this.discount = this.evaluateBulkDiscount();

    // 3. Seamlessly synchronize Fulfillment Model
    let deliveryFee = 0;
    if (this.fulfillment) {
      this.fulfillment.totalWeightKg = this.totalWeightKg;
      this.fulfillment.evaluateCoolerBagRequirement();
      deliveryFee = this.fulfillment.calculateDeliveryFee(this.subtotal);
    }

    // 4. Compute grand total
    this.grandTotal = Math.max(0, Number((this.subtotal - this.discount + deliveryFee).toFixed(2)));

    // 5. Seamlessly synchronize Payment Transaction Model
    if (this.payment) {
      this.payment.amount = this.grandTotal;
      this.payment.calculateChange();
    }

    return {
      subtotal: this.subtotal,
      discount: this.discount,
      deliveryFee,
      grandTotal: this.grandTotal,
      totalWeightKg: this.totalWeightKg,
    };
  }

  /**
   * Business rule:
   * Orders >= 10 kg of ice or subtotal >= ₱500 receive a 5% bulk party/reseller discount.
   * @returns {number} The discount amount in PHP
   */
  evaluateBulkDiscount() {
    const qualifiesForBulk =
      this.totalWeightKg >= ORDER_RULES.BULK_DISCOUNT_MIN_WEIGHT_KG ||
      this.subtotal >= ORDER_RULES.BULK_DISCOUNT_MIN_SUBTOTAL;

    if (qualifiesForBulk && this.subtotal > 0) {
      return Number((this.subtotal * ORDER_RULES.BULK_DISCOUNT_RATE).toFixed(2));
    }
    return 0;
  }

  /**
   * Adds or increments a product in the order.
   * @param {Object} product
   * @param {number} [quantity=1]
   */
  addItem(product, quantity = 1) {
    const existing = this.items.find((i) => i.id === product.id);
    const weightKg = parseWeightKg(product.size);

    if (existing) {
      existing.quantity += quantity;
      existing.lineTotal = existing.price * existing.quantity;
    } else {
      this.items.push({
        id: product.id,
        name: product.name,
        size: product.size,
        price: product.price,
        quantity,
        weightKg,
        lineTotal: product.price * quantity,
      });
    }

    this.recalculateTotals();
    return this;
  }

  /**
   * Decrements or removes a product from the order.
   * @param {number} productId
   * @param {number} [quantity=1]
   */
  removeItem(productId, quantity = 1) {
    const index = this.items.findIndex((i) => i.id === productId);
    if (index === -1) return this;

    const item = this.items[index];
    if (item.quantity > quantity) {
      item.quantity -= quantity;
      item.lineTotal = item.price * item.quantity;
    } else {
      this.items.splice(index, 1);
    }

    this.recalculateTotals();
    return this;
  }

  /**
   * Seamlessly connects or updates the Fulfillment model for this order.
   * @param {Object|FulfillmentModel} fulfillmentData
   */
  attachFulfillment(fulfillmentData) {
    if (fulfillmentData instanceof FulfillmentModel) {
      this.fulfillment = fulfillmentData;
      this.fulfillment.orderId = this.orderId;
    } else {
      this.fulfillment = new FulfillmentModel({
        ...fulfillmentData,
        orderId: this.orderId,
        address: fulfillmentData?.address || this.customer.address,
        totalWeightKg: this.totalWeightKg,
      });
    }

    this.recalculateTotals();
    return this.fulfillment;
  }

  /**
   * Seamlessly connects or updates the PaymentTransaction model for this order.
   * @param {Object|PaymentTransactionModel} paymentData
   */
  attachPayment(paymentData) {
    if (paymentData instanceof PaymentTransactionModel) {
      this.payment = paymentData;
      this.payment.orderId = this.orderId;
    } else {
      this.payment = new PaymentTransactionModel({
        ...paymentData,
        orderId: this.orderId,
        amount: this.grandTotal,
      });
    }

    this.recalculateTotals();
    return this.payment;
  }

  /**
   * Validates the complete order graph (items, customer, fulfillment, and payment).
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (this.items.length === 0) {
      errors.push("Your order is empty. Please add at least one ice bag.");
    }

    if (this.subtotal < ORDER_RULES.MINIMUM_ORDER_SUBTOTAL) {
      errors.push(
        `Minimum order amount is ₱${ORDER_RULES.MINIMUM_ORDER_SUBTOTAL}. Current: ₱${this.subtotal}.`
      );
    }

    if (!this.customer.name || this.customer.name.length < 2) {
      errors.push("Please provide a valid customer name (at least 2 letters).");
    }

    if (!this.customer.phone || this.customer.phone.length < 7) {
      errors.push("Please provide a valid phone contact number.");
    }

    if (this.fulfillment) {
      const fulfillmentValidation = this.fulfillment.validate();
      if (!fulfillmentValidation.isValid) {
        errors.push(...fulfillmentValidation.errors);
      }
    } else {
      errors.push("Fulfillment / delivery information is required.");
    }

    if (this.payment) {
      const paymentValidation = this.payment.validate();
      if (!paymentValidation.isValid) {
        errors.push(...paymentValidation.errors);
      }
    } else {
      errors.push("Payment transaction information is required.");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Finalizes placing the order after validating all rules.
   */
  placeOrder({ customer, fulfillment, payment } = {}) {
    if (customer) {
      this.customer = {
        name: customer.name?.trim() || this.customer.name,
        phone: customer.phone?.trim() || this.customer.phone,
        address: customer.address?.trim() || this.customer.address,
      };
    }

    if (fulfillment) {
      this.attachFulfillment(fulfillment);
    }

    if (payment) {
      this.attachPayment(payment);
    }

    this.recalculateTotals();

    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot place order:\n• ${validation.errors.join("\n• ")}`);
    }

    this.status = ORDER_STATUS.PLACED;
    return this;
  }

  /**
   * Confirms the order by the ice plant dispatch team.
   */
  confirmOrder() {
    if (this.status !== ORDER_STATUS.PLACED) {
      throw new Error("Only placed orders can be confirmed.");
    }
    this.status = ORDER_STATUS.CONFIRMED;
    if (this.fulfillment) {
      this.fulfillment.status = FULFILLMENT_STATUS.ASSIGNED;
    }
    return this;
  }

  /**
   * Dispatches the order for delivery.
   */
  dispatchOrder(riderName = "CubeIce Express Courier") {
    if (this.status !== ORDER_STATUS.CONFIRMED && this.status !== ORDER_STATUS.PLACED) {
      throw new Error("Order must be confirmed before dispatching.");
    }
    this.status = ORDER_STATUS.OUT_FOR_DELIVERY;
    if (this.fulfillment) {
      this.fulfillment.dispatch(riderName);
    }
    return this;
  }

  /**
   * Marks the entire order as completed, including delivery and payment.
   */
  completeOrder() {
    if (this.status === ORDER_STATUS.CANCELLED) {
      throw new Error("Cannot complete a cancelled order.");
    }
    this.status = ORDER_STATUS.COMPLETED;
    if (this.fulfillment) {
      this.fulfillment.markDelivered();
    }
    if (this.payment && this.payment.status !== PAYMENT_STATUS.COMPLETED) {
      this.payment.processPayment();
    }
    return this;
  }

  /**
   * Cancels the order if not yet delivered.
   */
  cancelOrder(reason = "Customer requested cancellation") {
    if (this.status === ORDER_STATUS.COMPLETED) {
      throw new Error("Cannot cancel a completed delivery.");
    }
    this.status = ORDER_STATUS.CANCELLED;
    this.notes = `Cancelled: ${reason}`;
    if (this.fulfillment) {
      this.fulfillment.status = FULFILLMENT_STATUS.CANCELLED;
    }
    if (this.payment && this.payment.status === PAYMENT_STATUS.COMPLETED) {
      this.payment.refund(reason);
    }
    return this;
  }

  toJSON() {
    return {
      orderId: this.orderId,
      customer: this.customer,
      items: this.items,
      subtotal: this.subtotal,
      discount: this.discount,
      grandTotal: this.grandTotal,
      totalWeightKg: this.totalWeightKg,
      status: this.status,
      createdAt: this.createdAt,
      notes: this.notes,
      fulfillment: this.fulfillment ? this.fulfillment.toJSON() : null,
      payment: this.payment ? this.payment.toJSON() : null,
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    return new OrderModel({
      ...data,
      fulfillment: data.fulfillment ? FulfillmentModel.fromJSON(data.fulfillment) : null,
      payment: data.payment ? PaymentTransactionModel.fromJSON(data.payment) : null,
    });
  }
}

