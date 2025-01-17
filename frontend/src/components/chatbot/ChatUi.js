import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ChatUI = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [productData, setProductData] = useState([]);
  
  // Fetch product data on component mount
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        console.log('Fetching product data...');
        const res = await axios.get('http://localhost:5000/api/products'); // Adjust backend URL if needed
        console.log('Product data fetched successfully:', res.data);
        setProductData(res.data);
      } catch (err) {
        console.error('Error fetching product data:', err);
      }
    };
    fetchProductData();
  }, []);
  
  const handleSend = async () => {
    if (!query.trim()) {
      alert('Please enter a query');
      return;
    }

    console.log('Sending query:', query);
    console.log('Product data being sent:', productData);

    try {
      const res = await axios.post('http://localhost:5000/api/chat', {
        query,
        product_data: productData,
      });
      console.log('Response from API:', res.data);
      setResponse(res.data.response);
    } catch (err) {
      console.error('Error sending query:', err);
      alert('Failed to send query. Please check the console for details.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Chat with the Assistant</h2>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter your query..."
        style={{ width: '100%', height: '100px', marginBottom: '10px' }}
      />
      <button
        onClick={handleSend}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        Send
      </button>
      <div>
        <h3>Response:</h3>
        <p>{response}</p>
      </div>
    </div>
  );
};

export default ChatUI;
