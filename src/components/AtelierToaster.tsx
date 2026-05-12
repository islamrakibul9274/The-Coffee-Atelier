"use client";

import { Toaster, ToastBar, toast } from "react-hot-toast";
import { X } from "lucide-react";

export default function AtelierToaster() {
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{
        duration: 4000,
        className: 'atelier-toast',
        style: {
          background: '#161412',
          color: '#F5F5F5',
          borderRadius: '0px',
          padding: '16px 24px',
          border: '1px solid rgba(192, 160, 128, 0.1)',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)',
          fontSize: '11px',
          fontWeight: 'bold',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        },
        success: {
          iconTheme: {
            primary: '#C0A080',
            secondary: '#161412',
          },
          style: {
            borderLeft: '3px solid #C0A080',
          },
        },
        error: {
          iconTheme: {
            primary: '#8B0000',
            secondary: '#F5F5F5',
          },
          style: {
            borderLeft: '3px solid #8B0000',
          },
        },
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <div className="flex items-center gap-4">
              {icon}
              <div className="flex-1">{message}</div>
              {t.type !== 'loading' && (
                <button 
                  onClick={() => toast.dismiss(t.id)}
                  className="ml-2 p-1 hover:bg-white/10 transition-colors"
                >
                  <X className="w-3 h-3 stroke-[1.5px]" />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
