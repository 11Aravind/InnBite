// Dynamic Razorpay Checkout Script Loader
export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const openRazorpayCheckout = async ({ amount, orderId, customerName, customerPhone, onSuccess, onFailure }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        if (onFailure) onFailure(new Error('Razorpay SDK load failed'));
        return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo_key';

    const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        name: 'Orderly Restaurant',
        description: `Order Payment for Table #${orderId || 'Order'}`,
        image: '/logo.svg',
        handler: function (response) {
            if (onSuccess) {
                onSuccess({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature
                });
            }
        },
        prefill: {
            name: customerName || 'Guest',
            contact: customerPhone || '9999999999',
        },
        theme: {
            color: '#171212'
        },
        modal: {
            ondismiss: function () {
                if (onFailure) onFailure(new Error('Payment cancelled by user'));
            }
        }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
};
