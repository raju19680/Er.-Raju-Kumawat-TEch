'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Receipt,
  FileText,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Printer,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OrderItem {
  itemId: string
  itemType: string
  title: string
  price: number
  mrp?: number
}

interface OrderData {
  id: string
  items: OrderItem[]
  totalAmount: number
  discountAmount: number
  finalAmount: number
  status: string
  couponCode: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  createdAt: string
  payments: Array<{
    id: string
    amount: number
    method: string | null
    status: string
    transactionId: string | null
    createdAt: string
  }>
  organization?: {
    id: string
    name: string
    code: string
    logo: string | null
  }
}

export default function StudentOrders() {
  const { setStudentPage, userName, userEmail } = useAppStore()
  const [orders, setOrders] = useState<OrderData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<OrderData | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetchJSON<{ success: boolean; orders: OrderData[] }>('/api/student/orders')
      if (res.success) {
        setOrders(res.orders)
      }
    } catch (err) {
      console.error('Student orders load error:', err)
      setError('Failed to load your transaction history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-semibold text-xs gap-1">
            <CheckCircle2 className="size-3" /> Paid / Completed
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-semibold text-xs gap-1">
            <Clock className="size-3" /> Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-semibold text-xs gap-1">
            <AlertCircle className="size-3" /> Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders & Invoices</h1>
          <p className="text-gray-500 text-sm mt-1">Review your payment history and download invoice receipts</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-md mb-3">
            <Receipt className="size-3.5 text-indigo-300" />
            <span>Secure Billing Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Order & Payment History
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            All your course enrollments, mock test purchases, notes subscriptions, and payment receipts in one secure place.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <CreditCard className="size-64 text-white" />
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <ShoppingBag className="size-12 mx-auto mb-3 text-gray-300" />
          <h3 className="text-lg font-bold text-gray-900">No Orders Placed Yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            When you purchase courses, test series, or study notes, your invoices and receipts will appear here.
          </p>
          <Button
            className="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold gap-1.5"
            onClick={() => setStudentPage('store')}
          >
            <ShoppingBag className="size-3.5" /> Explore Store Catalog
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {orders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 bg-white overflow-hidden py-0">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-gray-500">
                            #{order.id.slice(-8).toUpperCase()}
                          </span>
                          {getStatusBadge(order.status)}
                          <span className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-xs font-semibold gap-1.5 hover:bg-gray-50 border-gray-200"
                          onClick={() => setSelectedInvoice(order)}
                        >
                          <Receipt className="size-3.5 text-gray-500" /> View Invoice
                        </Button>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        {order.items.length > 0 ? (
                          order.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span className="font-semibold text-sm text-gray-800">
                                {item.title}
                              </span>
                              <Badge variant="secondary" className="text-xs uppercase font-semibold">
                                {item.itemType?.replace('_', ' ')}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <span className="text-sm font-medium text-gray-700">Digital Learning Package</span>
                        )}

                        {order.razorpayPaymentId && (
                          <p className="text-xs text-gray-400 font-mono mt-1">
                            Payment ID: {order.razorpayPaymentId}
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:border-l sm:border-gray-100 sm:pl-6">
                        <p className="text-xs text-gray-400 font-medium">Total Paid</p>
                        <p className="text-xl font-extrabold text-gray-900">
                          {order.finalAmount === 0 ? 'FREE' : `₹${order.finalAmount}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-lg bg-white rounded-3xl p-6 sm:p-8">
            <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Receipt className="size-5 text-indigo-600" />
                Tax Invoice / Receipt
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-4 text-sm" id="printable-invoice">
              {/* Org & Order Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    {selectedInvoice.organization?.name || 'Er. Raju Kumawat Classes'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Online Educational Platform</p>
                  <p className="text-xs text-gray-500">GST: 08AAACR0000A1Z5</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-xs">
                    PAID
                  </Badge>
                  <p className="font-mono text-xs text-gray-500 mt-1">
                    #{selectedInvoice.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-1 text-xs">
                <p className="font-bold text-gray-700">Billed To:</p>
                <p className="text-gray-900 font-semibold">{userName || 'Student'}</p>
                <p className="text-gray-500">{userEmail || 'N/A'}</p>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 border-b pb-2">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                {selectedInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs py-1">
                    <span className="font-semibold text-gray-800">{item.title}</span>
                    <span className="font-mono text-gray-900">₹{item.price}</span>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="border-t pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{selectedInvoice.totalAmount}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount applied</span>
                    <span className="font-mono">-₹{selectedInvoice.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-900 border-t pt-2">
                  <span>Total Amount Paid</span>
                  <span className="font-mono">₹{selectedInvoice.finalAmount}</span>
                </div>
              </div>

              {/* Payment Details */}
              {selectedInvoice.razorpayPaymentId && (
                <div className="text-xs text-gray-400 bg-slate-50 p-3 rounded-xl space-y-0.5 font-mono">
                  <p>Razorpay ID: {selectedInvoice.razorpayPaymentId}</p>
                  <p>Order Ref: {selectedInvoice.razorpayOrderId || 'N/A'}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                <Printer className="size-3.5" /> Print / Save PDF
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
