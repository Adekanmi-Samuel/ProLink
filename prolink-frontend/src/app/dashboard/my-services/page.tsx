'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import withAuth from '../../../components/withAuth';

function MyServices() {
  const { user } = useUser();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Service Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('3');
  const [submitting, setSubmitting] = useState(false);
  const [aiPricing, setAiPricing] = useState(false);
  const [priceTip, setPriceTip] = useState('');

  const fetchServices = async () => {
    try {
      const res = await api.get('/services/my');
      setServices(res.data);
    } catch (err) {
      console.error('Failed to fetch your services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/services', {
        title,
        description,
        price: parseFloat(price),
        delivery_days: parseInt(deliveryDays),
        images: [] // Placeholder
      });
      toast.success('Service created successfully!');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPrice('');
      setDeliveryDays('3');
      fetchServices();
    } catch (err) {
      toast.error('Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuggestPricing = async () => {
    if (!title || !description) {
      toast.error('Please enter a title and description first.');
      return;
    }
    
    setAiPricing(true);
    setPriceTip('');
    try {
      const res = await api.post('/ai/services/pricing', { title, description });
      const { minPrice, maxPrice, tip } = res.data;
      
      // We can set the price to the middle of the range, or minPrice
      const suggestedPrice = Math.round((minPrice + maxPrice) / 2);
      setPrice(suggestedPrice.toString());
      setPriceTip(`Suggested range: ₦${minPrice.toLocaleString()} - ₦${maxPrice.toLocaleString()}. ${tip}`);
      toast.success('Pricing suggested!');
    } catch (err: any) {
      if (err.response?.status === 403) {
        toast.error('This feature is for Premium users only.');
      } else {
        toast.error('Failed to suggest pricing.');
      }
    } finally {
      setAiPricing(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Pre-Packaged Services</h1>
        <Button onClick={() => setShowModal(true)}>Create New Service</Button>
      </div>

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No services</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new pre-packaged service.</p>
          <div className="mt-6">
            <Button onClick={() => setShowModal(true)}>Create New Service</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">{service.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">{service.description}</p>
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{service.delivery_days} days</span>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">₦{parseInt(service.price).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Service</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title</label>
                  <input required className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. I will design a modern logo" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                  <textarea required rows={4} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you will do..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium dark:text-gray-300">Price (₦)</label>
                      <button 
                        type="button" 
                        onClick={handleSuggestPricing} 
                        disabled={aiPricing}
                        className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center"
                      >
                        {aiPricing ? 'Thinking...' : '✨ Auto Price'}
                      </button>
                    </div>
                    <input required type="number" min="1000" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={price} onChange={e => setPrice(e.target.value)} placeholder="10000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Delivery (Days)</label>
                    <input required type="number" min="1" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} />
                  </div>
                </div>
                {priceTip && (
                  <div className="text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg mt-2">
                    {priceTip}
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" isLoading={submitting}>Create Service</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default withAuth(MyServices);
