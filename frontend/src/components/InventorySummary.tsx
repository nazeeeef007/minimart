import React from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const DownloadButton = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
</svg>

)
const InventorySummary: React.FC = () => {
  const handleDownload = async () => {
    try {
      // Fetch product data from the backend
      const response = await axios.get("http://localhost:5000/api/admin/getAllProducts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const products = response.data.products || [];
      console.log(products)
      if (!products.length) {
        alert("No products found.");
        return;
      }

      // Transform product data into a format suitable for Excel
      const excelData = products.map((product: any) => ({
        Name: product.name,
        Description: product.description,
        Price: product.price,
        Auction: product.auction ? "Yes" : "No",
        "Auction End Date": product.auctionEndDate
          ? new Date(product.auctionEndDate).toLocaleString()
          : "N/A",
        "Highest Bid": product.auction ? product.highestBid : "N/A",
        "Highest Bidder": product.highestBidder || "N/A",
        Quantity: product.quantity,
        "Image URL": product.imageUrl || "N/A",
        Category: product.category,
        Size: product.size || "N/A",
        Colour: product.colour || "N/A",
        "Created At": new Date(product.createdAt).toLocaleString(),
        "Updated At": new Date(product.updatedAt).toLocaleString(),
      }));

      // Create a new workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const columnWidths = Object.keys(products[0] || {}).map(() => ({ wch: 30 })); // Default width for all columns
      worksheet['!cols'] = columnWidths;
      // Append worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

      // Generate Excel file and download
      XLSX.writeFile(workbook, "Inventory_Summary.xlsx");
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to download the inventory summary. Please try again.");
    }
  };

  return (

      <button
        onClick={handleDownload}
        className="bg-blue-600 text-white px-3 py-1 rounded shadow hover:bg-blue-600"
        title = "Inventory Summary"
      >
        <DownloadButton />
      </button>
    
  );
};

export default InventorySummary;
