'use client';

import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Clock, CheckCircle, XCircle, Loader2, Eye, FileText, Calendar } from 'lucide-react';

export default function AssignmentList() {
  const router = useRouter();
  const { assignments, isLoading } = useAssignmentStore();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'processing':
        return 'Processing';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
        <p className="text-gray-400">Loading assignments...</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-500 mb-4" />
        <p className="text-gray-400">No assignments created yet</p>
        <p className="text-gray-500 text-sm mt-2">Create your first assignment to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
      {assignments.map((assignment) => (
        <div
          key={assignment._id || assignment.title}
          className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-white/20 transition cursor-pointer group"
          onClick={() => assignment._id && router.push(`/assignment/${assignment._id}`)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition">
                {assignment.title || 'Untitled Assignment'}
              </h3>
              <p className="text-sm text-gray-400">{assignment.subject || 'No subject'}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(
                assignment.status || 'pending'
              )}`}
            >
              {getStatusIcon(assignment.status || 'pending')}
              {getStatusText(assignment.status || 'pending')}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>{assignment.numberOfQuestions || 0} questions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400">★</span>
                <span>{assignment.marksPerQuestion || 0} marks each</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-blue-400 opacity-0 group-hover:opacity-100 transition">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">View</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
