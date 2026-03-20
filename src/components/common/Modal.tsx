import React from 'react';
import { FiX } from 'react-icons/fi';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="glass-panel w-full max-w-md rounded-2xl relative z-10 animate-scale-up overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h3 className="text-lg font-bold dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-red-500"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
