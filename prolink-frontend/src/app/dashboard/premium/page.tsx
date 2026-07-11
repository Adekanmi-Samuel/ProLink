'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useUser } from '@/context/UserContext';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';

export default function PremiumUpgrade() {
  const { user } = useUser();
  const router = useRouter();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.post('/profiles/upgrade');
      toast.success('Successfully upgraded to ProLink Premium!');
      // Typically you might update the user context here, 
      // but reloading is an easy way to refresh state.
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error('Failed to process upgrade. Please try again later.');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl mb-4">
            ProLink <span className="text-primary-600">Premium</span>
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Unlock the power of AI and take your freelance career to the next level.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-8 sm:p-10 lg:p-12">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Freelancer Plus</h3>
            <div className="flex items-baseline mb-6">
              <span className="text-5xl font-extrabold text-gray-900 dark:text-white">₦5,000</span>
              <span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/month</span>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              Everything you need to stand out, win more jobs, and save hours of time.
            </p>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">✨ AI Proposal Assistant:</strong> Instantly draft highly-tailored, professional cover letters perfectly matched to the client's job description.
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Premium Badge:</strong> Stand out in the search results and job bids with an exclusive Premium badge.
                </p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="ml-3 text-lg text-gray-700 dark:text-gray-300">
                  <strong className="text-gray-900 dark:text-white">Zero Service Fees:</strong> Keep 100% of your earnings on your first 3 jobs each month.
                </p>
              </li>
            </ul>

            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-6 mb-8 border border-primary-100 dark:border-primary-800">
              <p className="text-primary-800 dark:text-primary-300 text-sm">
                For this beta phase, upgrading to Premium is completely <strong>free</strong> and doesn't require a real credit card. Simply click the button below to simulate the upgrade and unlock the AI features immediately!
              </p>
            </div>

            <Button 
              className="w-full py-4 text-lg" 
              onClick={handleUpgrade}
              isLoading={upgrading}
              disabled={user?.is_premium}
            >
              {user?.is_premium ? 'You are already Premium!' : 'Upgrade Now (Simulated)'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
