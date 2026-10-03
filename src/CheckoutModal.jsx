import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Clock3, Copy, X } from 'lucide-react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_spkwoqi';
const BUSINESS_TEMPLATE_ID = 'template_lbcd4ss';
const CUSTOMER_TEMPLATE_ID = 'template_21mkgee';
const EMAILJS_PUBLIC_KEY = 'WcBoR-PXUYJbby5Rl';
const UPI_ID = '8367534497-7@axl';
const PAYMENT_SECONDS = 8 * 60;

export default function CheckoutModal({
  open,
  onClose,
  customer,
  setCustomer,
  cart,
  total,
  paying,
  onPay,
}) {
  const [step, setStep] = useState('details');
  const [seconds, setSeconds] = useState(PAYMENT_SECONDS);
  const [transactionReference, setTransactionReference] = useState('');
  const [payerName, setPayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [bookingReference, setBookingReference] = useState('');

  const packageDetails = useMemo(
    () => cart.map(item => `${item.n} × ${item.q}`).join(', '),
    [cart]
  );

  useEffect(() => {
    if (!open) return;
    const saved = sessionStorage.getItem('partyPetalsPaymentSession');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt > Date.now()) {
          setBookingReference(parsed.bookingReference);
          setSeconds(Math.max(0, Math.ceil((parsed.expiresAt - Date.now()) / 1000)));
          setStep('payment');
        }
      } catch {}
    }
  }, [open]);

  useEffect(() => {
    if (!open || step !== 'payment' || seconds <= 0) return;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [open, step, seconds]);

  const resetAndClose = () => {
    if (paying || submitting) return;
    setStep('details');
    setSeconds(PAYMENT_SECONDS);
    setTransactionReference('');
    setPayerName('');
    setEmailError('');
    onClose();
  };

  const startPayment = event => {
    const reference = `PP${Date.now().toString().slice(-8)}`;
    const started = onPay(event, reference);
    if (!started) return;

    const expiresAt = Date.now() + PAYMENT_SECONDS * 1000;
    sessionStorage.setItem(
      'partyPetalsPaymentSession',
      JSON.stringify({ bookingReference: reference, expiresAt })
    );
    setBookingReference(reference);
    setSeconds(PAYMENT_SECONDS);
    setStep('payment');
  };

  const copyUpi = async () => {
    await navigator.clipboard?.writeText(UPI_ID);
  };

  const submitForVerification = async event => {
    event.preventDefault();
    const reference = transactionReference.trim().replace(/\s+/g, '');
    if (reference.length < 8) {
      setEmailError('Enter a valid UPI transaction reference, usually 8 to 20 characters.');
      return;
    }

    setSubmitting(true);
    setEmailError('');

    const templateParams = {
      booking_reference: bookingReference,
      payment_status: 'Submitted for verification',
      submitted_at: new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      customer_name: customer.name.trim(),
      country_code: customer.countryCode,
      customer_mobile: customer.mobile.trim(),
      customer_email: customer.email.trim() || 'Not provided',
      event_city: customer.city.trim(),
      event_pincode: customer.pincode.trim(),
      package_details: packageDetails,
      total_amount: total.toLocaleString('en-IN'),
      transaction_reference: reference,
      payment_note: `Customer stated that payment was completed. Payer name: ${payerName.trim() || customer.name.trim()}. Manual verification is required.`,
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        BUSINESS_TEMPLATE_ID,
        templateParams,
        { publicKey: EMAILJS_PUBLIC_KEY }
      );

      if (customer.email.trim()) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          CUSTOMER_TEMPLATE_ID,
          templateParams,
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      }

      sessionStorage.removeItem('partyPetalsPaymentSession');
      sessionStorage.setItem(
        'partyPetalsSubmittedPayment',
        JSON.stringify({ bookingReference, transactionReference: reference })
      );
      setStep('submitted');
    } catch (error) {
      console.error('EmailJS submission failed:', error);
      setEmailError('The email could not be sent. Check the EmailJS service and template settings, then try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const timeText = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="checkoutOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={resetAndClose}
          />

          <motion.section
            className="checkoutModal"
            initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-47%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-47%' }}
          >
            <div className="checkoutHead">
              <div>
                <small>SECURE CHECKOUT</small>
                <h3>
                  {step === 'details' && 'Complete your booking details'}
                  {step === 'payment' && 'Complete your UPI payment'}
                  {step === 'submitted' && 'Payment submitted for verification'}
                </h3>
                <p>
                  {step === 'details' && 'Enter contact and event information before continuing to payment.'}
                  {step === 'payment' && 'After payment, return here and submit the UPI transaction reference.'}
                  {step === 'submitted' && 'Party Petals received the details and will verify the transaction.'}
                </p>
              </div>
              <button type="button" disabled={paying || submitting} onClick={resetAndClose} aria-label="Close checkout"><X /></button>
            </div>

            <div className="checkoutSummary">
              <div><small>YOUR ORDER</small><span>{packageDetails}</span></div>
              <b>₹{total.toLocaleString('en-IN')}</b>
            </div>

            {step === 'details' && (
              <form className="checkoutForm" onSubmit={startPayment}>
                <label className="checkoutFull">FULL NAME *<input required autoComplete="name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Enter your full name" /></label>
                <label>COUNTRY CODE *<select value={customer.countryCode} onChange={e => setCustomer({ ...customer, countryCode: e.target.value })}><option value="+91">India +91</option><option value="+971">UAE +971</option><option value="+1">USA +1</option><option value="+44">UK +44</option><option value="+61">Australia +61</option></select></label>
                <label>MOBILE NUMBER *<input required inputMode="numeric" autoComplete="tel" value={customer.mobile} onChange={e => setCustomer({ ...customer, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })} placeholder="Mobile number" /></label>
                <label className="checkoutFull">EMAIL ADDRESS (OPTIONAL)<input type="email" autoComplete="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="name@example.com" /></label>
                <label>EVENT PLANNING IN? *<input required value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} placeholder="City" /></label>
                <label>PINCODE *<input required inputMode="numeric" value={customer.pincode} onChange={e => setCustomer({ ...customer, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 8) })} placeholder="Pincode" /></label>
                <div className="checkoutTrust checkoutFull"><Check /><span>Party Petals never asks for your UPI PIN. Approve payment only inside your trusted UPI application.</span></div>
                <button type="submit" className="gold checkoutPay checkoutFull" disabled={paying}>{paying ? 'PREPARING PAYMENT...' : `PAY ₹${total.toLocaleString('en-IN')}`} <ArrowRight /></button>
              </form>
            )}

            {step === 'payment' && (
              <form className="paymentVerify" onSubmit={submitForVerification}>
                <div className={`paymentTimer ${seconds === 0 ? 'expired' : ''}`}><Clock3 /><div><small>PAYMENT SESSION</small><b>{seconds === 0 ? 'EXPIRED' : timeText}</b></div></div>
                <div className="paymentReference"><small>BOOKING REFERENCE</small><b>{bookingReference}</b></div>
                <div className="upiCopy"><div><small>PAY TO UPI ID</small><b>{UPI_ID}</b></div><button type="button" onClick={copyUpi}><Copy /> COPY</button></div>
                <p className="paymentHelp">Complete the payment in PhonePe, Google Pay, Paytm or another UPI app. Then enter the transaction reference shown in the payment receipt.</p>
                <label>UPI TRANSACTION REFERENCE *<input required value={transactionReference} onChange={e => setTransactionReference(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24))} placeholder="Example: 430012345678" /></label>
                <label>PAYER NAME (OPTIONAL)<input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder={customer.name || 'Name shown in UPI app'} /></label>
                {emailError && <p className="paymentError">{emailError}</p>}
                <button className="gold checkoutPay" disabled={submitting || seconds === 0}>{submitting ? 'SENDING FOR VERIFICATION...' : 'SUBMIT FOR VERIFICATION'} <ArrowRight /></button>
                <button type="button" className="paymentBack" onClick={() => setStep('details')}>CHANGE BOOKING DETAILS</button>
              </form>
            )}

            {step === 'submitted' && (
              <div className="paymentSubmitted">
                <div className="paymentSubmittedIcon"><Check /></div>
                <small>SUBMITTED FOR VERIFICATION</small>
                <h3>{bookingReference}</h3>
                <p>Party Petals received your payment information. Please do not pay again. The booking will be confirmed after manual transaction verification.</p>
                {customer.email.trim() && <p className="paymentEmailNote">An acknowledgement was sent to {customer.email.trim()}.</p>}
                <button type="button" className="gold" onClick={resetAndClose}>DONE</button>
              </div>
            )}
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
