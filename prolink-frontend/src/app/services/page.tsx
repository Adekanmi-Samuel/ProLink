'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import FooterSection from '@/components/FooterSection';

export default function ServicesCatalog() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        setServices(res.data);
      } catch (err) {
        console.error('Failed to fetch services', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Pre-Packaged Services</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Instantly purchase pre-defined services from top talent without posting a job.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No services available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {services.map(service => (
              <Link href={`/services/${service.id}`} key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden flex flex-col cursor-pointer">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {service.images && service.images.length > 0 ? (
                    <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">No Image</span>
                  )}
                </div>
                <div className="p-5 flex-grow flex flex-col">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold text-xs">
                      {service.provider?.profile?.full_name?.charAt(0) || '?'}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{service.provider?.profile?.full_name || 'Unknown Provider'}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-4 hover:text-primary-600">{service.title}</h3>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{service.delivery_days} days delivery</span>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">₦{parseInt(service.price).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <FooterSection />
    </div>
  );
}
