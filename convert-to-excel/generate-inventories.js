const XLSX = require("xlsx");
const fs = require("fs");

const inventories = [
	{
		Name: "Hydraulic Oil - 20L",
		SKU: "INV-OIL-500",
		Category: "Lubricants",
		Quantity: 25,
		"Min Quantity": 5,
		"Unit Cost": 1200,
		Unit: "canisters",
		"Storage Location": "Oil Shed - Section B",
	},
	{
		Name: "N95 Dust Masks",
		SKU: "INV-PPE-010",
		Category: "Safety Equipment",
		Quantity: 500,
		"Min Quantity": 100,
		"Unit Cost": 2.5,
		Unit: "pcs",
		"Storage Location": "Safety Locker 3",
	},
	{
		Name: "Bearing 6205-2RS",
		SKU: "INV-MECH-992",
		Category: "Mechanical Parts",
		Quantity: 40,
		"Min Quantity": 10,
		"Unit Cost": 15,
		Unit: "pcs",
		"Storage Location": "Small Parts Bin - Row 2",
	},
	{
		Name: "Network Patch Cable - 3m",
		SKU: "INV-IT-442",
		Category: "IT Supplies",
		Quantity: 100,
		"Min Quantity": 20,
		"Unit Cost": 8,
		Unit: "pcs",
		"Storage Location": "Server Room Cabinet",
	},
	{
		Name: "Industrial Degreaser - 10L",
		SKU: "INV-CHEM-302",
		Category: "Chemicals",
		Quantity: 15,
		"Min Quantity": 3,
		"Unit Cost": 650,
		Unit: "drums",
		"Storage Location": "Hazardous Materials Area",
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
