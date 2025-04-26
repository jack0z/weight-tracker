'use client';

import { useState } from 'react';
import { useWeight } from '@/contexts/WeightContext';
import { 
  Trash, 
  Edit,
  SortAsc, 
  SortDesc, 
  ChevronLeft, 
  ChevronRight, 
  Loader
} from 'lucide-react';

function EntriesCard() {
  const { 
    entries, 
    isLoading, 
    error, 
    pagination,
    loadEntries,
    deleteEntry,
    updateEntry
  } = useWeight();

  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    date: '',
    weight: '',
    note: ''
  });

  // State for sorting
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });

  // Handle sort change
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    
    // Sort entries locally to improve UX
    // We don't need to reload from API for this
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    loadEntries({ page: newPage });
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  // Handle edit click
  const handleEditClick = (entry) => {
    setEditingId(entry._id);
    setEditFormData({
      date: entry.date.split('T')[0], // Get only the date part of ISO string
      weight: entry.weight,
      note: entry.note || ''
    });
  };

  // Handle edit cancel
  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({
      date: '',
      weight: '',
      note: ''
    });
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle edit submit
  const handleEditSubmit = async (e, id) => {
    e.preventDefault();
    
    try {
      await updateEntry(id, {
        date: editFormData.date,
        weight: parseFloat(editFormData.weight),
        note: editFormData.note
      });
      
      // Clear edit mode
      setEditingId(null);
      setEditFormData({
        date: '',
        weight: '',
        note: ''
      });
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  // Apply client-side sorting
  const sortedEntries = [...entries].sort((a, b) => {
    if (sortConfig.key === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortConfig.direction === 'asc' 
        ? dateA - dateB 
        : dateB - dateA;
    } else if (sortConfig.key === 'weight') {
      return sortConfig.direction === 'asc' 
        ? a.weight - b.weight 
        : b.weight - a.weight;
    }
    return 0;
  });

  // Render loading state
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-title">Weight Entries</div>
        <div className="card-body flex flex-col items-center justify-center min-h-[200px]">
          <Loader className="animate-spin h-8 w-8 text-gray-400" />
          <p className="mt-2">Loading entries...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="card">
        <div className="card-title">Weight Entries</div>
        <div className="card-body text-red-500">
          <p>Error loading entries: {error}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!entries || entries.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Weight Entries</div>
        <div className="card-body min-h-[200px] flex flex-col items-center justify-center">
          <p className="text-gray-500">No weight entries found.</p>
          <p className="text-gray-500 text-sm mt-1">
            Add your first weight entry using the form above.
          </p>
        </div>
      </div>
    );
  }

  // Render table
  return (
    <div className="card">
      <div className="card-title">Weight Entries</div>
      <div className="card-body">
        <div className="overflow-x-auto w-full">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-2 text-left">
                  <button 
                    className="flex items-center gap-1 text-gray-300 hover:text-white"
                    onClick={() => handleSort('date')}
                  >
                    Date
                    {sortConfig.key === 'date' && (
                      sortConfig.direction === 'asc' 
                        ? <SortAsc className="h-4 w-4" /> 
                        : <SortDesc className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-2 text-left">
                  <button 
                    className="flex items-center gap-1 text-gray-300 hover:text-white"
                    onClick={() => handleSort('weight')}
                  >
                    Weight
                    {sortConfig.key === 'weight' && (
                      sortConfig.direction === 'asc' 
                        ? <SortAsc className="h-4 w-4" /> 
                        : <SortDesc className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-2 text-left">Note</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map(entry => (
                <tr key={entry._id} className="border-b border-gray-800 hover:bg-gray-800">
                  {editingId === entry._id ? (
                    // Edit mode
                    <td colSpan={4} className="p-2">
                      <form 
                        onSubmit={(e) => handleEditSubmit(e, entry._id)}
                        className="flex flex-col space-y-2"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor="date" className="block text-sm text-gray-400">
                              Date
                            </label>
                            <input
                              type="date"
                              id="date"
                              name="date"
                              value={editFormData.date}
                              onChange={handleEditFormChange}
                              required
                              className="w-full p-2 bg-gray-700 rounded-md"
                            />
                          </div>
                          <div>
                            <label htmlFor="weight" className="block text-sm text-gray-400">
                              Weight
                            </label>
                            <input
                              type="number"
                              id="weight"
                              name="weight"
                              step="0.1"
                              min="0"
                              value={editFormData.weight}
                              onChange={handleEditFormChange}
                              required
                              className="w-full p-2 bg-gray-700 rounded-md"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="note" className="block text-sm text-gray-400">
                            Note
                          </label>
                          <input
                            type="text"
                            id="note"
                            name="note"
                            value={editFormData.note}
                            onChange={handleEditFormChange}
                            className="w-full p-2 bg-gray-700 rounded-md"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={handleEditCancel}
                            className="px-3 py-1 bg-gray-700 rounded-md"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 rounded-md"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    // View mode
                    <>
                      <td className="p-2">{formatDate(entry.date)}</td>
                      <td className="p-2">{entry.weight}</td>
                      <td className="p-2">{entry.note || '-'}</td>
                      <td className="p-2 text-right">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditClick(entry)}
                            className="p-1 text-gray-400 hover:text-blue-400"
                            aria-label="Edit entry"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry._id)}
                            className="p-1 text-gray-400 hover:text-red-400"
                            aria-label="Delete entry"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-400">
              Showing {entries.length} of {pagination.total} entries
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-1 rounded ${
                  pagination.page === 1 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center px-2">
                <span className="text-gray-400">
                  Page {pagination.page} of {pagination.pages}
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`p-1 rounded ${
                  pagination.page === pagination.pages 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EntriesCard; 