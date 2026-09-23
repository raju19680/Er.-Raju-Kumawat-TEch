'use client'

import React, { useState, useCallback } from 'react'
import {
  X,
  Tag,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Info,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
interface CheckoutItem {
  id: string
  type: 'test_series' | 'course' | 'digital_product'
  title: string
  price: number
  mrp: number
  thumbnail?: string | null
}

interface CouponValidation {
  valid: boolean
  discount: number
  discountType: string
  message: string
}

interface PaymentCheckoutProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CheckoutItem | null
  orgCode: string
  onSuccess?: (paymentData: any) => void
  onFailure?: (error: string) => void
}

// ── Payment State Machine ────────────────────────────────────────────────────
type PaymentStep = 'review' | 'paying' | 'success' | 'failure'

// ── Helper ───────────────────────────────────────────────────────────────────
function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// ── Component ────────────────────────────────────────────────────────────────
export default function PaymentCheckout({
  open,
  onOpenChange,
  item,
  orgCode,
  onSuccess,
  onFailure,
}: PaymentCheckoutProps) {
  const [step, setStep] = useState<PaymentStep>('review')
  const [contactNumber, setContactNumber] = useState("")
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponResult, setCouponResult] = useState<CouponValidation | null>(null)
  const [paying, setPaying] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const { userName, userEmail } = useAppStore()

  // ── Calculate discount ──
  const discountAmount = React.useMemo(() => {
    if (!couponResult?.valid || !item) return 0
    if (couponResult.discountType === 'percentage') {
      return parseFloat((item.price * (couponResult.discount / 100)).toFixed(2))
    }
    return Math.min(couponResult.discount, item.price)
  }, [couponResult, item])

  const finalAmount = item ? Math.max(item.price - discountAmount, 1) : 0
  const savingsFromMRP = item ? item.mrp - finalAmount : 0
  const discountPct = item && item.mrp > 0 ? Math.round(((item.mrp - finalAmount) / item.mrp) * 100) : 0

  // ── Reset state on close ──
  const handleClose = useCallback(() => {
    setStep('review')
    setCouponCode('')
    setCouponResult(null)
    setCouponLoading(false)
    setPaying(false)
    setErrorMessage('')
    setPaymentData(null)
    onOpenChange(false)
  }, [onOpenChange])

  // ── Validate coupon ──
  const handleValidateCoupon = useCallback(async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponResult(null)
    try {
      const res = await apiFetch('/api/payments/validate-coupon', {
        method: 'POST',
        body: JSON.stringify({ code: couponCode.trim(), orgCode }),
      })
      const data = await res.json()
      setCouponResult(data)
    } catch {
      setCouponResult({ valid: false, discount: 0, discountType: '', message: 'Failed to validate coupon' })
    } finally {
      setCouponLoading(false)
    }
  }, [couponCode, orgCode])

  // ── Remove coupon ──
  const handleRemoveCoupon = useCallback(() => {
    setCouponCode('')
    setCouponResult(null)
  }, [])

  // ── Load Razorpay script ──
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }, [])

  // ── Process payment ──
  const handlePay = useCallback(async () => {
    if (!item || !orgCode) return
    if (item.price && item.price > 0 && (!contactNumber || contactNumber.length < 10)) {
      setErrorMessage("Please enter a valid mobile number to proceed.")
      return
    }
    setPaying(true)
    setStep('paying')
    setErrorMessage('')

    try {
      // 1. Create order on server
      const orderRes = await apiFetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: item.price,
          orgCode,
          itemType: item.type,
          itemId: item.id,
          couponCode: couponResult?.valid ? couponCode.trim() : undefined,
        }),
      })

      const orderData = await orderRes.json()
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order')
      }

      const order = orderData.order

      // 2. If demo mode, simulate payment
      if (order.isDemo) {
        setIsDemoMode(true)
        // Simulate a short delay then verify
        await new Promise((r) => setTimeout(r, 1500))

        const verifyRes = await apiFetch('/api/payments/verify', {
          method: 'POST',
          body: JSON.stringify({
            razorpay_order_id: order.orderId,
            razorpay_payment_id: `pay_demo_${Date.now()}`,
            razorpay_signature: 'demo_signature',
          }),
        })

        const verifyData = await verifyRes.json()
        if (verifyData.success) {
          setPaymentData(verifyData.payment)
          setStep('success')
          onSuccess?.(verifyData.payment)
        } else {
          throw new Error(verifyData.message || 'Payment verification failed')
        }
        setPaying(false)
        return
      }

      // 3. Real Razorpay checkout
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway. Please try again.')
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'Er. Raju Kumawat Tech',
        description: item.title,
        order_id: order.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiFetch('/api/payments/verify', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              setPaymentData(verifyData.payment)
              setStep('success')
              onSuccess?.(verifyData.payment)
            } else {
              setErrorMessage(verifyData.message || 'Payment verification failed')
              setStep('failure')
              onFailure?.(verifyData.message)
            }
          } catch (err: any) {
            setErrorMessage(err.message || 'Payment verification failed')
            setStep('failure')
            onFailure?.(err.message)
          } finally {
            setPaying(false)
          }
        },
        prefill: {
          name: userName || '',
          email: userEmail || '',
          contact: contactNumber,
        },
        theme: {
          color: '#D97706',
        },
        modal: {
          ondismiss: function () {
            setStep('review')
            setPaying(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        setErrorMessage(response.error.description || 'Payment failed')
        setStep('failure')
        setPaying(false)
        onFailure?.(response.error.description)
      })
      rzp.open()
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong')
      setStep('failure')
      onFailure?.(err.message)
    } finally {
      setPaying(false)
    }
  }, [item, orgCode, couponCode, couponResult, userName, userEmail, loadRazorpayScript, onSuccess, onFailure])

  if (!item) return null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="size-5 text-amber-600" />
            Checkout
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Complete your purchase securely
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Review Step ── */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                {/* Item Card */}
                <div className="flex gap-4 p-4 rounded-xl bg-gray-50 border">
                  <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shrink-0">
                    {item.type === 'test_series' ? (
                      <ClipboardListIcon className="size-7" />
                    ) : item.type === 'digital_product' ? (
                      <PackageIcon className="size-7" />
                    ) : (
                      <BookOpenIcon className="size-7" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="text-xs mb-1">
                      {item.type === 'test_series' ? 'Test Series' : item.type === 'digital_product' ? 'Digital Product' : 'Course'}
                    </Badge>
                    <h3 className="font-semibold text-sm text-foreground line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">Price Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MRP</span>
                      <span className="line-through text-muted-foreground">{formatINR(item.mrp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Selling Price</span>
                      <span className="text-foreground">{formatINR(item.price)}</span>
                    </div>
                    {item.mrp > item.price && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-{formatINR(item.mrp - item.price)}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span className="flex items-center gap-1">
                          Coupon ({couponCode.toUpperCase()})
                          <button onClick={handleRemoveCoupon} className="hover:text-red-500 transition-colors">
                            <Trash2 className="size-3" />
                          </button>
                        </span>
                        <span>-{formatINR(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg">{formatINR(finalAmount)}</span>
                  </div>
                  {savingsFromMRP > 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
                      <Sparkles className="size-4 shrink-0" />
                      <span>You save {formatINR(savingsFromMRP)} ({discountPct}% off)</span>
                    </div>
                  )}
                </div>

                {/* Coupon Input */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Tag className="size-4 text-amber-600" />
                    Apply Coupon
                  </h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase())
                        if (couponResult) setCouponResult(null)
                      }}
                      className="flex-1 uppercase"
                      onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                    />
                    <Button
                      variant="outline"
                      onClick={handleValidateCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="shrink-0"
                    >
                      {couponLoading ? <Loader2 className="size-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                  {couponResult && (
                    <div
                      className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                        couponResult.valid
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {couponResult.valid ? (
                        <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="size-4 shrink-0 mt-0.5" />
                      )}
                      <span>{couponResult.message}</span>
                    </div>
                  )}
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-sky-50 text-sky-700 text-xs">
                  <ShieldCheck className="size-4 shrink-0" />
                  <span>Payments are secured with 256-bit SSL encryption</span>
                </div>
              </motion.div>
            )}

            {/* ── Paying Step ── */}
            {step === 'paying' && (
              <motion.div
                key="paying"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center justify-center p-12 gap-4 min-h-80"
              >
                <div className="relative">
                  <div className="size-20 rounded-full bg-amber-100 flex items-center justify-center">
                    <CreditCard className="size-8 text-amber-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-white shadow-md flex items-center justify-center">
                    <Loader2 className="size-4 animate-spin text-amber-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Processing Payment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isDemoMode
                      ? 'Demo mode — simulating payment...'
                      : 'Please complete the payment in the popup...'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Success Step ── */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center p-8 gap-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="size-24 rounded-full bg-emerald-100 flex items-center justify-center"
                >
                  <CheckCircle2 className="size-12 text-emerald-600" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your purchase has been confirmed
                  </p>
                </div>

                {/* Payment Summary */}
                {paymentData && (
                  <div className="w-full p-4 rounded-xl bg-gray-50 border space-y-3">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-semibold">{formatINR(paymentData.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment ID</span>
                        <span className="font-mono text-xs">{paymentData.razorpayPaymentId?.slice(0, 20)}...</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 text-xs">
                          Confirmed
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 p-3 rounded-lg bg-sky-50 text-sky-700 text-xs w-full">
                  <Info className="size-4 shrink-0" />
                  <span>You can now access this {item.type === 'test_series' ? 'test series' : item.type === 'digital_product' ? 'digital product' : 'course'} from your {item.type === 'digital_product' ? 'library' : 'dashboard'}.</span>
                </div>

                <Button
                  onClick={handleClose}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* ── Failure Step ── */}
            {step === 'failure' && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center p-8 gap-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="size-24 rounded-full bg-red-100 flex items-center justify-center"
                >
                  <XCircle className="size-12 text-red-500" />
                </motion.div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Payment Failed</h3>
                  <p className="text-sm text-muted-foreground">
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>
                </div>
                <div className="flex gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('review')
                      setErrorMessage('')
                    }}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    Try Again
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer — only on review step */}
        {step === 'review' && (
          <div className="p-6 pt-4 border-t bg-white space-y-4">
            {item.type !== "test_series" && !item.price ? null : (
              <div className="space-y-2">
                <label htmlFor="contact" className="text-sm font-medium">Mobile Number <span className="text-red-500">*</span></label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  required
                />
              </div>
            )}
            <Button
              onClick={handlePay}
              disabled={paying}
              className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-base gap-2"
            >
              {paying ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="size-5" />
                  Pay {formatINR(finalAmount)}
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ── Mini Icon Components ─────────────────────────────────────────────────────
function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}
