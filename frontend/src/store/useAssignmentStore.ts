import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type?: 'mcq' | 'short-answer' | 'essay' | 'fill-in-the-blanks' | 'matching';
  options?: string[];
  correctAnswer?: string;
  pairs?: { left: string; right: string }[];
}

export interface Section {
  title: string;
  instruction: string;
  questions: Question[];
}

export interface QuestionPaper {
  title: string;
  subject: string;
  totalMarks: number;
  sections: Section[];
}

export interface Assignment {
  _id?: string;
  title?: string;
  subject?: string;
  dueDate?: string;
  questionTypes?: string[];
  numberOfQuestions?: number;
  marksPerQuestion?: number;
  instructions?: string;
  fileUrl?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  questionPaper?: QuestionPaper;
  createdAt?: string;
  updatedAt?: string;
}

interface AssignmentState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;

  setAssignments: (assignments: Assignment[]) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  createAssignment: (assignmentData: Partial<Assignment>) => Promise<void>;
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  regeneratePaper: (id: string) => Promise<void>;
  
  connectSocket: () => void;
  disconnectSocket: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  error: null,
  socket: null,

  setAssignments: (assignments) => set({ assignments }),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  createAssignment: async (assignmentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create assignment');
      }

      const { assignment } = await response.json();
      set((state) => ({
        assignments: [assignment, ...state.assignments],
        currentAssignment: assignment,
        isLoading: false,
      }));

      // Join socket room for this assignment
      const { socket } = get();
      if (socket) {
        socket.emit('join-assignment', assignment._id);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/assignments`);
      if (!response.ok) throw new Error('Failed to fetch assignments');

      const { assignments } = await response.json();
      set({ assignments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assignments',
        isLoading: false,
      });
    }
  },

  fetchAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/api/assignments/${id}`);
      if (!response.ok) throw new Error('Failed to fetch assignment');

      const { assignment } = await response.json();
      set({ currentAssignment: assignment, isLoading: false });

      // Join socket room for this assignment
      const { socket } = get();
      if (socket) {
        socket.emit('join-assignment', id);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch assignment',
        isLoading: false,
      });
    }
  },

  regeneratePaper: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { currentAssignment } = get();
      if (!currentAssignment) {
        throw new Error('No assignment data available');
      }

      const response = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentAssignment.title,
          subject: currentAssignment.subject,
          questionTypes: currentAssignment.questionTypes,
          numberOfQuestions: currentAssignment.numberOfQuestions,
          marksPerQuestion: currentAssignment.marksPerQuestion,
          instructions: currentAssignment.instructions,
        }),
      });
      if (!response.ok) throw new Error('Failed to regenerate paper');

      const { questionPaper } = await response.json();
      
      // Update current assignment with new question paper
      set({
        currentAssignment: {
          ...currentAssignment,
          questionPaper,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to regenerate paper',
        isLoading: false,
      });
      throw error;
    }
  },

  connectSocket: () => {
    const socket = io(WS_URL);
    
    socket.on('assignment-status', ({ assignmentId, status, questionPaper, error }) => {
      const { assignments, currentAssignment } = get();
      
      // Update assignments list
      const updatedAssignments = assignments.map((a) =>
        a._id === assignmentId
          ? { ...a, status, questionPaper: questionPaper || a.questionPaper }
          : a
      );
      set({ assignments: updatedAssignments });

      // Update current assignment if it matches
      if (currentAssignment && currentAssignment._id === assignmentId) {
        set({
          currentAssignment: {
            ...currentAssignment,
            status,
            questionPaper: questionPaper || currentAssignment.questionPaper,
          },
        });
      }

      if (error) {
        set({ error });
      }
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
