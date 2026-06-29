import React from "react";
import { PayPalScriptProvider, PayPalButtons, type PayPalButtonsComponentProps } from "@paypal/react-paypal-js";

interface PayPalPaymentProps {
  amount: number;
  onSuccess: (details: any) => void;
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({ amount, onSuccess }) => {
  const handleApprove: PayPalButtonsComponentProps["onApprove"] = async (_data, actions) => {
    if (!actions.order) return;
    const details = await actions.order.capture();
    onSuccess(details);
  };

  const handleError: PayPalButtonsComponentProps["onError"] = (err) => {
    console.error("PayPal Error:", err);
    alert("Ocurrió un error con el pago de PayPal");
  };

  return (
    <PayPalScriptProvider options={{ "clientId": "TU_CLIENT_ID_SANDBOX", currency: "USD" }}>
      <div style={{ marginTop: 16 }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect", label: "paypal" }}
          createOrder={(_data, actions) => {
            if (!actions.order) throw new Error("Actions.order is undefined");
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [
                {
                  amount: {
                    currency_code: 'HND',
                    value: amount.toFixed(2),
                  },
                },
              ],
            });
          }}
          onApprove={handleApprove}
          onError={handleError}
        />
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalPayment;
