// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { inventoryApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import { Plus, Search, Trash2, Trash, Loader2, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { Pagination } from '../components/ui/pagination';
import { useNotification } from '../context/NotificationContext';

const DEFAULT_CATEGORIES = ['Filters', 'HVAC', 'Lubricants', 'Elevator Parts', 'Safety Equipment', 'Electrical', 'Plumbing', 'Tools', 'Other'];

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, low_stock_count: 0, total_value: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [recordStatus, setRecordStatus] = useState('active');
  const [selectedIds, setSelectedIds] = useState([]);
  const { isManager } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, lowStockOnly, page, recordStatus]);

  const fetchData = async () => {
    try {
      const [itemsRes, statsRes, categoriesRes] = await Promise.all([
        inventoryApi.list({ search, category: categoryFilter, low_stock_only: lowStockOnly, record_status: recordStatus, skip: (page - 1) * 10, limit: 10 }),
        inventoryApi.getStats(),
        inventoryApi.getCategories(),
      ]);
      setItems(itemsRes.data.data);
      setTotal(itemsRes.data.total);
      setSelectedIds([]);
      setStats(statsRes.data);
      setCategories([...new Set([...DEFAULT_CATEGORIES, ...(categoriesRes.data.categories || [])])]);
    } catch (error) {
      addNotification('error', 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm(recordStatus === 'active' ? 'Delete this inventory item?' : 'Permanently delete this inventory item?')) return;
    try {
      await inventoryApi.delete(itemId);
      addNotification('success', recordStatus === 'active' ? 'Item deactivated' : 'Item permanently deleted');
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to delete item');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to ${recordStatus === 'active' ? 'delete' : 'permanently delete'} ${selectedIds.length} items?`)) return;

    setSubmitting(true);
    try {
      await inventoryApi.bulkDelete({ ids: selectedIds, force: recordStatus === 'inactive' });
      addNotification('success', `${selectedIds.length} items ${recordStatus === 'active' ? 'deactivated' : 'permanently deleted'}`);
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to bulk delete items');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((a) => a.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((prevId) => prevId !== id) : [...prev, id]
    );
  };

  const isLowStock = (item) => item.min_quantity > 0 && item.quantity <= item.min_quantity;

  
  return (
    <div className="space-y-6" data-testid="inventory-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage spare parts and supplies</p>
        </div>
        {isManager() && (
          <Button data-testid="add-item-btn" onClick={() => navigate('/inventory/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="stat-total-items">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-3xl font-bold">{stats.total_items}</p>
              </div>
              <Package className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.low_stock_count > 0 ? 'border-amber-500/50' : ''} data-testid="stat-low-stock">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className={`text-3xl font-bold ${stats.low_stock_count > 0 ? 'text-amber-600' : ''}`}>
                  {stats.low_stock_count}
                </p>
              </div>
              <AlertTriangle className={`h-10 w-10 ${stats.low_stock_count > 0 ? 'text-amber-500' : 'text-muted-foreground/50'}`} />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-total-value">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-3xl font-bold">₹{stats.total_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card>
        <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="flex flex-wrap gap-4 items-center w-full">
            <div className="flex-1 min-w-[250px] flex items-center gap-2 rounded-lg border px-3 py-2 bg-background">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="border-0 p-0 focus-visible:ring-0"
                data-testid="inv-search-input"
              />
            </div>

            <div className="flex items-center gap-2">
              {isManager() && selectedIds.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} disabled={submitting}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <Switch
                id="low-stock"
                checked={lowStockOnly}
                onCheckedChange={(v) => { setLowStockOnly(v); setPage(1); }}
                data-testid="low-stock-toggle"
              />
              <Label htmlFor="low-stock" className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Only
              </Label>
              <div className="w-[180px]">
                <Select value={recordStatus} onValueChange={(v) => { setRecordStatus(v); setPage(1); }}>
                  <SelectTrigger data-testid="filter-record-status">
                    <SelectValue placeholder="Record Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                {isManager() && (
                  <TableHead className="w-[50px] min-w-[50px]">
                    <Checkbox
                      checked={items.length > 0 && selectedIds.length === items.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className="min-w-[250px]">Item</TableHead>
                <TableHead className="min-w-[150px]">SKU</TableHead>
                <TableHead className="min-w-[200px]">
                  <Select value={categoryFilter || "all"} onValueChange={(v) => { setCategoryFilter(v === "all" ? "" : v); setPage(1); }}>
                    <SelectTrigger className="border-0 bg-transparent shadow-none w-[160px] justify-between p-0 h-auto font-medium text-muted-foreground hover:text-foreground hover:bg-transparent focus:ring-0 px-2 -ml-2">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="min-w-[200px]">Location</TableHead>
                <TableHead className="min-w-[120px] text-right whitespace-nowrap">Quantity</TableHead>
                <TableHead className="min-w-[120px] text-right whitespace-nowrap">Unit Cost</TableHead>
                <TableHead className="w-[60px] min-w-[60px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No inventory items found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} data-testid={`inv-row-${item.id}`}>
                    {isManager() && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link to={`/inventory/${item.id}`} className="text-primary hover:underline font-medium">
                          {item.name}
                        </Link>
                        {isLowStock(item) && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Low Stock
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">{item.sku || '-'}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-muted-foreground">{item.storage_location}</TableCell>
                    <TableCell className="text-right">
                      <span className={isLowStock(item) ? 'text-amber-600 font-medium' : ''}>
                        {item.quantity}
                      </span>
                      {item.min_quantity > 0 && (
                        <span className="text-muted-foreground"> / {item.min_quantity} {item.unit}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">₹{parseFloat(item.unit_cost || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {isManager() && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive h-8 w-8"
                          onClick={() => handleDelete(item.id)}
                          data-testid={`delete-inv-btn-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination
            currentPage={page}
            totalItems={total}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      
    </div>
  );
};

export default InventoryPage;
