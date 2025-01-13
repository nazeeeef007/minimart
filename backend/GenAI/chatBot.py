from transformers import pipeline
import json
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

class FreeChatbotWrapper:
    def __init__(self, sales_data: dict):
        """
        Initialize the chatbot wrapper using a free Hugging Face model and JSON data.
        :param sales_data: A dictionary of sales data.
        :param coupon_data: A dictionary of coupon data.
        """

        self.generator = pipeline("text2text-generation", model="google/flan-t5-large")
        print("Model loaded successfully.")
        # Save the data
        self.sales_data = sales_data
        # self.coupon_data = coupon_data

        # Define contexts for admin and customer
        self.contexts = {
            "admin": """
                You are an assistant for the Muhammadiyah Welfare Home's Minimart and Voucher System. 
                Your role is to assist administrators in managing products, vouchers, and sales reports.
                Be polite, detailed, and conversational in your responses.
                You can answer questions about:
                - Sales trends
                - Voucher utilization
                - Product inventory
                - System-related issues
                
            """,
            "customer": """
                You are an assistant for the Muhammadiyah Welfare Home's Minimart and Voucher System.
                Your role is to help customers with:
                Be polite, friendly, clear and informative in your responses.
                - Checking available vouchers
                - Understanding how to earn or redeem vouchers
                - Finding product information
                - Resolving account-related queries
                
            """
        }

    def format_sales_data(self) -> str:
        """Format sales data into a readable string."""
        sales_context = ""
        for sale in self.sales_data:
            sales_context += f"""Product: {sale['name']}, Description: {sale['description']},
              Price: {sale['price']}, Quantity: ${sale['quantity']}, Category: {sale['category']}, 
              Revenue: {sale['price'] * sale['quantity']}\n"""
        return sales_context

    def format_coupon_data(self) -> str:
        """Format coupon data into a readable string."""
        coupon_context = ""
        for coupon in self.coupon_data:
            coupon_context += f"Coupon: {coupon['description']}, Discount: {coupon['discount']}, Expiry: {coupon['expiry']}\n"
        return coupon_context

    def generate_response(self, user_query: str, user_type: str) -> str:
        """
        Generate a response for the given query and user type.
        :param user_query: The query from the user.
        :param user_type: The type of user ('admin' or 'customer').
        :return: The AI-generated response.
        """
        if user_type not in self.contexts:
            return "Invalid user type. Please specify 'admin' or 'customer'."

        # Inject relevant context
        if user_type == "admin":
            context = (
                self.contexts[user_type] +
                # "\nAvailable Coupons:\n" + self.format_coupon_data() +
                "\nSales Data:\n" + self.format_sales_data()
            )
        elif user_type == "customer":
            context = (
                self.contexts[user_type] +
                "\nAvailable Coupons:\n" + self.format_coupon_data()
            )
        # Create the prompt
        prompt = f"""
        {context}

        User Query: {user_query}
        Answer the query in detail, and provide actionable insights based on the data provided.
        """

        # Generate response
        response = self.generator(prompt, max_length=200, num_return_sequences=1)

        # Return the response text
        return response[0]['generated_text']

def main(product_JSON):
    # coupon_json = json.loads("""
    # [
    #     {"description": "10% off on groceries", "discount": "10%", "expiry": "2025-01-31"},
    #     {"description": "Free milk with purchase of $20", "discount": "Free Milk", "expiry": "2025-02-15"}
    # ]
    # """)
    chatbot = FreeChatbotWrapper(product_JSON)
    return chatbot


# Example usage
if __name__ == "__main__":
    # Example JSON data
    product_JSON = json.loads("""
    [
        {"name": "Apple", "description": "Sweet red apple", "price": 2.0, "quantity": 10, "category": "food"},
        {"name": "Washing Machine", "description": "Disposable Washing machine", "price": 20.0, "quantity": 100, "category": "household machinery"},
        {"name": "ChickenDick", "description": "Plump chicken dick", "price": 200.0, "quantity": 0, "category": "entertainment"}
    ]
    """)
    #Initialize chatbot with data
    chatbot = main(product_JSON)

    # Example queries
    admin_query = "What is the worst performing product"
    customer_query = "What coupons are available?"

    # Generate responses
    admin_response = chatbot.generate_response(admin_query, user_type="admin")
    # customer_response = chatbot.generate_response(customer_query, user_type="customer")

    print("Admin Response:\n", admin_response)
    # print("\nCustomer Response:\n", customer_response)
