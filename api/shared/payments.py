import stripe
import os

stripe.api_key = os.getenv("STRIPE_API_KEY")

class StripeService:
    @staticmethod
    def create_checkout_session(user_id: int, plan_id: int, plan_name: str, price_id: str):
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                # Usamos suscripción o pago único según necesites, 
                # por ahora mantenemos el modo suscripción.
                mode='subscription',
                success_url=f"{os.getenv('DASHBOARD_URL', 'http://localhost:3000')}/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.getenv('DASHBOARD_URL', 'http://localhost:3000')}/cancel",
                metadata={
                    'user_id': user_id,
                    'plan_id': plan_id,
                    'plan_name': plan_name
                }
            )
            return session.url
        except Exception as e:
            print(f"Error creating checkout session: {e}")
            return None
