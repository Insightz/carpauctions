// src/components/ui/alert-dialog.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AlertDialogContextProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextProps | undefined>(undefined);

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <AlertDialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          {children}
        </div>
      )}
    </AlertDialogContext.Provider>
  );
};

export const AlertDialogContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
      {children}
    </div>
  );
};

export const AlertDialogHeader: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

export const AlertDialogTitle: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <h2 className="text-lg font-bold">{children}</h2>;
};

export const AlertDialogDescription: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <p className="text-sm text-gray-600">{children}</p>;
};

export const AlertDialogFooter: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <div className="mt-4 flex justify-end space-x-2">{children}</div>;
};

export const AlertDialogAction: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return (
    <button
      {...props}
      className={`px-4 py-2 bg-purple-600 text-white rounded-md ${props.className}`}
    >
      {props.children}
    </button>
  );
};

export const AlertDialogCancel: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error('AlertDialogCancel must be used within an AlertDialog');

  return (
    <button
      {...props}
      className={`px-4 py-2 bg-gray-300 rounded-md ${props.className}`}
      onClick={() => context.setOpen(false)}
    >
      {props.children}
    </button>
  );
};
