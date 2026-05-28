'use client';

import { useEffect } from 'react';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import AssignmentForm from '@/components/AssignmentForm';
import AssignmentList from '@/components/AssignmentList';
import { Loader2, FileText, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  const { assignments, isLoading, fetchAssignments, connectSocket } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
    connectSocket();

    return () => {
      useAssignmentStore.getState().disconnectSocket();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-white/90 text-sm font-medium">AI-Powered Assessment Tool</span>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            AI Assessment Creator
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Create professional, intelligent question papers in seconds with our advanced AI technology
          </p>

          {/* Feature highlights */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <div className="flex items-center gap-2 text-gray-400">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span className="text-sm">Instant Generation</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-sm">Professional Format</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-sm">AI-Powered</span>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Assignment Form */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create Assignment</h2>
                <p className="text-gray-400 text-sm">Fill in the details to generate your question paper</p>
              </div>
            </div>
            <AssignmentForm />
          </div>

          {/* Assignment List */}
          <div className="backdrop-blur-sm bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Recent Assignments</h2>
                  <p className="text-gray-400 text-sm">View and manage your generated papers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">{assignments.length}</p>
                <p className="text-gray-400 text-sm">Total</p>
              </div>
            </div>
            
            {isLoading && assignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                <p className="text-gray-400">Loading assignments...</p>
              </div>
            ) : (
              <AssignmentList />
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Built with Next.js, TypeScript, and AI technology</p>
        </footer>
      </div>
    </main>
  );
}
