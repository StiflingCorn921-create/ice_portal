/**
 * FulfillmentModel.js
 * Represents shipping, cold-chain handling, and delivery fulfillment business logic.
 * Enforces ice perishability rules, operating hours, and dynamic delivery fee calculation.
 */

export const FULFILLMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
});

export const DELIVERY_TIER = Object.freeze({
  STANDARD: "STANDARD",
  EXPRESS: "EXPRESS",
});

export const FULFILLMENT_RULES = Object.freeze({
  BASE_DELIVERY_FEE: 30, // ₱30 standard delivery base fee
  FREE_DELIVERY_THRESHOLD: 300, // Free delivery for orders >= ₱300
  EXPRESS_SURCHARGE: 25, // ₱25 express rush delivery fee
  BULK_WEIGHT_THRESHOLD_KG: 15, // Orders >= 15 kg require bulk handling
  BULK_HANDLING_FEE: 20, // ₱20 heavy lifting surcharge
  COOLER_BAG_WEIGHT_KG: 10, // Orders >= 10 kg require insulated thermal bags
  OPERATING_START_HOUR: 8, // 8:00 AM
  OPERATING_END_HOUR: 20, // 8:00 PM
  MIN_LEAD_TIME_MINUTES: 30, // Minimum 30 mins preparation & transit
});

export class FulfillmentModel {
  constructor({
    fulfillmentId = `FUL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId = null,
    address = "",
    preferredTime = "",
    totalWeightKg = 0,
    deliveryTier = DELIVERY_TIER.STANDARD,
    coolerBagRequired = false,
    deliveryFee = FULFILLMENT_RULES.BASE_DELIVERY_FEE,
    status = FULFILLMENT_STATUS.PENDING,
    assignedRider = null,
    dispatchedAt = null,
    deliveredAt = null,
    notes = "",
  } = {}) {
    this.fulfillmentId = fulfillmentId;
    this.orderId = orderId;
    this.address = String(address).trim();
    this.preferredTime = preferredTime;
    this.totalWeightKg = Number(totalWeightKg) || 0;
    this.deliveryTier = deliveryTier;
    this.coolerBagRequired = Boolean(coolerBagRequired);
    this.deliveryFee = Number(deliveryFee) || 0;
    this.status = status;
    this.assignedRider = assignedRider;
    this.dispatchedAt = dispatchedAt;
    this.deliveredAt = deliveredAt;
    this.notes = notes;

    // Automatically evaluate cold-chain requirements upon initialization
    this.evaluateCoolerBagRequirement();
  }

  /**
   * Cold-chain rule:
   * Ice melts quickly; large volumes (>= 10kg) or express rushed delivery
   * require dedicated insulated cooler bags to guarantee ice cube integrity.
   */
  evaluateCoolerBagRequirement() {
    this.coolerBagRequired =
      this.totalWeightKg >= FULFILLMENT_RULES.COOLER_BAG_WEIGHT_KG ||
      this.deliveryTier === DELIVERY_TIER.EXPRESS;
    return this.coolerBagRequired;
  }

  /**
   * Calculates delivery fee based on order subtotal, delivery tier, and weight.
   * @param {number} subtotal - The order subtotal in PHP
   * @returns {number} The computed delivery fee in PHP
   */
  calculateDeliveryFee(subtotal = 0) {
    let fee = 0;

    // Free base delivery if subtotal meets or exceeds threshold
    if (subtotal < FULFILLMENT_RULES.FREE_DELIVERY_THRESHOLD) {
      fee += FULFILLMENT_RULES.BASE_DELIVERY_FEE;
    }

    // Express priority rush add-on
    if (this.deliveryTier === DELIVERY_TIER.EXPRESS) {
      fee += FULFILLMENT_RULES.EXPRESS_SURCHARGE;
    }

    // Heavy bulk handling add-on
    if (this.totalWeightKg >= FULFILLMENT_RULES.BULK_WEIGHT_THRESHOLD_KG) {
      fee += FULFILLMENT_RULES.BULK_HANDLING_FEE;
    }

    this.deliveryFee = fee;
    return this.deliveryFee;
  }

  /**
   * Validates delivery window against operating hours (08:00 to 20:00).
   * @param {string} [timeString] - Optional time string in HH:MM format
   * @returns {{ isValid: boolean, error: string | null }}
   */
  validateDeliveryWindow(timeString = this.preferredTime) {
    if (!timeString) {
      return { isValid: false, error: "Preferred delivery time is required." };
    }

    const [hoursStr, minutesStr] = timeString.split(":");
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return { isValid: false, error: "Invalid time format (expected HH:MM)." };
    }

    if (
      hours < FULFILLMENT_RULES.OPERATING_START_HOUR ||
      hours > FULFILLMENT_RULES.OPERATING_END_HOUR ||
      (hours === FULFILLMENT_RULES.OPERATING_END_HOUR && minutes > 0)
    ) {
      return {
        isValid: false,
        error: `Delivery time must be between 8:00 AM and 8:00 PM (operating hours).`,
      };
    }

    return { isValid: true, error: null };
  }

  /**
   * Validates address and requirements.
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this.address || this.address.length < 5) {
      errors.push("A complete delivery address (at least 5 characters) is required.");
    }

    const timeValidation = this.validateDeliveryWindow();
    if (!timeValidation.isValid) {
      errors.push(timeValidation.error);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Dispatches the delivery with an assigned rider.
   * @param {string} riderName
   */
  dispatch(riderName = "Assigned Delivery Rider") {
    if (this.status === FULFILLMENT_STATUS.CANCELLED) {
      throw new Error("Cannot dispatch a cancelled fulfillment.");
    }
    this.status = FULFILLMENT_STATUS.OUT_FOR_DELIVERY;
    this.assignedRider = riderName;
    this.dispatchedAt = new Date().toISOString();
  }

  /**
   * Marks the fulfillment as delivered.
   */
  markDelivered() {
    if (this.status !== FULFILLMENT_STATUS.OUT_FOR_DELIVERY) {
      throw new Error("Cannot mark as delivered unless order is out for delivery.");
    }
    this.status = FULFILLMENT_STATUS.DELIVERED;
    this.deliveredAt = new Date().toISOString();
  }

  toJSON() {
    return {
      fulfillmentId: this.fulfillmentId,
      orderId: this.orderId,
      address: this.address,
      preferredTime: this.preferredTime,
      totalWeightKg: this.totalWeightKg,
      deliveryTier: this.deliveryTier,
      coolerBagRequired: this.coolerBagRequired,
      deliveryFee: this.deliveryFee,
      status: this.status,
      assignedRider: this.assignedRider,
      dispatchedAt: this.dispatchedAt,
      deliveredAt: this.deliveredAt,
      notes: this.notes,
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    return new FulfillmentModel(data);
  }
}

