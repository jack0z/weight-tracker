'use client';

import { useState } from 'react';
import { useWeight } from '@/contexts/WeightContext';
import { toast } from 'sonner';

function EntryFormCard() {
  const { createEntry } = useWeight();
  
  // State for form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
    weight: '',
    note: ''
  });
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate weight
      const weightValue = parseFloat(formData.weight);
      if (isNaN(weightValue) || weightValue <= 0) {
        toast.error('Please enter a valid weight greater than 0');
        return;
      }
      
      // Create entry
      await createEntry({
        date: formData.date,
        weight: weightValue,
        note: formData.note
      });
      
      // Clear form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        note: ''
      });
      
      // Show success message
      toast.success('Weight entry added successfully');
      
    } catch (error) {
      console.error('Error adding entry:', error);
      
      // Show error message
      if (error.message && error.message.includes('exists')) {
        toast.error('An entry already exists for this date');
      } else {
        toast.error(error.message || 'Failed to add weight entry');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="card-title">Add Weight Entry</div>
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates
                required
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-300 mb-1">
                Weight
              </label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Enter weight"
                step="0.1"
                min="0"
                required
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-300 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              id="note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Add a note about this entry"
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 font-medium transition-colors ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EntryFormCard; 