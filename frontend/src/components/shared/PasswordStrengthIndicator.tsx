import React from 'react';
import { Check, X } from 'lucide-react';

export const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const reqs = [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
  ];

  if (!password) {
    return (
      <p className="text-xs text-muted-foreground mt-2">
        Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-1.5 bg-black/20 p-3 rounded-md border border-white/5 animate-in fade-in zoom-in-95 duration-200">
      {reqs.map((req, i) => (
        <div key={i} className={`flex items-center text-xs transition-colors duration-300 ${req.met ? 'text-positive' : 'text-muted-foreground'}`}>
          {req.met ? <Check className="w-3.5 h-3.5 mr-2" /> : <X className="w-3.5 h-3.5 mr-2 opacity-50" />}
          <span className={req.met ? 'font-medium' : ''}>{req.label}</span>
        </div>
      ))}
    </div>
  );
};
