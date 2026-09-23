import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { AlertCircle, IndianRupee, ShoppingCart, Users, UserCheck, UserPlus, BookOpen, Award, Search, Activity, RefreshCw } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales");
  const [period, setPeriod] = useState("last_30_days");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab, period]);

  useEffect(() => {
    setSearchQuery(""); // Reset search on tab change
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/teacher/reports?tab=${activeTab}&period=${period}`);
      if (!response.ok) throw new Error("Failed to fetch report data");
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching reports.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const renderSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl w-full" />
      <Skeleton className="h-96 rounded-xl w-full" />
    </div>
  );

  const renderError = () => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-red-600">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">{error}</p>
        <button onClick={fetchData} className="mt-4 flex items-center text-sm hover:underline">
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </button>
      </CardContent>
    </Card>
  );

  const renderSalesTab = () => {
    if (!data) return null;
    const { totalRevenue = 0, avgOrderValue = 0, totalOrders = 0, monthlyRevenue = [], topSeries = [], recentOrders = [] } = data;
    
    const maxRev = Math.max(...monthlyRevenue.map((m: any) => m.revenue), 1);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              <Activity className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-64 mt-4">
              {monthlyRevenue.map((m: any, i: number) => {
                const heightPercent = `${(m.revenue / maxRev) * 100}%`;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="w-full bg-blue-100 rounded-t-md relative flex items-end justify-center">
                      <div 
                        className="w-full bg-blue-600 rounded-t-md transition-all duration-500"
                        style={{ height: heightPercent }}
                      ></div>
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded">
                        {formatCurrency(m.revenue)}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Series</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSeries.map((series: any) => (
                    <TableRow key={series.id}>
                      <TableCell className="font-medium">{series.title}</TableCell>
                      <TableCell className="text-right">{formatCurrency(series.revenue)}</TableCell>
                      <TableCell className="text-right">{series.orders}</TableCell>
                    </TableRow>
                  ))}
                  {topSeries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No data available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.studentName}</div>
                        <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.finalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No recent orders</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => {
    if (!data) return null;
    const { stats = {}, orders = [] } = data;
    
    const filteredOrders = orders.filter((o: any) => 
      o.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
              <div className="text-2xl font-bold mt-1">{stats.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-emerald-600">Completed</div>
              <div className="text-2xl font-bold mt-1">{stats.completed || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-amber-600">Pending</div>
              <div className="text-2xl font-bold mt-1">{stats.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-red-600">Failed</div>
              <div className="text-2xl font-bold mt-1">{stats.failed || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order History</CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search orders..." 
                className="pl-9" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID / Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Coupon</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium text-sm">#{order.id.slice(-6)}</div>
                      <div className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{order.studentName}</div>
                      <div className="text-xs text-muted-foreground">{order.studentEmail}</div>
                    </TableCell>
                    <TableCell className="text-sm">{order.items}</TableCell>
                    <TableCell>
                      <div className="font-medium">{formatCurrency(order.finalAmount)}</div>
                      {order.totalAmount !== order.finalAmount && (
                        <div className="text-xs line-through text-muted-foreground">{formatCurrency(order.totalAmount)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.couponCode ? <Badge variant="outline">{order.couponCode}</Badge> : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : order.status === 'pending' ? 'outline' : 'destructive'}
                        className={order.status === 'completed' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStudentsTab = () => {
    if (!data) return null;
    const { totalStudents = 0, activeStudents = 0, newSignups = 0, monthlyGrowth = [], students = [] } = data;

    const filteredStudents = students.filter((s: any) => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
    );

    const maxGrowth = Math.max(...monthlyGrowth.map((m: any) => m.count), 1);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeStudents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New Signups</CardTitle>
              <UserPlus className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newSignups}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Signups Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-64 mt-4">
              {monthlyGrowth.map((m: any, i: number) => {
                const heightPercent = `${(m.count / maxGrowth) * 100}%`;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="w-full bg-purple-100 rounded-t-md relative flex items-end justify-center">
                      <div 
                        className="w-full bg-purple-600 rounded-t-md transition-all duration-500"
                        style={{ height: heightPercent }}
                      ></div>
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded">
                        +{m.count}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student Directory</CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-9" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Tests Attempted</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">Joined {new Date(student.createdAt).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{student.email}</div>
                      <div className="text-xs text-muted-foreground">{student.phone || '-'}</div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{student.testAttempts}</TableCell>
                    <TableCell className="text-center font-medium">{student.orders}</TableCell>
                    <TableCell>
                      {student.isBlocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : student.isActive ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProgressTab = () => {
    if (!data) return null;
    const { overall = {}, topTests = [], studentProgress = [] } = data;

    const filteredProgress = studentProgress.filter((s: any) => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Course Completion</CardTitle>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.avgCompletionRate || 0}%</div>
              <Progress value={overall.avgCompletionRate || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Test Score</CardTitle>
              <Award className="w-4 h-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.avgTestScore || 0}%</div>
              <Progress value={overall.avgTestScore || 0} className="mt-2 h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Actively Learning</CardTitle>
              <Activity className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.activeStudents || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Students learning this week</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Tests Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead className="w-1/3">Avg Score</TableHead>
                  <TableHead className="text-right">Total Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topTests.map((test: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{test.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={test.avgScore} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10">{test.avgScore}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{test.attempts}</TableCell>
                  </TableRow>
                ))}
                {topTests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">No test data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student Progress</CardTitle>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-9" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course Completion</TableHead>
                  <TableHead>Test Scores</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProgress.map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <Progress value={student.courseCompletionPercent} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10">{student.courseCompletionPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <Progress value={student.testScorePercent} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-10">{student.testScorePercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProgress.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No progress records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Monitor sales, student growth, and platform engagement.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              <SelectItem value="last_12_months">Last 12 Months</SelectItem>
              <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1">
          <TabsTrigger value="sales" className="data-[state=active]:bg-background">Sales</TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-background">Orders</TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:bg-background">Students</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-background">Progress</TabsTrigger>
        </TabsList>

        {loading ? renderSkeleton() : error ? renderError() : (
          <>
            <TabsContent value="sales" className="m-0 focus-visible:outline-none">
              {renderSalesTab()}
            </TabsContent>
            <TabsContent value="orders" className="m-0 focus-visible:outline-none">
              {renderOrdersTab()}
            </TabsContent>
            <TabsContent value="students" className="m-0 focus-visible:outline-none">
              {renderStudentsTab()}
            </TabsContent>
            <TabsContent value="progress" className="m-0 focus-visible:outline-none">
              {renderProgressTab()}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
