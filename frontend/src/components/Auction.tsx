import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'react-toastify';

interface Auction {
  _id: string;
  name: string;
  description: string;
  highestBid: number;
  highestBidder: string;
  auctionEndDate: string;
  id: string;
}
const NextAuctionButton = () => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
</svg>
)

const PreviousAuctionButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75 3 12m0 0 3.75-3.75M3 12h18" />
</svg>

)
const Auction = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [bidAmounts, setBidAmounts] = useState<{ [key: string]: number }>({});
  const [currentAuctionIndex, setCurrentAuctionIndex] = useState<number>(0); // Track the currently displayed auction

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/resident/getAuctions', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setAuctions(response.data.auctions);
        console.log(response.data.auctions);
      } catch (error) {
        toast.error('Failed to fetch auctions');
      }
    };

    fetchAuctions();
  }, []);

  const handleBid = async (productId: string) => {
    const bidAmount = bidAmounts[productId];

    if (bidAmount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    const confirmBid = window.confirm("Are you sure you want to place this bid? Bids cannot be cancelled.");
    if (!confirmBid) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/resident/placeBid/${productId}`,
        { bidAmount, username: localStorage.getItem('username') },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      toast.success('Bid placed successfully');
      setBidAmounts((prev) => ({ ...prev, [productId]: 0 })); // Clear the bid amount for this product
    } catch (error: any) {
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error('Failed to place bid');
      }
    }
  };

  // Helper function to calculate time left in the auction
  const getTimeLeft = (endDate: string) => {
    const now = new Date();
    const auctionEnd = new Date(endDate);
    const diff = auctionEnd.getTime() - now.getTime();

    if (diff <= 0) return 'Auction Ended';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  const handleBidAmountChange = (productId: string, amount: number) => {
    setBidAmounts((prev) => ({ ...prev, [productId]: amount }));
  };

  return (
    <div className="p-0 max-w-6xl mx-auto ">
      <h3 className="text-4xl font-semibold text-gray-900 mb-8">Auction Items</h3>

      {/* Scrollable container for auction items */}
      <div className="space-y-8 overflow-y-auto max-h-[400px]">
        {auctions.length > 0 && (
          <Card
            key={auctions[currentAuctionIndex]._id} // Use the current auction index
            className="p-6 shadow-lg border border-gray-300 rounded-lg transition-all transform hover:scale-105 hover:shadow-xl"
          >
            <h2 className="text-2xl font-semibold text-gray-900">{auctions[currentAuctionIndex].name}</h2>
            <p className="text-gray-700 mb-4">{auctions[currentAuctionIndex].description}</p>
            <div className="flex justify-between items-center text-gray-900">
              <p className="font-medium">Highest Bid: ${auctions[currentAuctionIndex].highestBid}</p>
              <p className="text-sm text-black">Auction Ends: {new Date(auctions[currentAuctionIndex].auctionEndDate).toLocaleString()}</p>
            </div>
            <p className="text-black">Highest Bidder: {auctions[currentAuctionIndex].highestBidder || 'None'}</p>
            <p className="font-semibold text-green-600 mt-2">{getTimeLeft(auctions[currentAuctionIndex].auctionEndDate)}</p>

            <div className="mt-6">
              <input
                type="number"
                className="border p-3 rounded-lg w-full mb-4 text-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter your bid"
                value={bidAmounts[auctions[currentAuctionIndex].id] || ''}
                onChange={(e) => handleBidAmountChange(auctions[currentAuctionIndex].id, Number(e.target.value))}
              />
              <Button
                onClick={() => handleBid(auctions[currentAuctionIndex].id)}
                className="bg-blue-600 text-white w-full py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200"
              >
                Place Bid
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Scroll navigation buttons */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={() => setCurrentAuctionIndex(currentAuctionIndex > 0 ? currentAuctionIndex - 1 : auctions.length - 1)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
        >
          <PreviousAuctionButton/>
        </Button>
        <Button
          onClick={() => setCurrentAuctionIndex((currentAuctionIndex + 1) % auctions.length)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
        >
          <NextAuctionButton/>
        </Button>
      </div>
    </div>
  );
};

export default Auction;
