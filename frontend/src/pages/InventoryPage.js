import React, { useState, useEffect } from 'react';
import { inventoryApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Switch } from '../components/ui/switch';
import { Plus, Search, Edit, Trash2, Loader2, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const UNITS = ['pcs', 'liters', 'kg', 'meters', 'kits', 'boxes', 'rolls', 'sets'];
const DEFAULT_CATEGORIES = ['Filters', 'HVAC', 'Lubricants', 'Elevator Parts', 'Safety Equipment', 'Electrical', 'Plumbing', 'Tools', 'Other'];

const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total_items: 0, low_stock_count: 0, total_value: 0 });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const { isManager, hasRole } = useAuth();
  const isRestricted = hasRole(['technician', 'requestor']);
  const { addNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    quantity: 0,
    min_quantity: 0,
    unit: 'pcs',
    unit_cost: '0',
    storage_location: '',
  });

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, lowStockOnly]);

  const fetchData = async () => {
    try {
      const [itemsRes, statsRes, categoriesRes] = await Promise.all([
        inventoryApi.list({ search, category: categoryFilter, low_stock_only: lowStockOnly }),
        inventoryApi.getStats(),
        inventoryApi.getCategories(),
      ]);
      setItems(itemsRes.data);
      setStats(statsRes.data);
      setCategories([...new Set([...DEFAULT_CATEGORIES, ...(categoriesRes.data.categories || [])])]);
    } catch (error) {
      addNotification('error', 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      category: '',
      quantity: 0,
      min_quantity: 0,
      unit: 'pcs',
      unit_cost: '0',
      storage_location: '',
    });
    setSelectedItem(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inventoryApi.create(formData);
      addNotification('success', 'Item added to inventory');
      setCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      addNotification('error', error.response?.data?.detail || 'Failed to add item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await inventoryApi.update(selectedItem.id, formData);
      addNotification('success', 'Item updated');
      setEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Delete this inventory item?')) return;
    try {
      await inventoryApi.delete(itemId);
      addNotification('success', 'Item deleted');
      fetchData();
    } catch (error) {
      addNotification('error', 'Failed to delete item');
    }
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      category: item.category,
      quantity: item.quantity,
      min_quantity: item.min_quantity || 0,
      unit: item.unit || 'pcs',
      unit_cost: item.unit_cost || '0',
      storage_location: item.storage_location,
    });
    setEditOpen(true);
  };

  const isLowStock = (item) => item.min_quantity > 0 && item.quantity <= item.min_quantity;

  const renderInventoryForm = ({ onSubmit, isEdit = false }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Air Filter 20x25"
          required
          data-testid="inv-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Item details"
          rows={2}
          data-testid="inv-description-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })} required>
            <SelectTrigger data-testid="inv-category-select">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            placeholder="Optional"
            data-testid="inv-sku-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            min="0"
            required
            data-testid="inv-quantity-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_quantity">Min Qty</Label>
          <Input
            id="min_quantity"
            type="number"
            value={formData.min_quantity}
            onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 0 })}
            min="0"
            data-testid="inv-minqty-input"
          />
        </div>
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
            <SelectTrigger data-testid="inv-unit-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="storage_location">Storage Location *</Label>
          <Input
            id="storage_location"
            value={formData.storage_location}
            onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
            placeholder="Warehouse/Shelf"
            required
            data-testid="inv-location-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit_cost">Unit Cost (₹)</Label>
          <Input
            id="unit_cost"
            type="number"
            step="0.01"
            value={formData.unit_cost}
            onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
            min="0"
            data-testid="inv-cost-input"
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => isEdit ? setEditOpen(false) : setCreateOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} data-testid="inv-submit-btn">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update Item' : 'Add Item'}
        </Button>
      </DialogFooter>
    </form>
  );

  // Simplified read-only view for technicians/requestors
  if (isRestricted) {
    return (
      <div className="space-y-6" data-testid="inventory-page">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Browse spare parts and supplies</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 rounded-lg border px-3 py-2 max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0"
                data-testid="inv-search-input"
              />
            </div>
          </CardContent>
        </Card>

        {/* Simplified Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No inventory items found
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} data-testid={`inv-row-${item.id}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{item.sku || '-'}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-muted-foreground">{item.storage_location}</TableCell>
                      <TableCell className="text-right">{item.quantity} {item.unit}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="inventory-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage spare parts and supplies</p>
        </div>
        {isManager() && (
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-item-btn">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>Add a new item to your inventory</DialogDescription>
              </DialogHeader>
              {renderInventoryForm({ onSubmit: handleCreate })}
            </DialogContent>
          </Dialog>
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px] flex items-center gap-2 rounded-lg border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 p-0 focus-visible:ring-0"
                data-testid="inv-search-input"
              />
            </div>
            <div className="w-[180px]">
              <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
                <SelectTrigger data-testid="filter-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="low-stock"
                checked={lowStockOnly}
                onCheckedChange={setLowStockOnly}
                data-testid="low-stock-toggle"
              />
              <Label htmlFor="low-stock" className="flex items-center gap-1 cursor-pointer">
                <AlertTriangle className="h-4 w-4" />
                Low Stock Only
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
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
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} data-testid={`edit-${item.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive" data-testid={`delete-${item.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>Update item details</DialogDescription>
          </DialogHeader>
          {renderInventoryForm({ onSubmit: handleEdit, isEdit: true })}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
