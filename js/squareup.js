var paymentForm = null;

var initPaymentForm = function (){
    var idempotency_key = uuidv4();
    model.paymentSuccess = false;
    model.modalError = '';

// Create and initialize a payment form object
    paymentForm = new SqPaymentForm({
        // Initialize the payment form elements

        // applicationId: "REPLACE_WITH_APPLICATION_ID";
        // applicationId: "sandbox-sq0idb-ZaOa3uAuhkRfgVmR2xHQyA", // SANDBOX
        applicationId: "sq0idp-sO7EOg5ctbH8jq-X_o6ytw", //LIVE
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
                squarePayment(nonce,idempotency_key);
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