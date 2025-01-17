import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell, Legend as RechartsLegend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar } from 'recharts';
import { CheckIcon } from '@heroicons/react/20/solid';
import * as XLSX from 'xlsx'; // Import xlsx library

// Interfaces for sales data
interface Product {
  name: string;
}

interface SalesByDay {
  day: string;
  sales: number;
}

interface SalesByMonth {
  month: string;
  sales: number;
}

interface ProductSalesData {
  product: string;
  salesData: SalesData[]; 
  salesByDay?: SalesByDay[];
  salesByMonth?: SalesByMonth[];
}

interface SalesData {
  date: string;
  sales: number;
}

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSalesData, setProductSalesData] = useState<ProductSalesData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'sixMonths'>('week'); // Only toggling between week and sixMonths
  const COLORS = [
    '#4F46E5', '#82ca9d', '#FFBB28', '#FF8042', '#8A2BE2',
    '#00C49F', '#FF6347', '#7B68EE', '#4682B4', '#D2691E',
  ];

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/getAllProducts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setProducts(response.data.products);
      generateFakeData(response.data.products);
    } catch (err) {
      toast.error('Failed to fetch products');
    }
  };

  const generateFakeData = (products: Product[]) => {
    const now = new Date();
    const data = products.map((product) => {
      // Generate weekly sales data
      const weeklySalesData = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - index);
        return {
          date: date.toISOString().slice(0, 10), // Format: YYYY-MM-DD
          sales: Math.floor(Math.random() * 1000) + 100, // Random sales value
        };
      }).reverse(); // Show data from oldest to newest

      // Generate monthly sales data
      const monthlySalesData = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        return {
          date: date.toISOString().slice(0, 10), // Format: YYYY-MM-DD
          sales: Math.floor(Math.random() * 1000) + 100,
        };
      }).reverse(); // Show data from oldest to newest

      // Combine weekly and monthly data (you can customize how you want to store it)
      return { 
        product: product.name, 
        salesData: [...weeklySalesData, ...monthlySalesData] // Combine both weekly and monthly data
      };
    });
    setProductSalesData(data);
};


const handleProductSelect = (value: string) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.includes(value)
        ? prevSelected.filter((product) => product !== value)
        : [...prevSelected, value]
    );
};

const DownloadButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
</svg>

)

useEffect(() => {
    fetchProducts();
}, []);

const getPastWeekSales = () => {
  const now = new Date();

  // Generate the past week dates
  const pastWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
  }).reverse();

  console.log("Past week dates:", pastWeek); // Log past week dates to verify

  return productSalesData
      .filter((data) => selectedProducts.includes(data.product)) // Filter by selected products
      .map((data) => {
          console.log(`Product sales data for ${data.product}:`, data.salesData); // Log sales data for the product

          const salesByDay = pastWeek.map((day) => {
              const dailySales = data.salesData.filter((entry) => entry.date === day); // Filter sales data by exact date
              const totalSales = dailySales.length > 0 ? dailySales.reduce((sum, entry) => sum + entry.sales, 0) : 0;

              console.log(`Sales for ${data.product} on ${day}:`, totalSales); // Log sales for the specific day

              return {
                  day,
                  sales: totalSales,
              };
          });

          return {
              product: data.product,
              salesByDay,
          };
      });
};
const getPastSixMonthsSales = () => {
    const now = new Date();
    const lastSixMonths: string[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      lastSixMonths.push(date.toISOString().slice(0, 7)); // Add "YYYY-MM"
    }
    return productSalesData
      .filter((data) => selectedProducts.includes(data.product))
      .map((data) => {
        const salesByMonth = lastSixMonths.map((month) => {
          return {
            month,
            sales: data.salesData
              .filter((entry) => entry.date.startsWith(month))
              .reduce((sum, entry) => sum + entry.sales, 0),
          };
        });
        return {
          product: data.product,
          salesByMonth,
        };
      });
};

const getSales = () => {
    switch (timeRange) {
      case 'week':
        return getPastWeekSales();
      case 'sixMonths':
        return getPastSixMonthsSales();
      default:
        return [];
    }
};

const pastSales = getSales();

const getTotalSalesByProduct = () => {
    return pastSales.map((data) => {
        let sales = 0;
        if (data.salesByDay) {
            sales = data.salesByDay.reduce((total, dayData) => total + dayData.sales, 0);
        } else if (data.salesByMonth) {
            sales = data.salesByMonth.reduce((total, monthData) => total + monthData.sales, 0);
        }
        return { product: data.product, sales };
    });
};

 // Function to generate the Excel file and trigger the download
 const downloadExcel = () => {
  const data = pastSales.flatMap((data) => {
    return (data.salesByDay || data.salesByMonth || []).map((entry) => {
      return {
        product: data.product,
        dateOrMonth: entry.day || entry.month,
        sales: entry.sales,
      };
    });
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');
  XLSX.writeFile(wb, 'sales_data.xlsx');
};

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-screen-lg mx-auto">
        <div className="mb-8 text-center">
          <h5 className="text-lg font-medium text-gray-700">Sales Analytics:</h5>
          <div className="flex justify-center items-center gap-4 pt-4">
            <Select onValueChange={handleProductSelect}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select products" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product, idx) => (
                  <SelectItem key={idx} value={product.name}>
                    <div className="flex items-center justify-between">
                      {product.name}
                      {selectedProducts.includes(product.name) && (
                        <CheckIcon className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {/* Toggle and Download Buttons */}
             <div className="flex gap-4">
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded"
                onClick={() => {
                  if (timeRange === 'week') setTimeRange('sixMonths');
                  else setTimeRange('week');
                }}
              >
                 {timeRange === 'week' ? 'Past 6 Months' : 'Past Week'}
              </button>

              <button
                className="bg-blue-500 text-white py-2 px-4 rounded"
                onClick={downloadExcel}
                title = "Download Sales Data"
              >
                <DownloadButton/>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {pastSales.map((data, idx) => (
            <Card key={idx} className="mb-12 p-8 bg-white shadow-xl rounded-xl">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-center text-gray-800">
                  {data.product} Sales ({timeRange === 'week' ? 'Past Week' : 'Past 6 Months'})
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeRange === 'week' ? data.salesByDay : data.salesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={timeRange === 'week' ? 'day' : 'month'} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sales" stroke="#4F46E5" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ))}
        </div>

        {/* Conditional Rendering for Bar and Pie Charts */}
        <div className="flex gap-8">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-center text-gray-800">
              Sales Comparison ({timeRange === 'week' ? 'Past Week' : 'Past 6 Months'})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getTotalSalesByProduct()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-center text-gray-800">
              Sales Distribution ({timeRange === 'week' ? 'Past Week' : 'Past 6 Months'})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getTotalSalesByProduct()}
                  dataKey="sales"
                  nameKey="product"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {getTotalSalesByProduct().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsLegend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
