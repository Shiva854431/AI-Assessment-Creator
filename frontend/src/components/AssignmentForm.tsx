'use client';

import { useState, useRef } from 'react';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Loader2, Upload, BookOpen, Calendar, Type, Hash, FileText, Sparkles } from 'lucide-react';

export default function AssignmentForm() {
  const { createAssignment, isLoading } = useAssignmentStore();
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    dueDate: '',
    questionType: '',
    numberOfQuestions: 5,
    marksPerQuestion: 10,
    instructions: '',
    fileUrl: '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const questionTypeOptions = [
    'Multiple Choice',
    'Short Answer',
    'Essay',
    'True/False',
    'Fill in the Blanks',
    'Matching',
    'Problem Solving',
    'Case Study',
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.questionType) newErrors.questionType = 'Please select a question type';
    if (formData.numberOfQuestions < 1) newErrors.numberOfQuestions = 'Must be at least 1';
    if (formData.numberOfQuestions > 50) newErrors.numberOfQuestions = 'Maximum 50 questions allowed';
    if (formData.marksPerQuestion < 1) newErrors.marksPerQuestion = 'Must be at least 1';
    if (!formData.instructions.trim()) newErrors.instructions = 'Instructions are required';
    if (formData.instructions.trim().length < 10) newErrors.instructions = 'Instructions must be at least 10 characters long';

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed', errors);
      return;
    }

    console.log('Form validation passed, creating assignment...');
    try {
      await createAssignment({
        ...formData,
        questionTypes: formData.questionType ? [formData.questionType] : [],
        dueDate: new Date(formData.dueDate).toISOString(),
      });

      // Reset form
      setFormData({
        title: '',
        subject: '',
        dueDate: '',
        questionType: '',
        numberOfQuestions: 5,
        marksPerQuestion: 10,
        instructions: '',
        fileUrl: '',
      });
      setErrors({});
      console.log('Assignment created successfully');
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload file');

      const { fileUrl } = await response.json();
      setFormData((prev) => ({ ...prev, fileUrl }));
    } catch (error) {
      console.error('File upload error:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <FileText className="w-4 h-4 text-blue-400" />
          Assignment Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-white placeholder-gray-500"
          placeholder="e.g., Mid-Term Examination"
        />
        {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <BookOpen className="w-4 h-4 text-purple-400" />
          Subject
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-white placeholder-gray-500"
          placeholder="e.g., Mathematics, Physics, Computer Science"
        />
        {errors.subject && <p className="text-red-400 text-sm">{errors.subject}</p>}
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Calendar className="w-4 h-4 text-green-400" />
          Due Date
        </label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-white"
        />
        {errors.dueDate && <p className="text-red-400 text-sm">{errors.dueDate}</p>}
      </div>

      {/* Question Type */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Type className="w-4 h-4 text-yellow-400" />
          Question Type
        </label>
        <select
          value={formData.questionType}
          onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-white"
        >
          <option value="" className="bg-gray-900">Select a question type</option>
          {questionTypeOptions.map((type) => (
            <option key={type} value={type} className="bg-gray-900">
              {type}
            </option>
          ))}
        </select>
        {errors.questionType && <p className="text-red-400 text-sm">{errors.questionType}</p>}
      </div>

      {/* Number of Questions */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Hash className="w-4 h-4 text-pink-400" />
          Number of Questions
        </label>
        <input
          type="number"
          value={formData.numberOfQuestions}
          onChange={(e) => setFormData({ ...formData, numberOfQuestions: parseInt(e.target.value) || 0 })}
          min="1"
          max="50"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-white"
        />
        {errors.numberOfQuestions && <p className="text-red-400 text-sm">{errors.numberOfQuestions}</p>}
      </div>

      {/* Marks Per Question */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Hash className="w-4 h-4 text-orange-400" />
          Marks Per Question
        </label>
        <input
          type="number"
          value={formData.marksPerQuestion}
          onChange={(e) => setFormData({ ...formData, marksPerQuestion: parseInt(e.target.value) || 0 })}
          min="1"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-white"
        />
        {errors.marksPerQuestion && <p className="text-red-400 text-sm">{errors.marksPerQuestion}</p>}
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Additional Instructions <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none text-white placeholder-gray-500"
          placeholder="Provide any specific instructions for the AI (minimum 10 characters)..."
        />
        {errors.instructions && <p className="text-red-400 text-sm">{errors.instructions}</p>}
      </div>

      {/* File Upload (Optional) */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
          <Upload className="w-4 h-4 text-indigo-400" />
          Reference Material (Optional)
        </label>
        <div 
          className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-blue-500/50 transition cursor-pointer bg-white/5"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploadingFile ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 mx-auto text-blue-400 mb-2 animate-spin" />
              <p className="text-gray-400 text-sm">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-400 text-sm">Upload PDF or text file (optional)</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        {formData.fileUrl && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <span className="text-green-400">✓</span>
            <span>File uploaded successfully</span>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, fileUrl: '' })}
              className="text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Assignment...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Question Paper
          </>
        )}
      </button>

      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 font-semibold mb-2">Please fix the following errors:</p>
          <ul className="text-red-300 text-sm space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
