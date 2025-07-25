import { getOrCreateCart, populateCart, calculateCartTotals } from '../controllers/cart.controller.js'; // Adjust imports as per your structure

export async function clearCartForUser(userId) {
  try {
    let cart = await getOrCreateCart(userId);
    
    cart.items = [];
    cart.shipping = { method: "Standard", cost: 5.99 };
    cart.subtotal = 0;
    cart.tax = 0;
    cart.total = 0;
    await calculateCartTotals(cart);
    await cart.save();

    return await populateCart(cart);
  } catch (error) {
    console.error("Error in clearCartForUser:", error);
    throw new Error("Failed to clear cart");
  }
}
