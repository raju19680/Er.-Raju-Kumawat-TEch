import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Tag, Megaphone, Trash2, Edit2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("coupons");

  // Coupons State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    id: '', code: '', type: 'percentage', value: 0, maxUsage: 0, 
    validFrom: '', validUntil: '', applicableTo: 'all', isActive: true
  });

  // Announcements State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isAnnDialogOpen, setIsAnnDialogOpen] = useState(false);
  const [annForm, setAnnForm] = useState({
    id: '', title: '', message: '', type: 'info', isActive: true
  });

  // Load from local storage on mount
  useEffect(() => {
    const savedCoupons = localStorage.getItem('mock_coupons');
    const savedAnns = localStorage.getItem('mock_announcements');
    
    if (savedCoupons) setCoupons(JSON.parse(savedCoupons));
    else setCoupons([
      { id: '1', code: 'WELCOME50', type: 'percentage', value: 50, maxUsage: 100, usageCount: 42, validFrom: '2024-01-01', validUntil: '2024-12-31', applicableTo: 'all', isActive: true }
    ]);

    if (savedAnns) setAnnouncements(JSON.parse(savedAnns));
    else setAnnouncements([
      { id: '1', title: 'System Maintenance', message: 'Platform will be down for 2 hours on Sunday.', type: 'warning', isActive: true, createdAt: new Date().toISOString() }
    ]);
  }, []);

  // Save to local storage when state changes
  useEffect(() => {
    localStorage.setItem('mock_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('mock_announcements', JSON.stringify(announcements));
  }, [announcements]);

  const generateRandomCode = () => {
    const code = 'SAVE' + Math.random().toString(36).substring(2, 8).toUpperCase();
    setCouponForm(prev => ({ ...prev, code }));
  };

  const saveCoupon = () => {
    if (!couponForm.code || !couponForm.value) {
      toast.error('Code and Value are required');
      return;
    }
    
    if (couponForm.id) {
      setCoupons(prev => prev.map(c => c.id === couponForm.id ? { ...couponForm, usageCount: c.usageCount } : c));
      toast.success('Coupon updated');
    } else {
      setCoupons(prev => [{ ...couponForm, id: Date.now().toString(), usageCount: 0 }, ...prev]);
      toast.success('Coupon created');
    }
    setIsCouponDialogOpen(false);
  };

  const deleteCoupon = (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    }
  };

  const saveAnnouncement = () => {
    if (!annForm.title || !annForm.message) {
      toast.error('Title and Message are required');
      return;
    }
    
    if (annForm.id) {
      setAnnouncements(prev => prev.map(a => a.id === annForm.id ? { ...annForm, createdAt: a.createdAt } : a));
      toast.success('Announcement updated');
    } else {
      setAnnouncements(prev => [{ ...annForm, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...prev]);
      toast.success('Announcement created');
    }
    setIsAnnDialogOpen(false);
  };

  const deleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing & Promotions</h1>
        <p className="text-muted-foreground mt-1">Manage discount coupons and global announcements.</p>
        <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm border border-amber-200">
          <AlertCircle className="w-4 h-4" />
          <span>Note: Data is currently managed in local state. Full backend API integration is coming soon.</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Tag className="w-4 h-4" /> Coupons
          </TabsTrigger>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Announcements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="m-0 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Coupons</h2>
            <Button onClick={() => {
              setCouponForm({ id: '', code: '', type: 'percentage', value: 0, maxUsage: 0, validFrom: new Date().toISOString().split('T')[0], validUntil: '', applicableTo: 'all', isActive: true });
              setIsCouponDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" /> New Coupon
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map(coupon => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`}
                      <div className="text-xs text-muted-foreground">{coupon.applicableTo}</div>
                    </TableCell>
                    <TableCell>
                      {coupon.usageCount} / {coupon.maxUsage || '∞'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(coupon.validFrom).toLocaleDateString()}
                      {coupon.validUntil ? ` - ${new Date(coupon.validUntil).toLocaleDateString()}` : ' onwards'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'} className={coupon.isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                        {coupon.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setCouponForm(coupon); setIsCouponDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => deleteCoupon(coupon.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {coupons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No coupons created yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="m-0 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Global Announcements</h2>
            <Button onClick={() => {
              setAnnForm({ id: '', title: '', message: '', type: 'info', isActive: true });
              setIsAnnDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" /> New Announcement
            </Button>
          </div>

          <div className="grid gap-4">
            {announcements.map(ann => (
              <Card key={ann.id} className={!ann.isActive ? 'opacity-60' : ''}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant={ann.type === 'warning' ? 'destructive' : ann.type === 'success' ? 'default' : 'secondary'}>
                        {ann.type}
                      </Badge>
                      {ann.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{new Date(ann.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={ann.isActive} 
                      onCheckedChange={(c) => {
                        setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isActive: c } : a));
                      }} 
                    />
                    <Button variant="ghost" size="icon" onClick={() => { setAnnForm(ann); setIsAnnDialogOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteAnnouncement(ann.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{ann.message}</p>
                </CardContent>
              </Card>
            ))}
            {announcements.length === 0 && (
              <div className="text-center py-12 text-muted-foreground border rounded-lg bg-slate-50">
                No announcements to display
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Coupon Dialog */}
      <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{couponForm.id ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Code</label>
              <div className="col-span-3 flex gap-2">
                <Input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} />
                <Button variant="outline" onClick={generateRandomCode}>Generate</Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Type</label>
              <Select value={couponForm.type} onValueChange={(v) => setCouponForm({...couponForm, type: v})}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Value</label>
              <Input type="number" className="col-span-3" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: Number(e.target.value)})} />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Max Usage</label>
              <Input type="number" className="col-span-3" value={couponForm.maxUsage} onChange={e => setCouponForm({...couponForm, maxUsage: Number(e.target.value)})} placeholder="0 for unlimited" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Valid From</label>
                <Input type="date" value={couponForm.validFrom} onChange={e => setCouponForm({...couponForm, validFrom: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Valid Until (Optional)</label>
                <Input type="date" value={couponForm.validUntil} onChange={e => setCouponForm({...couponForm, validUntil: e.target.value})} />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm font-medium">Applies To</label>
              <Select value={couponForm.applicableTo} onValueChange={(v) => setCouponForm({...couponForm, applicableTo: v})}>
                <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="courses">Courses Only</SelectItem>
                  <SelectItem value="tests">Test Series Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch checked={couponForm.isActive} onCheckedChange={(v) => setCouponForm({...couponForm, isActive: v})} id="active-coupon" />
              <label htmlFor="active-coupon" className="text-sm font-medium">Is Active</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCouponDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCoupon}>Save Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Announcement Dialog */}
      <Dialog open={isAnnDialogOpen} onOpenChange={setIsAnnDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{annForm.id ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={annForm.title} onChange={e => setAnnForm({...annForm, title: e.target.value})} placeholder="Announcement title..." />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea value={annForm.message} onChange={e => setAnnForm({...annForm, message: e.target.value})} placeholder="Detailed message..." rows={4} />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select value={annForm.type} onValueChange={(v) => setAnnForm({...annForm, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information (Blue)</SelectItem>
                  <SelectItem value="success">Success (Green)</SelectItem>
                  <SelectItem value="warning">Warning/Alert (Red)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <Switch checked={annForm.isActive} onCheckedChange={(v) => setAnnForm({...annForm, isActive: v})} id="active-ann" />
              <label htmlFor="active-ann" className="text-sm font-medium">Publish Immediately</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAnnDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveAnnouncement}>Save Announcement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
