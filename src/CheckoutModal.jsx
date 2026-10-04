import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Banknote, Check, Clock3, Copy, CreditCard, X } from 'lucide-react';
import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = 'service_spkwoqi';
const BUSINESS_TEMPLATE_ID = 'template_lbcd4ss';
const CUSTOMER_TEMPLATE_ID = 'template_21mkgee';
const EMAILJS_PUBLIC_KEY = 'WcBoR-PXUYJbby5Rl';
const UPI_ID = '8367534497-7@axl';
const PHONE = '918367534497';
const PAYMENT_SECONDS = 8 * 60;

async function dataUrlToFile(dataUrl, fileName) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || 'image/jpeg' });
}

export default function CheckoutModal({
  open,
  onClose,
  customer,
  setCustomer,
  cart,
  total,
  paying,
  onPay,
  generatedConcept,
}) {
  const [step, setStep] = useState('details');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [seconds, setSeconds] = useState(PAYMENT_SECONDS);
  const [transactionReference, setTransactionReference] = useState('');
  const [payerName, setPayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bookingReference, setBookingReference] = useState('');

  const packageDetails = useMemo(
    () => cart.map(item => `${item.n} × ${item.q}`).join(', '),
    [cart]
  );

  useEffect(() => {
    if (!open) return;
    const saved = sessionStorage.getItem('partyPetalsPaymentSession');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.expiresAt > Date.now()) {
        setBookingReference(parsed.bookingReference);
        setSeconds(Math.max(0, Math.ceil((parsed.expiresAt - Date.now()) / 1000)));
        setPaymentMethod('UPI');
        setStep('payment');
      }
    } catch {}
  }, [open]);

  useEffect(() => {
    if (!open || step !== 'payment' || seconds <= 0) return;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [open, step, seconds]);

  const resetAndClose = () => {
    if (paying || submitting) return;
    setStep('details');
    setPaymentMethod('');
    setSeconds(PAYMENT_SECONDS);
    setTransactionReference('');
    setPayerName('');
    setError('');
    onClose();
  };

  const validateDetails = () => {
    const mobile = customer.mobile.replace(/\D/g, '');
    const pincode = customer.pincode.replace(/\D/g, '');
    if (!customer.name.trim()) return 'Please enter your full name.';
    if (mobile.length < 7) return 'Please enter a valid mobile number.';
    if (!customer.occasion?.trim()) return 'Please select the occasion.';
    if (!customer.eventDate) return 'Please select the event date.';
    if (!customer.city.trim()) return 'Please enter the event city.';
    if (pincode.length < 4) return 'Please enter a valid pincode.';
    return '';
  };

  const continueToMethod = event => {
    event.preventDefault();
    const message = validateDetails();
    if (message) {
      setError(message);
      return;
    }
    setError('');
    setStep('method');
  };

  const startUpi = event => {
    event.preventDefault();
    const reference = `PP${Date.now().toString().slice(-8)}`;
    const started = onPay(event, reference);
    if (!started) return;
    const expiresAt = Date.now() + PAYMENT_SECONDS * 1000;
    sessionStorage.setItem(
      'partyPetalsPaymentSession',
      JSON.stringify({ bookingReference: reference, expiresAt })
    );
    setBookingReference(reference);
    setPaymentMethod('UPI');
    setSeconds(PAYMENT_SECONDS);
    setStep('payment');
  };

  const commonParams = (reference, status, transaction = 'Not applicable') => ({
    booking_reference: reference,
    payment_status: status,
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
    transaction_reference: transaction,
    payment_note: [
      `Payment method: ${status}`,
      `Occasion: ${customer.occasion || 'Not provided'}`,
      `Event date: ${customer.eventDate || 'Not provided'}`,
      `Venue: ${customer.venue?.trim() || 'Not provided'}`,
      `Customer idea: ${customer.idea?.trim() || 'Not provided'}`,
    ].join(' | '),
  });

  const buildWhatsAppMessage = (reference, method) => `New Party Petals booking request\n\nBooking Reference: ${reference}\nPayment Method: ${method}\nCustomer: ${customer.name.trim()}\nPhone: ${customer.countryCode} ${customer.mobile.trim()}\nEmail: ${customer.email.trim() || 'Not provided'}\nOccasion: ${customer.occasion}\nEvent Date: ${customer.eventDate}\nCity: ${customer.city.trim()}\nPincode: ${customer.pincode.trim()}\nVenue: ${customer.venue?.trim() || 'Not provided'}\nPackages: ${packageDetails}\nEstimated Total: ₹${total.toLocaleString('en-IN')}\nIdea: ${customer.idea?.trim() || 'Not provided'}${generatedConcept ? '\n\nA generated concept image is included with this share.' : ''}`;

  const shareToWhatsApp = async (message, reference) => {
    if (generatedConcept) {
      try {
        const file = await dataUrlToFile(generatedConcept, `party-petals-${reference}.jpg`);
        if (navigator.canShare?.({ files: [file] }) && navigator.share) {
          await navigator.share({
            title: `Party Petals ${reference}`,
            text: message,
            files: [file],
          });
          return true;
        }

        const download = document.createElement('a');
        download.href = generatedConcept;
        download.download = `party-petals-${reference}.jpg`;
        document.body.appendChild(download);
        download.click();
        download.remove();
        alert('The generated concept image has been downloaded. Attach it in the WhatsApp chat that opens next.');
      } catch (shareError) {
        if (shareError?.name === 'AbortError') return false;
        console.error('Image share failed:', shareError);
      }
    }

    window.open(
      `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
    return true;
  };

  const submitPayAtVenue = async () => {
    setSubmitting(true);
    setError('');
    const reference = `PP${Date.now().toString().slice(-8)}`;
    const params = commonParams(reference, 'Pay at Venue requested');

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        BUSINESS_TEMPLATE_ID,
        params,
        { publicKey: EMAILJS_PUBLIC_KEY }
      );

      const shared = await shareToWhatsApp(
        buildWhatsAppMessage(reference, 'Pay at Venue'),
        reference
      );
      if (!shared) {
        setError('Sharing was cancelled. Select Pay at Venue again when ready.');
        return;
      }

      setBookingReference(reference);
      setPaymentMethod('PAY_AT_VENUE');
      setStep('submitted');
    } catch (submitError) {
      console.error('Pay at Venue submission failed:', submitError);
      setError('The booking request could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitForVerification = async event => {
    event.preventDefault();
    const reference = transactionReference.trim().replace(/\s+/g, '');
    if (reference.length < 8) {
      setError('Enter a valid UPI transaction reference, usually 8 to 20 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    const params = commonParams(
      bookingReference,
      'Submitted for verification',
      reference
    );
    params.payment_note += ` | Payer name: ${payerName.trim() || customer.name.trim()} | Manual verification required.`;

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        BUSINESS_TEMPLATE_ID,
        params,
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
      if (customer.email.trim()) {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          CUSTOMER_TEMPLATE_ID,
          params,
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
      }
      sessionStorage.removeItem('partyPetalsPaymentSession');
      setPaymentMethod('UPI');
      setStep('submitted');
    } catch (submitError) {
      console.error('EmailJS submission failed:', submitError);
      setError('The email could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyUpi = async () => navigator.clipboard?.writeText(UPI_ID);
  const timeText = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="checkoutOverlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetAndClose} />
          <motion.section className="checkoutModal" initial={{ opacity: 0, scale: 0.96, x: '-50%', y: '-47%' }} animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }} exit={{ opacity: 0, scale: 0.96, x: '-50%', y: '-47%' }}>
            <div className="checkoutHead">
              <div>
                <small>EVENT DETAILS & BOOKING</small>
                <h3>
                  {step === 'details' && 'Tell us about your event'}
                  {step === 'method' && 'Choose how you would like to pay'}
                  {step === 'payment' && 'Complete your UPI payment'}
                  {step === 'submitted' && 'Booking request received'}
                </h3>
                <p>
                  {step === 'details' && 'Complete the event information, then choose a payment method.'}
                  {step === 'method' && 'Pay now through UPI or request to pay at the venue.'}
                  {step === 'payment' && 'After payment, submit the UPI transaction reference.'}
                  {step === 'submitted' && 'Keep the booking reference for future communication.'}
                </p>
              </div>
              <button type="button" disabled={paying || submitting} onClick={resetAndClose} aria-label="Close"><X /></button>
            </div>

            <div className="checkoutSummary">
              <div><small>YOUR ORDER</small><span>{packageDetails}</span></div>
              <b>₹{total.toLocaleString('en-IN')}</b>
            </div>

            {step === 'details' && (
              <form className="checkoutForm" onSubmit={continueToMethod}>
                <label className="checkoutFull">FULL NAME *<input required autoComplete="name" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="Enter your full name" /></label>
                <label>COUNTRY CODE *<select value={customer.countryCode} onChange={e => setCustomer({ ...customer, countryCode: e.target.value })}><option value="+91">India +91</option><option value="+971">UAE +971</option><option value="+1">USA +1</option><option value="+44">UK +44</option><option value="+61">Australia +61</option></select></label>
                <label>MOBILE NUMBER *<input required inputMode="numeric" autoComplete="tel" value={customer.mobile} onChange={e => setCustomer({ ...customer, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 15) })} placeholder="Mobile number" /></label>
                <label className="checkoutFull">EMAIL ADDRESS (OPTIONAL)<input type="email" autoComplete="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} placeholder="name@example.com" /></label>
                <label>OCCASION *<select required value={customer.occasion || ''} onChange={e => setCustomer({ ...customer, occasion: e.target.value })}><option value="">Select occasion</option><option>Birthday</option><option>Wedding</option><option>Baby welcome</option><option>Proposal</option><option>Anniversary</option><option>Other</option></select></label>
                <label>EVENT DATE *<input required type="date" value={customer.eventDate || ''} onChange={e => setCustomer({ ...customer, eventDate: e.target.value })} /></label>
                <label>EVENT CITY *<input required value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} placeholder="City" /></label>
                <label>PINCODE *<input required inputMode="numeric" value={customer.pincode} onChange={e => setCustomer({ ...customer, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 8) })} placeholder="Pincode" /></label>
                <label className="checkoutFull">VENUE (OPTIONAL)<input value={customer.venue || ''} onChange={e => setCustomer({ ...customer, venue: e.target.value })} placeholder="Venue or area name" /></label>
                <label className="checkoutFull">YOUR IDEA (OPTIONAL)<textarea value={customer.idea || ''} onChange={e => setCustomer({ ...customer, idea: e.target.value })} placeholder="Theme, colours, special requirements..." /></label>
                {generatedConcept && <div className="conceptAttached checkoutFull"><Check /><span>Your latest Design Studio concept is ready to share with this booking.</span></div>}
                {error && <p className="paymentError checkoutFull">{error}</p>}
                <button type="submit" className="gold checkoutPay checkoutFull">CONTINUE TO PAYMENT OPTIONS <ArrowRight /></button>
              </form>
            )}

            {step === 'method' && (
              <div className="paymentMethodStep">
                <button type="button" className="paymentMethodCard" onClick={startUpi}><CreditCard /><div><b>UPI PAYMENT</b><span>Pay now using PhonePe, Google Pay, Paytm or another UPI app.</span></div><ArrowRight /></button>
                <button type="button" className="paymentMethodCard" onClick={submitPayAtVenue} disabled={submitting}><Banknote /><div><b>PAY AT VENUE</b><span>Send the complete booking request to Party Petals on WhatsApp.</span></div><ArrowRight /></button>
                {error && <p className="paymentError">{error}</p>}
                <button type="button" className="paymentBack" onClick={() => setStep('details')}><ArrowLeft /> BACK TO EVENT DETAILS</button>
              </div>
            )}

            {step === 'payment' && (
              <form className="paymentVerify" onSubmit={submitForVerification}>
                <div className={`paymentTimer ${seconds === 0 ? 'expired' : ''}`}><Clock3 /><div><small>PAYMENT SESSION</small><b>{seconds === 0 ? 'EXPIRED' : timeText}</b></div></div>
                <div className="paymentReference"><small>BOOKING REFERENCE</small><b>{bookingReference}</b></div>
                <div className="upiCopy"><div><small>PAY TO UPI ID</small><b>{UPI_ID}</b></div><button type="button" onClick={copyUpi}><Copy /> COPY</button></div>
                <p className="paymentHelp">Complete the UPI payment, then enter the transaction reference from the payment receipt.</p>
                <label>UPI TRANSACTION REFERENCE *<input required value={transactionReference} onChange={e => setTransactionReference(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24))} placeholder="Example: 430012345678" /></label>
                <label>PAYER NAME (OPTIONAL)<input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder={customer.name || 'Name shown in UPI app'} /></label>
                {error && <p className="paymentError">{error}</p>}
                <button className="gold checkoutPay" disabled={submitting || seconds === 0}>{submitting ? 'SENDING FOR VERIFICATION...' : 'SUBMIT FOR VERIFICATION'} <ArrowRight /></button>
                <button type="button" className="paymentBack" onClick={() => setStep('method')}><ArrowLeft /> CHANGE PAYMENT METHOD</button>
              </form>
            )}

            {step === 'submitted' && (
              <div className="paymentSubmitted">
                <div className="paymentSubmittedIcon"><Check /></div>
                <small>{paymentMethod === 'UPI' ? 'SUBMITTED FOR VERIFICATION' : 'PAY AT VENUE REQUESTED'}</small>
                <h3>{bookingReference}</h3>
                <p>{paymentMethod === 'UPI' ? 'Party Petals received your payment information. Please do not pay again until verification is complete.' : 'Your complete event request was prepared for WhatsApp. Party Petals will contact you to confirm availability and venue payment details.'}</p>
                {paymentMethod === 'UPI' && customer.email.trim() && <p className="paymentEmailNote">An acknowledgement was sent to {customer.email.trim()}.</p>}
                <button type="button" className="gold" onClick={resetAndClose}>DONE</button>
              </div>
            )}
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}
