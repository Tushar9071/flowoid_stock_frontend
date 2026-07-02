import React from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const confirmAction = (message: string, options?: ConfirmOptions): Promise<boolean> => {
  const type = options?.type || 'danger';
  const defaultTitle = type === 'danger' ? 'Are you sure?' : 'Confirm Action';
  const defaultDesc = type === 'danger' ? 'This action is permanent and cannot be undone. All associated data will be permanently removed.' : '';

  const {
    title = defaultTitle,
    description = defaultDesc,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  } = options || {};

  return new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col overflow-hidden ring-1 ring-black/5`}
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                type === 'danger' ? 'bg-red-50 text-red-600' :
                type === 'warning' ? 'bg-amber-50 text-amber-600' :
                'bg-blue-50 text-blue-600'
              }`}>
                {type === 'danger' && <Trash2 className="w-6 h-6" />}
                {type === 'warning' && <AlertTriangle className="w-6 h-6" />}
                {type === 'info' && <Info className="w-6 h-6" />}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">{title}</h3>
                <p className="text-[15px] font-medium text-slate-800 mb-1.5 leading-snug">{message}</p>
                {description && (
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                )}
              </div>
              <button
                onClick={() => {
                  toast.remove(t.id);
                  resolve(false);
                }}
                className="flex-shrink-0 -mr-2 -mt-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="bg-slate-50/80 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              onClick={() => {
                toast.remove(t.id);
                resolve(false);
              }}
              className="px-5 py-2.5 text-sm font-semibold text-slate-500 bg-transparent hover:bg-slate-200/50 hover:text-slate-700 rounded-xl transition-all focus:outline-none"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                toast.remove(t.id);
                resolve(true);
              }}
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'danger' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-[0_2px_10px_-3px_rgba(220,38,38,0.5)]' :
                type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-[0_2px_10px_-3px_rgba(217,119,6,0.5)]' :
                'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-[0_2px_10px_-3px_rgba(37,99,235,0.5)]'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: 'top-center',
      }
    );
  });
};
