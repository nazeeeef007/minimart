import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell, Legend as RechartsLegend } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar } from 'recharts'; 
import { CheckIcon } from '@heroicons/react/20/solid';

interface Product {
  name: string;
}

interface SalesData {
  date: string;
  sales: number;
}

interface ProductSalesData {
  product: string;
  salesData: SalesData[];
}

const Dashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productSalesData, setProductSalesData] = useState<ProductSalesData[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
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
      const salesData = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        return {
          date: date.toISOString().slice(0, 10), // Format: YYYY-MM-DD
          sales: Math.floor(Math.random() * 1000) + 100,
        };
      }).reverse(); // Show data from oldest to newest
      return { product: product.name, salesData };
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const getPastMonthSales = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7); // YYYY-MM
    return productSalesData
      .filter((data) => selectedProducts.includes(data.product))
      .map((data) => ({
        product: data.product,
        sales: data.salesData
          .filter((entry) => entry.date.startsWith(lastMonth))
          .reduce((sum, entry) => sum + entry.sales, 0),
      }));
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

  const pastMonthSales = getPastMonthSales();
  const totalSales = pastMonthSales.reduce((sum, entry) => sum + entry.sales, 0);

  const getTotalSalesByProduct = () => {
    const pastSixMonthsSales = getPastSixMonthsSales();
    return pastSixMonthsSales.map((data) => ({
      product: data.product,
      sales: data.salesByMonth.reduce((total, monthData) => total + monthData.sales, 0),
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-screen-lg mx-auto">
        <div className="mb-8 text-center">
          <h5 className="text-lg font-medium text-gray-700">Sales Analytics:</h5>
          <div className="flex justify-center items-center gap-4">
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
          </div>
        </div>
{/* undo the div to remove the grid layout for line graph */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {productSalesData
          .filter((data) => selectedProducts.includes(data.product))
          .map((data, idx) => (
            <Card key={idx} className="mb-12 p-8 bg-white shadow-xl rounded-xl">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-center text-gray-800">{data.product} Sales (Past 6 months)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
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
        {selectedProducts.length > 0 && (
          <div className="flex gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-center text-gray-800">Sales Comparison (Last Month)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pastMonthSales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-center text-gray-800">Sales Distribution (Last Month)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pastMonthSales}
                    dataKey="sales"
                    nameKey="product"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#4F46E5"
                  >
                    {pastMonthSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsLegend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value, entry) => {
                      const payload = entry.payload as { sales?: number };
                      if (payload && payload.sales !== undefined && totalSales > 0) {
                        const percentage = ((payload.sales / totalSales) * 100).toFixed(2);
                        return `${value} (${percentage}%)`;
                      }
                      return value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedProducts.length > 0 && (
          <div className="flex gap-8 mt-8">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-center text-gray-800">Total Sales Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTotalSalesByProduct()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold text-center text-gray-800">Total Sales Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getTotalSalesByProduct()}
                    dataKey="sales"
                    nameKey="product"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#FF6347"
                  >
                    {getTotalSalesByProduct().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsLegend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value, entry) => {
                      const payload = entry.payload as { sales?: number };
                      const totalSales = getTotalSalesByProduct().reduce((sum, data) => sum + data.sales, 0);
                      if (payload && payload.sales !== undefined && totalSales > 0) {
                        const percentage = ((payload.sales / totalSales) * 100).toFixed(2);
                        return `${value} (${percentage}%)`;
                      }
                      return value;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
