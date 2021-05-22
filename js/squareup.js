var paymentForm = null;

var initPaymentForm = function (){
    var idempotency_key = uuidv4();
    model.paymentSuccess = false;
    model.modalError = '';

// Create and initialize a payment form object
    paymentForm = new SqPaymentForm({
        // Initialize the payment form elements

        // applicationId: "REPLACE_WITH_APPLICATION_ID";
        //applicationId: "sandbox-sq0idb-ZaOa3uAuhkRfgVmR2xHQyA", // SANDBOX
        applicationId: "sq0idp-sO7EOg5ctbH8jq-X_o6ytw",
        inputClass: 'sq-input',
        autoBuild: false,
        // Customize the CSS for SqPaymentForm iframe elements
        inputStyles: [{
            fontSize: '16px',
            lineHeight: '24px',
            padding: '16px',
            placeholderColor: '#a0a0a0',
            backgroundColor: 'transparent',
        }],
        // Initialize the credit card placeholders
        cardNumber: {
            elementId: 'sq-card-number',
            placeholder: i18n.t('label.cardnumber')
        },
        cvv: {
            elementId: 'sq-cvv',
            placeholder: i18n.t('label.cvv')
        },
        expirationDate: {
            elementId: 'sq-expiration-date',
            placeholder: i18n.t('label.mmyy')
        },
        postalCode: {
            elementId: 'sq-postal-code',
            placeholder: i18n.t('label.postalcode')
        },
        // SqPaymentForm callback functions
        callbacks: {
            /*
            * callback function: cardNonceResponseReceived
            * Triggered when: SqPaymentForm completes a card nonce request
            */
            cardNonceResponseReceived: function (errors, nonce, cardData) {
                if (errors) {
                    // Log errors from nonce generation to the browser developer console.
                    console.error('Encountered errors:');
                    errors.forEach(function (error) {
                        console.error('  ' + JSON.stringify(error));
                    });
                    //alert('Encountered errors, check browser developer console for more details');
                    return;
                }

                // alert(`The generated nonce is:\n${nonce}`);
                //console.log(nonce);
                //console.log(idempotency_key);
                fetch('/api/payment', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nonce: nonce,
                        idempotency_key: idempotency_key,
                        // location_id: "REPLACE_WITH_LOCATION_ID"
                        //location_id: "LDF5NP9BZJ0CP", //SANDBOX
                        location_id: "L15E6C1JAT7BD",
                        uuid : model.uuid
                    })
                })
                    .catch(err => {
                        alert('Network error: ' + err);
                    })
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(
                                errorInfo => Promise.reject(errorInfo));
                        }
                        return response.json();
                    })
                    .then(data => {
                        result = JSON.parse(data.text);
                        console.log(result);
                        model.paymentSuccess = true;
                        setDonation(result.receipt_url);
                        //alert('Payment complete successfully!\nCheck browser developer console for more details');
                    })
                    .catch(err => {
                        console.error(err);
                        model.modalError = 'error.paymentfailed';
                        //alert('Payment failed to complete!\nCheck browser developer console for more details');
                    });

            }
        }
    });
    paymentForm.build();
}

//TODO: paste code from step 2.1.2

// onGetCardNonce is triggered when the "Pay $1.00" button is clicked
var onGetCardNonce = function (event) {

    // Don't submit the form until SqPaymentForm returns with a nonce
    event.preventDefault();
    // Request a nonce from the SqPaymentForm object
    paymentForm.requestCardNonce();
}