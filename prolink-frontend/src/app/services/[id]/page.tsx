'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import FooterSection from '@/components/FooterSection';
import { useUser } from '@/context/UserContext';
import { toast } from 'react-hot-toast';

export default function ServiceDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState('');
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await api.get(`/services/${id}`);
        setService(res.data);
      } catch (err) {
        toast.error('Service not found');
        router.push('/services');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id, router]);

  const handlePurchase = async () => {
    if (!user) {
      toast.error('Please log in to purchase services');
      router.push('/login');
      return;
    }
    if (user.id === service.provider_id) {
      toast.error('You cannot purchase your own service');
      return;
    }
    if (!requirements.trim()) {
      toast.error('Please provide requirements for the provider');
      return;
    }

    setBuying(true);
    try {
      await api.post('/services/purchase', {
        serviceId: service.id,
        requirements
      });
      toast.success('Service purchased successfully!');
      router.push('/dashboard/contracts'); // Redirect to contracts or active orders
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Purchase failed');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!service) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{service.title}</h1>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-lg">
                  {service.provider?.profile?.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{service.provider?.profile?.full_name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{service.provider?.profile?.title || 'Freelancer'}</p>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none mb-6 whitespace-pre-wrap">
                {service.description}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About the Provider</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {service.provider?.profile?.bio || 'No bio provided.'}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-24 shadow-lg shadow-gray-200/50 dark:shadow-none">
              <div className="flex justify-between items-end mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Purchase</h3>
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">₦{parseInt(service.price).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center text-gray-600 dark:text-gray-300 mb-6 font-medium">
                <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {service.delivery_days} Days Delivery
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Requirements for the Provider</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                  placeholder="Describe exactly what you need, any specific preferences, attachments, etc."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                ></textarea>
              </div>

              <button 
                onClick={handlePurchase}
                disabled={buying || user?.id === service.provider_id}
                className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex justify-center items-center"
              >
                {buying ? 'Processing...' : user?.id === service.provider_id ? 'You own this service' : `Continue (₦${parseInt(service.price).toLocaleString()})`}
              </button>
            </div>
          </div>

        </div>
      </main>
      <FooterSection />
    </div>
  );
}
