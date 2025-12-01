'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  uploadedImage: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  uploadedImage,
  onImageSelect,
  onSubmit,
  onClose,
  theme = 'light',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 w-full max-w-md mx-4 animate-slide-up`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Import your image</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100'}`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="image-upload-input" className="block text-center mb-4 cursor-pointer">
            <div className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
              theme === 'dark' 
                ? 'border-gray-600 hover:border-blue-400' 
                : 'border-gray-300 hover:border-blue-500'
            }`}>
              {uploadedImage ? (
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="max-w-full max-h-64 mx-auto rounded"
                />
              ) : (
                <div className="text-center">
                  <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'} mb-2`}>
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Click to select image</span>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
              id="image-upload-input"
            />
          </label>
        </div>

        <button
          onClick={onSubmit}
          disabled={!uploadedImage}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            uploadedImage
              ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
              : theme === 'dark'
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      </div>
    </div>
  );
};

