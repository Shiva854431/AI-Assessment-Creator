'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import QuestionPaperView from '@/components/QuestionPaperView';
import ChatBot from '@/components/ChatBot';
import { Loader2, ArrowLeft, RefreshCw, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchAssignment, currentAssignment, isLoading, regeneratePaper } = useAssignmentStore();
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAssignment(params.id as string);
    }
  }, [params.id]);

  const handleRegenerate = async () => {
    if (!params.id) return;
    setIsRegenerating(true);
    try {
      await regeneratePaper(params.id as string);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (isLoading && !currentAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-white text-lg">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!currentAssignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Assignment not found</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Assignments</span>
          </button>

          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {currentAssignment.title}
                </h1>
                <p className="text-lg text-gray-300">{currentAssignment.subject}</p>
              </div>

              <div className="flex items-center gap-3">
                {currentAssignment.status === 'completed' && (
                  <>
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRegenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5" />
                      )}
                      <span className="font-medium">Regenerate</span>
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition shadow-lg shadow-purple-500/25"
                    >
                      <Download className="w-5 h-5" />
                      <span className="font-medium">Download PDF</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {currentAssignment.status === 'processing' && (
          <div className="mb-6 bg-blue-500/20 border border-blue-500/30 rounded-xl p-6 flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <div>
              <p className="font-semibold text-blue-400">Generating Question Paper...</p>
              <p className="text-sm text-blue-300">This may take a moment. Please wait.</p>
            </div>
          </div>
        )}

        {currentAssignment.status === 'failed' && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <p className="font-semibold text-red-400">Failed to generate question paper</p>
              <p className="text-sm text-red-300">Please try regenerating the paper.</p>
            </div>
          </div>
        )}

        {/* Question Paper */}
        {currentAssignment.status === 'completed' && currentAssignment.questionPaper ? (
          <QuestionPaperView questionPaper={currentAssignment.questionPaper} />
        ) : (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-12 text-center">
            {currentAssignment.status === 'pending' ? (
              <>
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">Question paper generation will start soon...</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300 text-lg">No question paper generated yet</p>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* ChatBot */}
      <ChatBot context={currentAssignment?.subject} />
    </div>
  );
}
