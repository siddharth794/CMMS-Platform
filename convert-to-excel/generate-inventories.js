const XLSX = require("xlsx");
const fs = require("fs");

const inventories = [
	{
		Name: "HVAC Filter - High Capacity",
		SKU: "INV-FILT-001",
		Category: "Filters",
		Quantity: 50,
		"Min Quantity": 10,
		"Unit Cost": 150,
		Unit: "pcs",
		"Storage Location": "Warehouse A - Shelf 1",
	},
	{
		Name: "Industrial Lubricant - 5L",
		SKU: "INV-LUB-005",
		Category: "Lubricants",
		Quantity: 12,
		"Min Quantity": 5,
		"Unit Cost": 450,
		Unit: "bottles",
		"Storage Location": "Main Store Room",
	},
	{
		Name: "Safety Googles - Clear",
		SKU: "INV-SAF-102",
		Category: "Safety Equipment",
		Quantity: 30,
		"Min Quantity": 15,
		"Unit Cost": 25,
		Unit: "pairs",
		"Storage Location": "Safety Cabinet 1",
	},
	{
		Name: "Copper Pipe - 1/2 inch",
		SKU: "INV-PLM-003",
		Category: "Plumbing",
		Quantity: 100,
		"Min Quantity": 20,
		"Unit Cost": 12,
		Unit: "meters",
		"Storage Location": "Plumbing Section - Floor 2",
	},
	{
		Name: "LED Bulb - 12W",
		SKU: "INV-ELE-201",
		Category: "Electrical",
		Quantity: 200,
		"Min Quantity": 50,
		"Unit Cost": 5,
		Unit: "units",
		"Storage Location": "Electrical Bin 4",
	},
];

// convert JSON → worksheet
const worksheet = XLSX.utils.json_to_sheet(inventories);

// create workbook
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Inventories");

// write file
XLSX.writeFile(workbook, "inventories_demo.xlsx");

console.log("Excel file generated: inventories_demo.xlsx");
