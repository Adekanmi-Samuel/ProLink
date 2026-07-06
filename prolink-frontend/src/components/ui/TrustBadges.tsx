import React from 'react';
import Badge from './Badge';

interface TrustBadgesProps {
  profile: any;
  user: any;
  className?: string;
}

export default function TrustBadges({ profile, user, className = '' }: TrustBadgesProps) {
  if (!user && !profile) return null;

  const emailVerified = user?.email_verified;
  const ninVerified = profile?.nin_status === 'verified';
  const cacVerified = profile?.cac_status === 'verified';

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {emailVerified && (
        <Badge variant="success" className="text-xs py-0.5 px-2">
          📧 Email Verified
        </Badge>
      )}
      {ninVerified && (
        <Badge variant="success" className="text-xs py-0.5 px-2">
          🛡️ ID Verified
        </Badge>
      )}
      {cacVerified && (
        <Badge variant="primary" className="text-xs py-0.5 px-2">
          🏢 Business Verified
        </Badge>
      )}
    </div>
  );
}
