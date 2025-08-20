import { Calendar, Check, Eye, User, X } from 'lucide-react';
import { useState } from 'react';

const SubmissionCard = ({ submission, onApprove, onReject, loading }) => {
  const [showImages, setShowImages] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Product Submission #{submission.id}
              </h3>
              <p className="text-sm text-gray-500">
                Submitted {formatDate(submission.submitted_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">User #{submission.submitted_by_user_id}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Barcode
            </label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded">
              {submission.barcode}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type
            </label>
            <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
              {submission.typeProduct || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Images Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Product Images
            </label>
            <button
              onClick={() => setShowImages(!showImages)}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Eye className="h-4 w-4" />
              <span>{showImages ? 'Hide' : 'Show'} Images</span>
            </button>
          </div>
          
          {showImages && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Front Image
                </label>
                <img
                  src={submission.image_front_url}
                  alt="Product Front"
                  className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                  }}
                />
              </div>
              {submission.image_ingredients_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ingredients Image
                  </label>
                  <img
                    src={submission.image_ingredients_url}
                    alt="Product Ingredients"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {submission.status === 'pending' && (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={() => onApprove(submission.id)}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onReject(submission.id)}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-4 w-4" />
            <span>Reject</span>
          </button>
        </div>
      </div>
      )
}

    </div>

);
}
export default SubmissionCard;