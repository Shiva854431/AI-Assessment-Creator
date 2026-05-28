'use client';

import { QuestionPaper, Question, Section } from '@/store/useAssignmentStore';
import { Award, Clock, Target } from 'lucide-react';

export default function QuestionPaperView({ questionPaper }: { questionPaper: QuestionPaper }) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'hard':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200" id="question-paper">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-400" />
              <span className="text-sm font-medium text-gray-300">Official Assessment</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>{questionPaper.sections.reduce((acc, s) => acc + s.questions.length, 0)} Questions</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Target className="w-4 h-4 text-green-400" />
                <span>{questionPaper.totalMarks} Marks</span>
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-2">{questionPaper.title}</h1>
          <p className="text-xl text-gray-300">{questionPaper.subject}</p>
        </div>
      </div>

      {/* Student Info Section */}
      <div className="p-8 border-b-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Student Name</label>
            <div className="border-b-2 border-gray-300 pb-2 text-gray-900 font-medium"></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Roll Number</label>
            <div className="border-b-2 border-gray-300 pb-2 text-gray-900 font-medium"></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Section</label>
            <div className="border-b-2 border-gray-300 pb-2 text-gray-900 font-medium"></div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="p-8 space-y-8 bg-white">
        {questionPaper.sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-8 py-5 border-b-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
                  <p className="text-sm text-gray-600 mt-1 font-medium">{section.instruction}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-900">{section.questions.length}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Questions</p>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="p-8 space-y-6">
              {section.questions.map((question, questionIndex) => (
                <div key={question.id} className="flex gap-5 group">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
                      {questionIndex + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-gray-900 font-medium text-lg leading-relaxed">
                          {question.text}
                        </p>
                        
                        {/* MCQ Options */}
                        {question.type === 'mcq' && question.options && (
                          <div className="mt-4 space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <span className="text-gray-700">{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Matching Pairs */}
                        {question.type === 'matching' && question.pairs && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-500 mb-2">Column A</p>
                              {question.pairs.map((pair, pairIndex) => (
                                <div key={pairIndex} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <span className="text-gray-700">{pair.left}</span>
                                </div>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-500 mb-2">Column B</p>
                              {question.pairs.map((pair, pairIndex) => (
                                <div key={pairIndex} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <span className="text-gray-700">{pair.right}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Fill in the Blanks Answer */}
                        {question.type === 'fill-in-the-blanks' && question.correctAnswer && (
                          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Answer:</span> {question.correctAnswer}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          <span>{getDifficultyIcon(question.difficulty)}</span>
                          {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-xs font-semibold shadow-md">
                          {question.marks} marks
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-8 bg-gradient-to-br from-gray-50 to-white border-t-2 border-gray-200">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Examiner's Signature</label>
            <div className="border-b-2 border-gray-300 pb-3"></div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</label>
            <div className="border-b-2 border-gray-300 pb-3"></div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">Generated by AI Assessment Creator</p>
        </div>
      </div>
    </div>
  );
}
