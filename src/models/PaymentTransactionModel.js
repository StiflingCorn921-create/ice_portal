/**
 * PaymentTransactionModel.js
 * Represents payment transactions, cash on delivery (COD) change calculations,
 * digital wallet (GCash) validation, and transaction status reconciliation.
 */

export const PAYMENT_METHOD = Object.freeze({
  COD: "COD",
  GCASH: "GCASH",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
});

export class PaymentTransactionModel {
  constructor({
    transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderId = null,
    amount = 0,
    paymentMethod = PAYMENT_METHOD.COD,
    tenderedAmount = 0,
    changeDue = 0,
    referenceNumber = "",
    status = PAYMENT_STATUS.PENDING,
    paidAt = null,
    failureReason = null,
  } = {}) {
    this.transactionId = transactionId;
    this.orderId = orderId;
    this.amount = Number(amount) || 0;
    this.paymentMethod = paymentMethod;
    this.tenderedAmount = Number(tenderedAmount) || 0;
    this.changeDue = Number(changeDue) || 0;
    this.referenceNumber = String(referenceNumber).trim();
    this.status = status;
    this.paidAt = paidAt;
    this.failureReason = failureReason;

    // Auto-calculate change upon instantiation if COD
    this.calculateChange();
  }

  /**
   * Calculates change due for Cash on Delivery.
   * If customer pays with a larger denomination (e.g. ₱500 bill for a ₱220 order),
   * rider needs exact change ready.
   * @returns {number} The change amount in PHP
   */
  calculateChange() {
    if (this.paymentMethod === PAYMENT_METHOD.COD) {
      if (this.tenderedAmount > 0 && this.tenderedAmount >= this.amount) {
        this.changeDue = Number((this.tenderedAmount - this.amount).toFixed(2));
      } else {
        this.changeDue = 0;
      }
    } else {
      this.changeDue = 0;
    }
    return this.changeDue;
  }

  /**
   * Sets tendered cash amount for COD and recalculates change.
   * @param {number} cash
   */
  setTenderedAmount(cash) {
    this.tenderedAmount = Math.max(0, Number(cash) || 0);
    return this.calculateChange();
  }

  /**
   * Validates transaction data before placing/processing the order.
   * @returns {{ isValid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    if (this.amount <= 0) {
      errors.push("Payment amount must be greater than zero.");
    }

    if (this.paymentMethod === PAYMENT_METHOD.COD) {
      if (this.tenderedAmount > 0 && this.tenderedAmount < this.amount) {
        errors.push(
          `Tendered cash (₱${this.tenderedAmount}) is less than total amount (₱${this.amount}).`
        );
      }
    } else if (this.paymentMethod === PAYMENT_METHOD.GCASH) {
      if (!this.referenceNumber || this.referenceNumber.length < 6) {
        errors.push("A valid GCash transaction reference number (at least 6 digits) is required.");
      }
    } else {
      errors.push(`Unsupported payment method: ${this.paymentMethod}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Processes and completes the payment.
   * @param {Object} [details]
   */
  processPayment({ tenderedAmount, referenceNumber } = {}) {
    if (tenderedAmount !== undefined) {
      this.tenderedAmount = Number(tenderedAmount);
      this.calculateChange();
    }
    if (referenceNumber !== undefined) {
      this.referenceNumber = String(referenceNumber).trim();
    }

    const validation = this.validate();
    if (!validation.isValid) {
      this.status = PAYMENT_STATUS.FAILED;
      this.failureReason = validation.errors.join(", ");
      throw new Error(`Payment processing failed: ${this.failureReason}`);
    }

    this.status = PAYMENT_STATUS.COMPLETED;
    this.paidAt = new Date().toISOString();
    this.failureReason = null;
    return this;
  }

  /**
   * Issues a refund for this transaction.
   * @param {string} reason
   */
  refund(reason = "Order cancelled") {
    if (this.status !== PAYMENT_STATUS.COMPLETED) {
      throw new Error("Cannot refund a transaction that has not been completed.");
    }
    this.status = PAYMENT_STATUS.REFUNDED;
    this.failureReason = reason;
  }

  toJSON() {
    return {
      transactionId: this.transactionId,
      orderId: this.orderId,
      amount: this.amount,
      paymentMethod: this.paymentMethod,
      tenderedAmount: this.tenderedAmount,
      changeDue: this.changeDue,
      referenceNumber: this.referenceNumber,
      status: this.status,
      paidAt: this.paidAt,
      failureReason: this.failureReason,
    };
  }

  static fromJSON(data) {
    if (!data) return null;
    return new PaymentTransactionModel(data);
  }
}

