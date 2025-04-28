import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function ShareModal({ isOpen, onClose, shareLink, theme }) {
  const [copied, setCopied] = useState(false);

  // Reset copied state when modal opens/closes
  useEffect(() => {
    setCopied(false);
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className={`mx-auto max-w-sm rounded-lg p-6 ${theme === 'dark' ? 'bg-[#313338] text-white' : 'bg-white text-gray-900'}`}>
          <Dialog.Title className="text-lg font-medium mb-4">
            Share Your Weight Tracker
          </Dialog.Title>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Share this link with others to let them view your weight tracking progress:
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className={`flex-1 p-2 rounded text-sm ${theme === 'dark' ? 'bg-[#1e1f22] text-white' : 'bg-gray-100'}`}
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-[#5865f2] hover:bg-[#4752c4] text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded ${
                  theme === 'dark'
                    ? 'bg-[#4f545c] hover:bg-[#5d6269] text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}