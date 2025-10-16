import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

//Stripe PUBLISHABLE KEY (pk_test_... o pk_live_...)
const stripePromise = loadStripe('pk_test_51S7fdaFET5Kex2Xl4saj5iNEUKw4gtXknIeWD8iUI5XXgt3YSixVO6ppWbgY9MnkXyy8yPS7emVGZo9XD9eM9Gc000uEIFEtRQ');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  }
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [itemId, setItemId] = useState('d0de41b5-a93b-4aa1-a141-638c3a6d8833');
  const [amount, setAmount] = useState(10.00);
  const [userId, setUserId] = useState('user_456');
  
  //CAMBIAR A LA URL DEL BACKEND
  const API_URL = 'http://localhost:3000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const cardElement = elements.getElement(CardElement);
      
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) throw new Error(pmError.message);

      // Enviar uno o múltiples items
      const items = [
        {
          item_id: "d0de41b5-a93b-4aa1-a141-638c3a6d8833",
          variant_id: "cde32d9d-d488-48f7-89fc-f8b6cf9f570f",
          quantity: 2, // Cantidad
          price: 80.00, // Precio unitario
          store_id: "94c96633-ca56-437b-9784-0cc07a211f12",
          modifiers: [{
            modifier_option_id: "2f8bab9e-e986-4546-ac95-9f69ef70e143",
            name: "Almendra",
            price: 12,
            quantity: 1
          }]
        },
        {
          item_id: "d0de41b5-a93b-4aa1-a141-638c3a6d8833",
          variant_id: "bed51e3c-9179-4036-b540-1c79fc49cf03",
          quantity: 1,
          price: 70.00, // Precio unitario
          store_id: "94c96633-ca56-437b-9784-0cc07a211f12",
          modifiers: []
        }
      ];

      // Calcular total
      const totalPrice = items.reduce((sum, item) => {
        const itemTotal = item.price * item.quantity;
        const modifiersTotal = (item.modifiers || []).reduce((mSum, mod) => 
          mSum + (mod.price * (mod.quantity || 1)), 0
        );
        return sum + itemTotal + modifiersTotal;
      }, 0);

      const response = await fetch(`${API_URL}/api/v1/payments/process_payment_with_method`, {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer supersecretkey',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          payment_method_id: paymentMethod.id,
          user_id: userId,
          total_price: totalPrice,
          items: items // Array de items
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Error al procesar');
      }

      if (result.data.status === 'requires_action') {
        const { error: confirmError } = await stripe.confirmCardPayment(
          result.data.client_secret
        );
        
        if (confirmError) throw new Error(confirmError.message);
      }

      console.log('Orden creada:', result.data.order_number);
      console.log('Items:', result.data.items_count);
      
      setSuccess(true);
      cardElement.clear();

    } catch (err) {
      console.error('Error en el pago:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '40px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
          💳 Stripe Payment
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Item ID
            </label>
            <input
              type="text"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Monto (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Información de Tarjeta
            </label>
            <div style={{
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px'
            }}>
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#efe',
              color: '#3c3',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              ✅ ¡Pago exitoso!
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#5469d4',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Procesando...' : `Pagar $${amount.toFixed(2)}`}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#f7f9fc',
          borderRadius: '6px',
          fontSize: '12px'
        }}>
          <strong>🧪 Tarjetas de prueba:</strong>
          <ul style={{ marginTop: '10px' }}>
            <li>4242 4242 4242 4242 - Éxito</li>
            <li>4000 0000 0000 3220 - 3D Secure</li>
            <li>4000 0000 0000 9995 - Rechazada</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}