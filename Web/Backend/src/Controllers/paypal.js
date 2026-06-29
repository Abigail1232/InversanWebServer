const axios = require("axios");
const { application } = require("express");
require("dotenv").config();
//! Pasos para usar PayPal
//! 1) el frontend expone la vista y solicita al backend crear la orden
//! 2) El backend se comunica con PayPal y responde la orden (ordenid)
//! 3) en el frontend el usuario autoriza el pago en la ventana emergente de PayPal.
//! 4) el backend una vez autorizado, el frontend manda una señal para que finalice el pago y actualiza los campos correspondientes en la bd ()

async function getAccessTokenPaypal() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      "grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } },
    );
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error al obtener el token de acceso de PayPal:",
      error.message,
    );
    throw new Error("No se pudo obtener el token de acceso de PayPal");
  }
}

async function getExchangeRate() {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  try {
    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
    );

    const rate = response.data?.conversion_rates?.HNL;

    if (!rate) {
      throw new Error("No se pudo obtener la tasa USD a HNL");
    }

    return rate;
  } catch (error) {
    console.error(
      "Error al obtener la tasa de cambio:",
      error.response?.data || error.message,
    );
    throw new Error("No se pudo obtener la tasa de cambio");
  }
}

async function getAccess(req, res) {
  try {
    const token = await getAccessTokenPaypal();

    return res.status(200).json({
      success: true,
      access_token: token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createOrderPaypal(req, res) {
  const accessToken = await getAccessTokenPaypal();
  const { monto } = req.body;
  try {
    const exchangeRate = await getExchangeRate();
    const montoUsd = (Number(monto || 1) / Number(exchangeRate)).toFixed(2);

    const response = await axios.post(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          { amount: { currency_code: "USD", value: montoUsd || "1.00" } },
        ],
        application_context: {
          brand_name: "Inversan",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: "https://www.google.com",
          cancel_url: "https://www.google.com",
        },
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    return res.status(200).json({ data: response.data });
  } catch (error) {
    return res.status(500).json({
      message: "Error al crear la orden de PayPal" + error.message,
    });
  }
}

async function captureOrderPaypal(req, res) {
  const accessToken = await getAccessTokenPaypal();
  const { orderId } = req.params;
  try {
    const response = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    // Aquí puedes realizar lógica adicional como guardar en DB el pago o actualizar el estado de la orden
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({
      message: "Error al capturar la orden de PayPal" + error.message,
    });
  }
}

module.exports = {
  getAccess,
  createOrderPaypal,
  captureOrderPaypal,
};
