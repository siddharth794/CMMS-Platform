// @ts-nocheck
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { inventoryApi } from '../lib/api';

const InventoryBulkUploadDialog = ({ onUploadSuccess }) => {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [itemsToUpload, setItemsToUpload] = useState([]);
    const { addNotification } = useNotification();

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        if (selectedFile) {
            parseExcel(selectedFile);
        } else {
            setItemsToUpload([]);
        }
    };

    const parseExcel = (selectedFile) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const workSheet = workbook.Sheets[sheetName];

                // Convert to JSON array of objects
                const json = XLSX.utils.sheet_to_json(workSheet);

                // Map common column headers to API field names
                const mappedItems = json.map(row => ({
                    name: row['Name'] || row['name'] || '',
                    sku: row['SKU'] || row['sku'] || '',
                    category: row['Category'] || row['category'] || 'Other',
                    quantity: parseFloat(row['Quantity'] || row['quantity'] || 0),
                    min_quantity: parseFloat(row['Min Quantity'] || row['min_quantity'] || 0),
                    unit_cost: parseFloat(row['Unit Cost'] || row['unit_cost'] || 0),
                    unit: row['Unit'] || row['unit'] || 'pcs',
                    storage_location: row['Storage Location'] || row['storage_location'] || row['Location'] || row['location'] || '',
                })).filter(item => item.name); // Filter out empty rows without a name

                setItemsToUpload(mappedItems);
            } catch (error) {
                addNotification('error', 'Failed to parse the Excel file. Please ensure it is correctly formatted.');
                setFile(null);
                setItemsToUpload([]);
            }
        };
        reader.readAsBinaryString(selectedFile);
    };

    const handleUpload = async () => {
        if (itemsToUpload.length === 0) {
            addNotification('error', 'No valid items found in the file to upload.');
            return;
        }

        setUploading(true);
        try {
            await inventoryApi.bulkCreate({ items: itemsToUpload });
            addNotification('success', `Successfully processed ${itemsToUpload.length} inventory items`);
            setOpen(false);
            setFile(null);
            setItemsToUpload([]);
            if (onUploadSuccess) onUploadSuccess();
        } catch (error) {
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const firstField = Object.keys(errors)[0];
                const firstError = Array.isArray(errors[firstField]) ? errors[firstField][0] : errors[firstField];
                addNotification('error', `Validation failed: ${firstField} - ${firstError}`);
            } else {
                addNotification('error', error.response?.data?.detail || 'Failed to upload inventory items');
            }
        } finally {
            setUploading(false);
        }
    };

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { 
                Name: 'Air Filter 20x20x1', 
                SKU: 'AF-20201',
                Category: 'Filters', 
                Quantity: '50',
                'Min Quantity': '10', 
                'Unit Cost': '15.50', 
                Unit: 'pcs', 
                'Storage Location': 'Aisle 3, Shelf B'
            },
            { 
                Name: 'LED Bulb 60W', 
                SKU: 'LB-60W-01',
                Category: 'Electrical', 
                Quantity: '120',
                'Min Quantity': '25', 
                'Unit Cost': '4.25', 
                Unit: 'pcs', 
                'Storage Location': 'Aisle 1, Shelf A'
            }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Inventory_Import_Template.xlsx');
    };

    const resetState = () => {
        setFile(null);
        setItemsToUpload([]);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" data-testid="bulk-upload-btn">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Bulk Import Inventory</DialogTitle>
                    <DialogDescription>
                        Upload an Excel (.xlsx) or CSV file containing your inventory items. If an item matches an existing item by name or SKU, its quantity will be increased by the imported amount.
                        <button onClick={downloadTemplate} className="text-primary hover:underline ml-1">
                            Download template
                        </button>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 border-muted-foreground/20 hover:bg-muted/50 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-muted-foreground">XLSX or CSV</p>
                            </div>
                            <input
                                id="dropzone-file"
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {file && (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                            <span className="text-muted-foreground">
                                ({itemsToUpload.length} valid items found)
                            </span>
                        </div>
                    )}

                    {file && itemsToUpload.length === 0 && (
                        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                            <AlertCircle className="h-4 w-4 mt-0.5" />
                            <p>No valid items found. Ensure your file has a column named "Name".</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={uploading || !file || itemsToUpload.length === 0}
                    >
                        {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InventoryBulkUploadDialog;