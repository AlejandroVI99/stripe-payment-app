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
  const API_URL = 'https://e52282dd0809.ngrok-free.app';

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
          item_id: "62aa09f3-b4ea-4b08-8490-9bf1e6877714",
          variant_id: "867b5ae9-b444-435c-8c82-c525b6aef624",
          quantity: 1, // Cantidad
          price: 80.00, // Precio unitario
          store_id: "24ce36c4-fca0-4b20-a854-519683eafea4",
          modifiers: [{
            modifier_option_id: "0f07b274-89f8-4f04-839a-b6e90d8b1b7f",
            name: "Deslactosada",
            price: 10,
            quantity: 2
          }]
        },
        {
          item_id: "62aa09f3-b4ea-4b08-8490-9bf1e6877714",
          variant_id: "867b5ae9-b444-435c-8c82-c525b6aef624",
          quantity: 1, // Cantidad
          price: 80.00, // Precio unitario
          store_id: "24ce36c4-fca0-4b20-a854-519683eafea4",
          modifiers: [{
            modifier_option_id: "0f07b274-89f8-4f04-839a-b6e90d8b1b7f",
            name: "Deslactosada",
            price: 10,
            quantity: 1
          },
          {
            modifier_option_id: "91864252-ab5c-4a02-9047-70fc7da87a15",
            name: "Vainilla",
            price: 10,
            quantity: 1
          },
        ]
        },
        {
          item_id: "a644d58c-93cc-4c7f-89ab-94fc09d9a0c6",
          variant_id: "1643c6f5-0509-44e8-b32e-82160ee3a33e",
          quantity: 1,
          price: 70.00, // Precio unitario
          store_id: "24ce36c4-fca0-4b20-a854-519683eafea4",
          modifiers: [{
            modifier_option_id: "0f07b274-89f8-4f04-839a-b6e90d8b1b7f",
            name: "Deslactosada",
            price: 10,
            quantity: 1
          }]
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