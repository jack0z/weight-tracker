import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal component for sharing weight tracker data
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {string} props.shareLink - The generated share link
 * @param {string} props.theme - Current theme (dark or light)
 * @param {boolean} props.isPermalink - Whether this is a permalink share
 */
const ShareModal = ({ isOpen, onClose, shareLink, theme, isPermalink = false }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  
  if (!isOpen) return null;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setCopySuccess(true);
        toast.success("Link copied to clipboard", {
          style: {
            background: theme === 'dark' ? "#313338" : "#ffffff",
            color: theme === 'dark' ? "#e3e5e8" : "#374151",
            border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
          }
        });
        
        setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy link", {
          style: {
            background: theme === 'dark' ? "#313338" : "#ffffff",
            color: theme === 'dark' ? "#e3e5e8" : "#374151",
            border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
          }
        });
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className={`w-full max-w-md mx-4 ${theme === 'dark' ? 'bg-[#313338] text-white border-[#1e1f22]' : 'bg-white'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span>{isPermalink ? 'Permalink Created' : 'Share Link Created'}</span>
            <Button 
              onClick={onClose} 
              className={`p-1 h-8 w-8 rounded-full ${theme === 'dark' ? 'bg-[#4f545c] hover:bg-[#5d6269] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              <X size={16} />
            </Button>
          </CardTitle>
          <CardDescription className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            {isPermalink 
              ? 'This permalink will always show your latest weight data.' 
              : 'This link will expire in 30 days.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className={`flex items-center mt-2 p-2 rounded-md ${theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-gray-100'}`}>
              <div className="flex-1 truncate text-sm">
                {shareLink}
              </div>
              <Button 
                onClick={handleCopy} 
                className={`ml-2 ${theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
              >
                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
          
          <div className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>Anyone with this link can view your weight tracker data.</p>
            <p className="mt-2">
              {isPermalink 
                ? 'Sharing again with permalink will update the data shown by this link.' 
                : 'Create a new share link when you want to share updated data.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareModal; 