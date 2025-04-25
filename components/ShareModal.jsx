import { useState } from 'react';
import { Copy, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal component for sharing weight tracker data
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Function to close the modal
 * @param {string} props.shareLink - The generated share link
 * @param {string} props.theme - Current theme (dark or light)
 * @param {boolean} props.isPermalink - Whether this is a permalink
 */
export default function ShareModal({ isOpen, onClose, shareLink, theme, isPermalink = false }) {
  const [isCopied, setIsCopied] = useState(false);
  
  if (!isOpen) return null;
  
  // Define colors based on theme
  const colors = {
    bg: theme === 'dark' ? 'bg-[#313338]' : 'bg-[#EAE4CA]',
    border: theme === 'dark' ? 'border-[#1e1f22]' : 'border-[#DDD8BE]',
    text: theme === 'dark' ? 'text-[#e3e5e8]' : 'text-[#5C6A72]',
    muted: theme === 'dark' ? 'text-[#b5bac1]' : 'text-[#829181]',
    primaryButton: theme === 'dark' ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#8DA101] hover:bg-[#798901]',
    inputBg: theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-[#E5DFC5]',
    noteBg: theme === 'dark' ? 'bg-[#2b2d31]' : 'bg-[#F3EAD3]',
    highlight: theme === 'dark' ? 'text-[#57f287]' : 'text-[#126134]',
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setIsCopied(true);
        toast.success("Link copied to clipboard", {
          style: {
            background: theme === 'dark' ? "#313338" : "#ffffff",
            color: theme === 'dark' ? "#e3e5e8" : "#374151",
            border: `1px solid ${theme === 'dark' ? "#1e1f22" : "#e5e7eb"}`,
          }
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
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
      <div className={`${colors.bg} ${colors.border} border rounded-lg shadow-lg w-full max-w-md mx-4`}>
        <div className="flex justify-between items-center border-b p-4">
          <h3 className={`text-lg font-medium ${colors.text}`}>
            {isPermalink ? "Permalink Created" : "Share Your Progress"}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className={`mb-4 ${colors.muted}`}>
            {isPermalink 
              ? "This is your permanent link that will always show your latest data:" 
              : "Share this link with others to let them view your weight tracking data in read-only mode:"}
          </p>
          
          <div className="flex items-center mb-6">
            <input 
              type="text" 
              value={shareLink} 
              readOnly 
              className={`flex-1 ${colors.inputBg} ${colors.border} ${colors.text} p-2 rounded-l-md`}
            />
            <button 
              onClick={copyToClipboard}
              className={`p-2 ${colors.primaryButton} text-white rounded-r-md`}
              aria-label="Copy to clipboard"
            >
              <Copy size={18} />
            </button>
          </div>
          
          {isPermalink && (
            <div className={`p-3 rounded-md ${colors.noteBg} ${colors.highlight} text-sm mb-4`}>
              <p className="mb-1">📌 About Permalinks:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>This link will <strong>always</strong> show your latest data</li>
                <li>You can bookmark this link or share it anywhere</li>
                <li>Creating a new permalink will override this one</li>
                <li>Perfect for sharing on social media or in your bio</li>
              </ul>
            </div>
          )}
          
          <div className={`p-3 rounded-md ${colors.noteBg} ${colors.muted} text-sm`}>
            <p className="mb-1">⚠️ Important notes:</p>
            <ul className="list-disc pl-5 space-y-1">
              {!isPermalink && <li>The link expires in 30 days</li>}
              <li>Shared data is stored locally in your browser</li>
              <li>Anyone with this link can view your data but cannot edit it</li>
              <li>Updates to your tracker will be visible to anyone with the link</li>
              {isPermalink && <li>This permalink will be updated whenever you share</li>}
            </ul>
          </div>
        </div>
        
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${colors.primaryButton} text-white rounded-md`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
} 