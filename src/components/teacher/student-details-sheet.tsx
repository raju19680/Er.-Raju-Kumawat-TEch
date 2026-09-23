'use client'

import React, { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, RefreshCw, Trash2, MapPin, Mail, Phone, Lock, Calendar, BookOpen, Clock, Activity, Award, User } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface StudentDetailsSheetProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function StudentDetailsSheet({
  studentId,
  open,
  onOpenChange,
  onUpdated,
}: StudentDetailsSheetProps) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<{courses: any[], testSeries: any[], digitalProducts: any[]}>({
    courses: [], testSeries: [], digitalProducts: []
  })

  // State for forms
  const [profileForm, setProfileForm] = useState<any>({})
  const [password, setPassword] = useState('')
  const [newPurchase, setNewPurchase] = useState({ type: '', productId: '' })
  const [assigning, setAssigning] = useState(false)

  const fetchStudent = async () => {
    if (!studentId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/teacher/students/${studentId}`)
      const data = await res.json()
      if (data.success) {
        setStudent(data.student)
        setProfileForm({
          name: data.student.name || '',
          email: data.student.email || '',
          phone: data.student.phone || '',
          address: data.student.address || '',
          city: data.student.city || '',
          state: data.student.state || '',
          pincode: data.student.pincode || '',
        })
      } else {
        toast.error(data.error || 'Failed to load student details')
      }
    } catch (error) {
      toast.error('An error occurred while fetching details')
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    if (!studentId) return
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/purchases`)
      const data = await res.json()
      if (data.success) {
        setAvailableProducts({
          courses: data.courses,
          testSeries: data.testSeries,
          digitalProducts: data.digitalProducts
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (open && studentId) {
      fetchStudent()
      fetchProducts()
      setPassword('')
      setNewPurchase({ type: '', productId: '' })
    }
  }, [open, studentId])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId) return
    try {
      setSaving(true)
      const payload: any = { ...profileForm }
      if (password) payload.password = password

      const res = await fetch(`/api/teacher/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Student profile updated')
        if (password) {
          toast.success('Password changed successfully')
          setPassword('')
        }
        setStudent(data.student)
        onUpdated?.()
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleAssignProduct = async () => {
    if (!newPurchase.type || !newPurchase.productId) {
      toast.error('Please select a product type and product')
      return
    }
    try {
      setAssigning(true)
      const res = await fetch(`/api/teacher/students/${studentId}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPurchase)
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setNewPurchase({ type: '', productId: '' })
        fetchStudent() // refresh data
      } else {
        toast.error(data.error || 'Failed to assign product')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setAssigning(false)
    }
  }

  const handleDeviceAction = async (sessionId: string, action: 'lock' | 'unlock' | 'delete') => {
    try {
      if (action === 'delete') {
        const res = await fetch(`/api/teacher/students/${studentId}/devices?sessionId=${sessionId}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (data.success) {
          toast.success(data.message)
          fetchStudent()
        } else {
          toast.error(data.error)
        }
      } else {
        const res = await fetch(`/api/teacher/students/${studentId}/devices`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, isActive: action === 'unlock' })
        })
        const data = await res.json()
        if (data.success) {
          toast.success(data.message)
          fetchStudent()
        } else {
          toast.error(data.error)
        }
      }
    } catch (e) {
      toast.error('Action failed')
    }
  }

  if (!open) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-gray-50 p-0 sm:p-6 sm:bg-white flex flex-col h-full border-l shadow-2xl">
        <SheetHeader className="p-6 sm:p-0 border-b pb-4 mb-4">
          <SheetTitle className="text-2xl font-bold">Student Details</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="size-6 animate-spin text-amber-600" />
          </div>
        ) : student ? (
          <div className="flex-1 overflow-y-auto px-4 sm:px-0">
            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-xl border shadow-sm">
              <div className="size-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-2xl">
                {student.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold">{student.name}</h3>
                <p className="text-sm text-gray-500">{student.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant={student.isActive ? 'default' : 'secondary'} className={student.isActive ? 'bg-green-100 text-green-700' : ''}>
                    {student.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {student.isBlocked && (
                    <Badge variant="destructive">Blocked</Badge>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full grid grid-cols-4 mb-6 bg-gray-100/50 p-1">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6 animate-in fade-in-50 duration-300">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                      <User className="size-4" /> Personal Info
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label>Name</Label>
                        <Input value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label>Phone</Label>
                        <Input value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label>Email</Label>
                        <Input type="email" value={profileForm.email} onChange={e => setProfileForm({...profileForm, email: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                    <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                      <MapPin className="size-4" /> Address Details
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label>Address</Label>
                        <Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label>City</Label>
                          <Input value={profileForm.city} onChange={e => setProfileForm({...profileForm, city: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label>State</Label>
                          <Input value={profileForm.state} onChange={e => setProfileForm({...profileForm, state: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <Label>Pincode</Label>
                          <Input value={profileForm.pincode} onChange={e => setProfileForm({...profileForm, pincode: e.target.value})} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700">
                    {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </form>
              </TabsContent>

              {/* Purchases Tab */}
              <TabsContent value="purchases" className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <Plus className="size-4" /> Add New Purchase
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Product Type</Label>
                      <Select 
                        value={newPurchase.type} 
                        onValueChange={v => setNewPurchase({ type: v, productId: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COURSE">Course</SelectItem>
                          <SelectItem value="TEST_SERIES">Test Series</SelectItem>
                          <SelectItem value="DIGITAL_PRODUCT">Digital Product</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Select Product</Label>
                      <Select 
                        value={newPurchase.productId} 
                        onValueChange={v => setNewPurchase(prev => ({...prev, productId: v}))}
                        disabled={!newPurchase.type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {newPurchase.type === 'COURSE' && availableProducts.courses.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title} (₹{c.price})</SelectItem>
                          ))}
                          {newPurchase.type === 'TEST_SERIES' && availableProducts.testSeries.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title} (₹{c.price})</SelectItem>
                          ))}
                          {newPurchase.type === 'DIGITAL_PRODUCT' && availableProducts.digitalProducts.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title} (₹{c.price})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAssignProduct} disabled={assigning || !newPurchase.productId} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    {assigning && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Assign to Student (Free)
                  </Button>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <BookOpen className="size-4" /> Current Purchases
                  </h4>
                  
                  {student.purchasedCourses?.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-500">Courses</h5>
                      {student.purchasedCourses.map((pc: any) => (
                        <div key={pc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-sm">{pc.course.title}</span>
                          <span className="text-xs text-gray-400">{format(new Date(pc.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {student.purchasedTestSeries?.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Test Series</h5>
                      {student.purchasedTestSeries.map((pc: any) => (
                        <div key={pc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-sm">{pc.testSeries.title}</span>
                          <span className="text-xs text-gray-400">{format(new Date(pc.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {student.purchasedDigitalProducts?.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h5 className="text-sm font-medium text-gray-500">Digital Products</h5>
                      {student.purchasedDigitalProducts.map((pc: any) => (
                        <div key={pc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-sm">{pc.digitalProduct.title}</span>
                          <span className="text-xs text-gray-400">{format(new Date(pc.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(student.purchasedCourses?.length === 0 && student.purchasedTestSeries?.length === 0 && student.purchasedDigitalProducts?.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No purchases yet.</p>
                  )}
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center gap-2">
                    <div className="size-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Joined On</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{format(new Date(student.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center gap-2">
                    <div className="size-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <Award className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Test Attempts</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{student._count?.testAttempts || 0}</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center gap-2 col-span-2 sm:col-span-1">
                    <div className="size-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
                      <Activity className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Current Streak</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{student.streak?.currentStreak || 0} days</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center gap-2 col-span-2 sm:col-span-1">
                    <div className="size-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Total Purchases</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{student._count?.orders || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <Activity className="size-4" /> Recent Orders
                  </h4>
                  {student.orders?.length > 0 ? (
                    <div className="space-y-3">
                      {student.orders.map((o: any) => (
                        <div key={o.id} className="flex justify-between items-center p-3 border rounded-lg text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">Order #{o.id.slice(-6).toUpperCase()}</span>
                            <span className="text-xs text-gray-500">{format(new Date(o.createdAt), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600">₹{o.amount}</span>
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                              {o.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No recent orders.</p>
                  )}
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-red-200 pb-2">
                    <h4 className="font-semibold text-red-900 flex items-center gap-2">
                      <Lock className="size-4" /> Change Password
                    </h4>
                    <Button size="sm" variant="destructive" onClick={handleUpdateProfile} disabled={saving || !password}>
                      {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                      Update Password
                    </Button>
                  </div>
                  <p className="text-sm text-red-600">Enter a new password to instantly change this student's login credentials.</p>
                  <div className="space-y-1">
                    <Label className="text-red-900">New Password</Label>
                    <Input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      placeholder="Enter new password"
                      className="border-red-200 focus-visible:ring-red-400 bg-white"
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <Activity className="size-4" /> Active Device Sessions
                  </h4>
                  <p className="text-sm text-gray-500">Manage where the student is logged in. You can lock or revoke access from devices.</p>
                  
                  {student.deviceSessions?.length > 0 ? (
                    <div className="space-y-3">
                      {student.deviceSessions.map((ds: any) => (
                        <div key={ds.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg text-sm bg-gray-50 gap-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{ds.deviceType.toUpperCase()} - {ds.os || 'Unknown OS'}</span>
                              <Badge variant={ds.isActive ? 'default' : 'secondary'} className={ds.isActive ? 'bg-green-100 text-green-700' : ''}>
                                {ds.isActive ? 'Active' : 'Locked'}
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-500 mt-1">Browser: {ds.browser || 'Unknown'} | IP: {ds.ipAddress || 'Unknown'}</span>
                            <span className="text-xs text-gray-400">Last Active: {format(new Date(ds.lastActive), 'MMM d, yyyy h:mm a')}</span>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            {ds.isActive ? (
                              <Button size="sm" variant="outline" className="w-full sm:w-auto text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200" onClick={() => handleDeviceAction(ds.id, 'lock')}>
                                Lock Device
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" className="w-full sm:w-auto text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleDeviceAction(ds.id, 'unlock')}>
                                Unlock
                              </Button>
                            )}
                            <Button size="sm" variant="destructive" className="w-full sm:w-auto" onClick={() => handleDeviceAction(ds.id, 'delete')}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No active devices found.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-gray-500">
            Student not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
