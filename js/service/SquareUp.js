import uuidv4 from 'https://cdn.jsdelivr.net/npm/uuid@8.3.2/dist/esm-browser/v4.js';

export default class SquareUp {
    constructor(model,i18n) {

        this.qualifier = '@alt-html/year-planner/SquareUp'
        this.logger = null;
        this.model = model;
        this.i18n = i18n;
        this.paymentForm = null;

        // applicationId: "REPLACE_WITH_APPLICATION_ID";
        // applicationId: "sandbox-sq0idb-ZaOa3uAuhkRfgVmR2xHQyA", // SANDBOX

        this.applicationId = "sq0idp-sO7EOg5ctbH8jq-X_o6ytw";
        window.onGetCardNonce = SquareUp.prototype.onGetCardNonce;
    }

    initPaymentForm (){
        var idempotency_key = uuidv4();
        this.model.paymentSuccess = false;
        this.model.modalError = '';

        // Create and initialize a payment form object
        window.paymentForm = new SqPaymentForm({
            // Initialize the payment form elements

             applicationId: this.applicationId, //LIVE
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
                placeholder: this.i18n.global.t('label.cardnumber')
            },
            cvv: {
                elementId: 'sq-cvv',
                placeholder: this.i18n.global.t('label.cvv')
            },
            expirationDate: {
                elementId: 'sq-expiration-date',
                placeholder: this.i18n.global.t('label.mmyy')
            },
            postalCode: {
                elementId: 'sq-postal-code',
                placeholder: this.i18n.global.t('label.postalcode')
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
                        this.logger?.error('Encountered errors:');
                        errors.forEach(function (error) {
                            this.logger?.error('  ' + JSON.stringify(error));
                        });
                        return;
                    }


                    this.logger?.debug(`SquareUp generated nonce is:${nonce}`);
                    this.logger?.debug(`SquareUp generated nonce is:${idempotency_key}`);
                    window.squarePayment(nonce,idempotency_key);
                }
            }
        });
        this.paymentForm.build();
    }

    onGetCardNonce (event) {

        // Don't submit the form until SqPaymentForm returns with a nonce
        event.preventDefault();
        // Request a nonce from the SqPaymentForm object
        this.paymentForm.requestCardNonce();
    }
}

