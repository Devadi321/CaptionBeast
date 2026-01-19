import stripe
from config import STRIPE_SECRET_KEY

stripe.api_key = STRIPE_SECRET_KEY

def create_products():
    print("Creating Stripe Products...")
    
    # 1. Pro Plan
    pro = stripe.Product.create(name="CaptionBeast Pro")
    pro_price = stripe.Price.create(
        product=pro.id,
        unit_amount=1500, # $15.00
        currency="usd",
        recurring={"interval": "month"},
    )
    print(f"PRO PLAN Created: {pro_price.id}")

    # 2. Business Plan
    biz = stripe.Product.create(name="CaptionBeast Business")
    biz_price = stripe.Price.create(
        product=biz.id,
        unit_amount=5000, # $50.00
        currency="usd",
        recurring={"interval": "month"},
    )
    print(f"BUSINESS PLAN Created: {biz_price.id}")
    
    return pro_price.id, biz_price.id

if __name__ == "__main__":
    create_products()
