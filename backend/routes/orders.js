import express from "express";
import { pool } from "../db.js";
import authenticate from "../middleware/auth.js";
import * as emailService from "../emailService.js";

const router = express.Router();

/* =========================
   Helper
========================= */
const parseShippingAddress = (value) => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value; // already object
};

/**
 * CREATE ORDER
 * POST /api/orders
 */
router.post("/", authenticate, async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { items, total, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (!shippingAddress?.fullName || !shippingAddress?.addressLine1) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    if (!total) {
      return res.status(400).json({ message: "Total is required" });
    }

    await client.query("BEGIN");

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const orderResult = await client.query(
      `INSERT INTO orders 
       (order_id, user_id, total, status, shipping_address, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, order_id, created_at`,
      [orderId, userId, total, "pending", JSON.stringify(shippingAddress)]
    );

    const dbOrderId = orderResult.rows[0].id;

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, product_image, quantity, price, color, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          dbOrderId,
          item.id,
          item.name || "Product",
          item.image || null,
          item.quantity,
          item.price,
          item.color || null,
          item.size || null,
        ]
      );
    }

    await client.query("COMMIT");

    let userEmail = req.user.email;
    if (!userEmail) {
      const userResult = await pool.query(
        "SELECT email FROM users WHERE id = $1",
        [userId]
      );
      userEmail = userResult.rows[0]?.email;
    }

    const orderData = {
      id: orderId,
      items,
      shippingAddress,
      total,
    };

    // Send emails but don't block order creation if they fail
    try {
      await emailService.sendOrderConfirmation(orderData, userEmail);
      await emailService.sendOwnerOrderNotification(orderData, userEmail);
    } catch (emailError) {
      console.error("Email sending error (order still created):", emailError);
      // Don't fail the order if emails fail
    }

    res.json({
      success: true,
      message: "Order placed successfully",
      order: {
        id: orderId,
        total,
        status: "pending",
        date: orderResult.rows[0].created_at,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  } finally {
    client.release();
  }
});

/**
 * GET ALL ORDERS
 * GET /api/orders
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const ordersResult = await pool.query(
      `SELECT id, order_id, total, status, shipping_address, created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const orders = await Promise.all(
      ordersResult.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT product_id as id, product_name as name, product_image as image,
                  quantity, price, color, size
           FROM order_items
           WHERE order_id = $1`,
          [order.id]
        );

        return {
          id: order.order_id,
          items: itemsResult.rows,
          shippingAddress: parseShippingAddress(order.shipping_address),
          total: Number(order.total),
          status: order.status,
          date: order.created_at,
        };
      })
    );

    res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET SINGLE ORDER
 * GET /api/orders/:orderId
 */
router.get("/:orderId", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const orderResult = await pool.query(
      `SELECT id, order_id, total, status, shipping_address, created_at
       FROM orders
       WHERE order_id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT product_id as id, product_name as name, product_image as image,
              quantity, price, color, size
       FROM order_items
       WHERE order_id = $1`,
      [order.id]
    );

    res.json({
      id: order.order_id,
      items: itemsResult.rows,
      shippingAddress: parseShippingAddress(order.shipping_address),
      total: Number(order.total),
      status: order.status,
      date: order.created_at,
    });
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * CANCEL ORDER
 * POST /api/orders/:orderId/cancel
 */
router.post("/:orderId/cancel", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    // Get the order to verify it exists and belongs to the user
    const orderResult = await pool.query(
      `SELECT id, order_id, total, status, shipping_address, created_at 
       FROM orders 
       WHERE order_id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Check if order can be cancelled (only pending orders can be cancelled)
    if (order.status !== "pending") {
      return res.status(400).json({ error: "Only pending orders can be cancelled" });
    }

    // Get order items for email
    const itemsResult = await pool.query(
      `SELECT product_id as id, product_name as name, product_image as image,
              quantity, price, color, size
       FROM order_items
       WHERE order_id = $1`,
      [order.id]
    );

    // Get user email
    const userResult = await pool.query(
      "SELECT email FROM users WHERE id = $1",
      [userId]
    );

    const userEmail = userResult.rows[0]?.email;

    // Update order status to cancelled
    await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      ["cancelled", order.id]
    );

    // Prepare order data for email
    const orderForEmail = {
      id: order.order_id,
      date: order.created_at,
      total: Number(order.total),
      status: 'cancelled',
      items: itemsResult.rows.map(item => ({
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        image: item.image
      })),
      shippingAddress: parseShippingAddress(order.shipping_address)
    };

    // Send cancellation emails (don't block the response if emails fail)
    try {
      await emailService.sendOrderCancellationEmails(orderForEmail, userEmail);
      console.log(`✓ Cancellation emails sent for order ${orderId}`);
    } catch (emailError) {
      console.error(`✗ Failed to send cancellation emails for order ${orderId}:`, emailError);
      // Don't fail the cancellation if emails fail - order is still cancelled
    }

    res.json({ 
      message: "Order cancelled successfully. Confirmation emails have been sent.", 
      orderId 
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
});

/**
 * UPDATE ORDER STATUS
 * POST /api/orders/:orderId/update-status
 * Admin endpoint to update order status to processing, shipped, delivered
 */
router.post("/:orderId/update-status", authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["processing", "shipped", "delivered"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Get the order
    const orderResult = await pool.query(
      `SELECT id, status FROM orders WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // Check if order is cancelled - can't update a cancelled order
    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Cannot update a cancelled order" });
    }

    // Update order status
    await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, order.id]
    );

    res.json({ message: "Order status updated successfully", orderId, status });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;
