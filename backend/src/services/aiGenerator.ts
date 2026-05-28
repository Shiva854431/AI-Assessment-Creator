import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key-for-demo');
  }
  return genAI;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type?: 'mcq' | 'short-answer' | 'essay' | 'fill-in-the-blanks' | 'matching';
  options?: string[]; // For MCQs
  correctAnswer?: string; // For MCQs and fill-in-the-blanks
  pairs?: { left: string; right: string }[]; // For matching questions
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

// Demo mode - generate mock questions without OpenAI API
function generateMockQuestionPaper(params: {
  title: string;
  subject: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
  questionTypes?: string[];
}): QuestionPaper {
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const questionsPerSection = Math.ceil(params.numberOfQuestions / 2);
  
  // Subject-specific question templates
  const subjectTemplates: Record<string, string[]> = {
    'mathematics': [
      'Solve the following equation: 2x + 5 = 15',
      'Find the derivative of f(x) = x³ + 2x² - 5x + 1',
      'Calculate the area of a circle with radius 7 cm',
      'Simplify the expression: (3x²)(2x⁻³)',
      'Find the value of x if log₂(x) = 5',
      'Solve the system of equations: x + y = 10, 2x - y = 5',
      'Calculate the probability of getting heads when flipping a coin twice',
      'Find the limit of (x² - 4)/(x - 2) as x approaches 2',
      'Determine the integral of ∫(3x² + 2x)dx',
      'Solve for x in the quadratic equation: x² - 5x + 6 = 0',
    ],
    'physics': [
      'Calculate the force required to accelerate a 5 kg mass at 3 m/s²',
      'Determine the kinetic energy of a 2 kg object moving at 10 m/s',
      'Find the wavelength of light with frequency 6 × 10¹⁴ Hz',
      'Calculate the electric field strength at a distance of 2 m from a 5 C charge',
      'Determine the period of a pendulum with length 1 m',
      'Calculate the work done to move a 10 kg object 5 m vertically',
      'Find the resistance of a wire with resistivity 2 × 10⁻⁸ Ωm, length 10 m, and cross-sectional area 2 mm²',
      'Determine the momentum of a 3 kg object moving at 8 m/s',
      'Calculate the gravitational force between two 10 kg masses 5 m apart',
      'Find the power consumed by a 100 W bulb operating for 2 hours',
    ],
    'chemistry': [
      'Balance the chemical equation: H₂ + O₂ → H₂O',
      'Calculate the molar mass of H₂SO₄',
      'Determine the pH of a solution with [H⁺] = 1 × 10⁻⁵ M',
      'Find the number of moles in 50 g of NaCl',
      'Calculate the concentration of a solution with 10 g solute in 100 mL solvent',
      'Determine the oxidation state of sulfur in H₂SO₄',
      'Calculate the enthalpy change for the reaction: 2H₂ + O₂ → 2H₂O',
      'Find the empirical formula of a compound with 40% C, 6.7% H, and 53.3% O',
      'Determine the limiting reactant when 2 mol H₂ reacts with 1 mol O₂',
      'Calculate the volume of CO₂ produced at STP from 10 g of CaCO₃',
    ],
    'biology': [
      'Describe the structure and function of mitochondria',
      'Explain the process of photosynthesis in plants',
      'What are the stages of cell division in mitosis?',
      'Describe the structure of DNA and its role in genetics',
      'Explain the difference between prokaryotic and eukaryotic cells',
      'What is the function of enzymes in biological reactions?',
      'Describe the process of protein synthesis',
      'Explain the concept of natural selection',
      'What are the main components of a cell membrane?',
      'Describe the human circulatory system',
    ],
    'computer science': [
      'Write a function to find the factorial of a number',
      'Explain the difference between BFS and DFS algorithms',
      'What is the time complexity of binary search?',
      'Describe the concept of object-oriented programming',
      'Explain the difference between TCP and UDP protocols',
      'What is a database transaction?',
      'Describe the structure of a binary search tree',
      'Explain the concept of recursion with an example',
      'What is the difference between HTTP and HTTPS?',
      'Describe the process of software development lifecycle',
    ],
    'history': [
      'Describe the causes and effects of the Industrial Revolution',
      'What were the main events of World War II?',
      'Explain the significance of the French Revolution',
      'Describe the impact of colonialism on modern nations',
      'What were the key features of the Renaissance period?',
      'Explain the causes of the American Civil War',
      'Describe the role of trade routes in ancient civilizations',
      'What was the impact of the printing press on society?',
      'Explain the concept of feudalism in medieval Europe',
      'Describe the major achievements of ancient Greek civilization',
    ],
    'current affairs': [
      'What are the major geopolitical challenges facing the world today?',
      'Discuss the impact of climate change on global economies',
      'Explain the significance of recent technological advancements',
      'What are the key issues in international trade relations?',
      'Describe the current state of global healthcare systems',
      'What are the major economic trends in emerging markets?',
      'Discuss the role of social media in modern politics',
      'Explain the impact of artificial intelligence on employment',
      'What are the key environmental concerns of the 21st century?',
      'Describe the current state of space exploration efforts',
    ],
  };
  
  // Get templates for the subject or use generic templates
  const getTemplates = (subject: string): string[] => {
    const lowerSubject = subject.toLowerCase();
    for (const [key, templates] of Object.entries(subjectTemplates)) {
      if (lowerSubject.includes(key)) {
        return templates;
      }
    }
    // Generic templates if no specific match
    return [
      `Explain the fundamental concepts of ${subject}`,
      `What are the main applications of ${subject} in real-world scenarios?`,
      `Describe the key principles and theories in ${subject}`,
      `How does ${subject} relate to other disciplines?`,
      `What are the current challenges and future directions in ${subject}?`,
      `Analyze the historical development of ${subject}`,
      `Compare different methodologies used in ${subject}`,
      `Evaluate the impact of ${subject} on society`,
      `What are the ethical considerations in ${subject}?`,
      `Design a practical application using concepts from ${subject}`,
    ];
  };

  const templates = getTemplates(params.subject);
  
  const generateQuestion = (index: number, difficulty: string, questionType?: string): Question => {
    const templateIndex = index % templates.length;
    let question = templates[templateIndex];
    
    // Map question types to standardized format
    const typeMap: Record<string, string> = {
      'multiple choice': 'mcq',
      'mcq': 'mcq',
      'fill in the blanks': 'fill-in-the-blanks',
      'fill-in-the-blanks': 'fill-in-the-blanks',
      'matching': 'matching',
      'true/false': 'true-false',
      'true-false': 'true-false',
      'short answer': 'short-answer',
      'essay': 'essay',
      'case study': 'case-study',
      'case-study': 'case-study',
      'problem solving': 'problem-solving',
      'problem-solving': 'problem-solving',
    };
    
    const normalizedType = questionType ? typeMap[questionType.toLowerCase()] || 'short-answer' : 'short-answer';
    
    console.log(`Generating question ${index + 1} with type: ${questionType} -> normalized: ${normalizedType}`);
    
    // Add difficulty-specific modifiers
    if (difficulty === 'hard') {
      question += ' Provide detailed analysis and justification.';
    } else if (difficulty === 'medium') {
      question += ' Explain your reasoning.';
    }
    
    if (normalizedType === 'mcq') {
      // Generate MCQ with options
      const options = generateMCQOptions(params.subject, question);
      return {
        id: `q-${index + 1}`,
        text: question,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        marks: params.marksPerQuestion,
        type: 'mcq',
        options: options,
        correctAnswer: options[0], // First option is correct
      };
    }
    
    if (normalizedType === 'fill-in-the-blanks') {
      // Generate fill-in-the-blanks question
      const blankAnswer = generateBlankAnswer(params.subject, question);
      const questionWithBlank = question.replace(/^(.+?)(\s+is\s+|\s+are\s+|\s+was\s+|\s+were\s+|\s+has\s+|\s+have\s+|\s+will\s+|\s+can\s+)(.+)$/, '$1$2_____$3');
      return {
        id: `q-${index + 1}`,
        text: questionWithBlank,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        marks: params.marksPerQuestion,
        type: 'fill-in-the-blanks',
        correctAnswer: blankAnswer,
      };
    }
    
    if (normalizedType === 'matching') {
      // Generate matching question
      const pairs = generateMatchingPairs(params.subject, question);
      return {
        id: `q-${index + 1}`,
        text: 'Match the following items:',
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        marks: params.marksPerQuestion,
        type: 'matching',
        pairs: pairs,
      };
    }
    
    if (normalizedType === 'true-false') {
      // Generate true/false question
      return {
        id: `q-${index + 1}`,
        text: question,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        marks: params.marksPerQuestion,
        type: 'mcq',
        options: ['True', 'False'],
        correctAnswer: 'True',
      };
    }
    
    if (normalizedType === 'case-study') {
      // Generate case study question
      const caseStudyText = generateCaseStudy(params.subject, question);
      return {
        id: `q-${index + 1}`,
        text: caseStudyText,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        marks: params.marksPerQuestion,
        type: 'essay',
      };
    }
    
    if (normalizedType === 'problem-solving') {
      // Generate problem solving question
      const problemText = generateProblemSolving(params.subject, question);
      return {
        id: `q-${index + 1}`,
        text: problemText,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        marks: params.marksPerQuestion,
        type: 'short-answer',
      };
    }
    
    return {
      id: `q-${index + 1}`,
      text: question,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      marks: params.marksPerQuestion,
      type: normalizedType as any,
    };
  };

  const generateCaseStudy = (subject: string, question?: string): string => {
    const lowerSubject = subject.toLowerCase();
    
    if (lowerSubject.includes('math')) {
      return `Case Study: A company needs to optimize its production process. The production function is given by P(x) = 2x² + 5x + 10, where x is the number of units produced. ${question || 'Analyze the production function and determine the optimal production level.'}`;
    } else if (lowerSubject.includes('physics')) {
      return `Case Study: A car manufacturer is designing a new safety system. The car must decelerate from 60 km/h to 0 in 3 seconds. ${question || 'Calculate the required deceleration force and analyze the safety implications.'}`;
    } else if (lowerSubject.includes('chemistry')) {
      return `Case Study: A pharmaceutical company is developing a new drug. The reaction rate depends on temperature and concentration. ${question || 'Analyze the reaction kinetics and determine optimal conditions.'}`;
    } else if (lowerSubject.includes('biology')) {
      return `Case Study: A patient presents with unusual symptoms. Medical tests reveal elevated enzyme levels. ${question || 'Analyze the potential causes and recommend diagnostic procedures.'}`;
    } else if (lowerSubject.includes('computer')) {
      return `Case Study: A tech startup is building a scalable web application. They need to handle millions of users. ${question || 'Design the system architecture and analyze potential bottlenecks.'}`;
    } else {
      return `Case Study: ${question || 'Analyze the given scenario and provide recommendations based on the subject matter.'}`;
    }
  };

  const generateProblemSolving = (subject: string, question?: string): string => {
    const lowerSubject = subject.toLowerCase();
    
    if (lowerSubject.includes('math')) {
      return `Problem: Solve the following optimization problem. A farmer has 100 meters of fencing to enclose a rectangular area. ${question || 'Find the dimensions that maximize the area.'}`;
    } else if (lowerSubject.includes('physics')) {
      return `Problem: A ball is thrown upward with an initial velocity of 20 m/s. ${question || 'Calculate the maximum height reached and the time taken to reach it.'}`;
    } else if (lowerSubject.includes('chemistry')) {
      return `Problem: In a chemical reaction, 2 moles of A react with 3 moles of B to produce C. ${question || 'Calculate the limiting reactant and the theoretical yield.'}`;
    } else if (lowerSubject.includes('biology')) {
      return `Problem: In a population study, the growth rate follows an exponential model. ${question || 'Calculate the population after 5 years given initial conditions.'}`;
    } else if (lowerSubject.includes('computer')) {
      return `Problem: Design an algorithm to find the shortest path in a weighted graph. ${question || 'Explain your approach and analyze its time complexity.'}`;
    } else {
      return `Problem: ${question || 'Solve the given problem using appropriate methods and show your work.'}`;
    }
  };

  const generateBlankAnswer = (subject: string, question?: string): string => {
    const lowerSubject = subject.toLowerCase();
    
    // Generate answer based on question content
    if (question) {
      if (question.includes('equation') || question.includes('solve') || question.includes('x')) {
        return '5';
      }
      if (question.includes('derivative') || question.includes('rate')) {
        return '6x + 4';
      }
      if (question.includes('integral') || question.includes('area')) {
        return 'x³ + 2x²';
      }
      if (question.includes('force') || question.includes('F = ma')) {
        return '15 N';
      }
      if (question.includes('energy') || question.includes('kinetic')) {
        return '100 J';
      }
      if (question.includes('velocity') || question.includes('speed')) {
        return '10 m/s';
      }
      if (question.includes('molar mass') || question.includes('H₂SO₄')) {
        return '98 g/mol';
      }
      if (question.includes('pH') || question.includes('acid')) {
        return '5';
      }
      if (question.includes('cell') || question.includes('powerhouse')) {
        return 'mitochondria';
      }
      if (question.includes('DNA') || question.includes('genetic')) {
        return 'deoxyribonucleic acid';
      }
      if (question.includes('photosynthesis') || question.includes('chloroplast')) {
        return 'chloroplast';
      }
      if (question.includes('algorithm') || question.includes('complexity')) {
        return 'O(n)';
      }
      if (question.includes('database') || question.includes('transaction')) {
        return 'ACID';
      }
      if (question.includes('CPU') || question.includes('processor')) {
        return 'Central Processing Unit';
      }
    }
    
    // Fallback to subject-specific answers
    if (lowerSubject.includes('math')) {
      return '5';
    } else if (lowerSubject.includes('physics')) {
      return '15 N';
    } else if (lowerSubject.includes('chemistry')) {
      return '98 g/mol';
    } else if (lowerSubject.includes('biology')) {
      return 'mitochondria';
    } else if (lowerSubject.includes('computer')) {
      return 'O(n)';
    } else if (lowerSubject.includes('current')) {
      return 'climate change';
    } else {
      return 'answer';
    }
  };

  const generateMatchingPairs = (subject: string, question?: string): { left: string; right: string }[] => {
    const lowerSubject = subject.toLowerCase();
    
    // Generate pairs based on question content
    if (question) {
      if (question.includes('derivative') || question.includes('integral') || question.includes('math')) {
        return [
          { left: 'Derivative', right: 'Rate of change' },
          { left: 'Integral', right: 'Area under curve' },
          { left: 'Pi', right: '3.14159' },
          { left: 'Zero', right: 'Additive identity' },
        ];
      }
      if (question.includes('force') || question.includes('energy') || question.includes('physics')) {
        return [
          { left: 'Force', right: 'Mass × Acceleration' },
          { left: 'Energy', right: 'Joule' },
          { left: 'Velocity', right: 'Speed with direction' },
          { left: 'Gravity', right: '9.8 m/s²' },
        ];
      }
      if (question.includes('molecule') || question.includes('chemical') || question.includes('chemistry')) {
        return [
          { left: 'H2O', right: 'Water' },
          { left: 'NaCl', right: 'Salt' },
          { left: 'CO2', right: 'Carbon dioxide' },
          { left: 'pH', right: 'Acidity measure' },
        ];
      }
      if (question.includes('cell') || question.includes('organism') || question.includes('biology')) {
        return [
          { left: 'Mitochondria', right: 'Powerhouse of cell' },
          { left: 'DNA', right: 'Genetic material' },
          { left: 'Photosynthesis', right: 'Food making' },
          { left: 'Nucleus', right: 'Control center' },
        ];
      }
      if (question.includes('algorithm') || question.includes('programming') || question.includes('computer')) {
        return [
          { left: 'CPU', right: 'Central Processing Unit' },
          { left: 'RAM', right: 'Random Access Memory' },
          { left: 'Algorithm', right: 'Step-by-step procedure' },
          { left: 'Bug', right: 'Software error' },
        ];
      }
    }
    
    // Fallback to subject-specific pairs
    if (lowerSubject.includes('math')) {
      return [
        { left: 'Derivative', right: 'Rate of change' },
        { left: 'Integral', right: 'Area under curve' },
        { left: 'Pi', right: '3.14159' },
        { left: 'Zero', right: 'Additive identity' },
      ];
    } else if (lowerSubject.includes('physics')) {
      return [
        { left: 'Force', right: 'Mass × Acceleration' },
        { left: 'Energy', right: 'Joule' },
        { left: 'Velocity', right: 'Speed with direction' },
        { left: 'Gravity', right: '9.8 m/s²' },
      ];
    } else if (lowerSubject.includes('chemistry')) {
      return [
        { left: 'H2O', right: 'Water' },
        { left: 'NaCl', right: 'Salt' },
        { left: 'CO2', right: 'Carbon dioxide' },
        { left: 'pH', right: 'Acidity measure' },
      ];
    } else if (lowerSubject.includes('biology')) {
      return [
        { left: 'Mitochondria', right: 'Powerhouse of cell' },
        { left: 'DNA', right: 'Genetic material' },
        { left: 'Photosynthesis', right: 'Food making' },
        { left: 'Nucleus', right: 'Control center' },
      ];
    } else if (lowerSubject.includes('computer')) {
      return [
        { left: 'CPU', right: 'Central Processing Unit' },
        { left: 'RAM', right: 'Random Access Memory' },
        { left: 'Algorithm', right: 'Step-by-step procedure' },
        { left: 'Bug', right: 'Software error' },
      ];
    } else if (lowerSubject.includes('current')) {
      return [
        { left: 'Climate Change', right: 'Global warming' },
        { left: 'AI', right: 'Artificial Intelligence' },
        { left: 'GDP', right: 'Gross Domestic Product' },
        { left: 'UN', right: 'United Nations' },
      ];
    } else {
      return [
        { left: 'A', right: 'First letter' },
        { left: 'B', right: 'Second letter' },
        { left: 'C', right: 'Third letter' },
        { left: 'D', right: 'Fourth letter' },
      ];
    }
  };

  const generateMCQOptions = (subject: string, question?: string): string[] => {
    const lowerSubject = subject.toLowerCase();
    
    // Generate options based on question content
    if (question) {
      if (question.includes('equation') || question.includes('solve') || question.includes('x')) {
        const answers = ['5', '10', '15', '20'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('derivative') || question.includes('integral')) {
        const answers = ['3x² + 4x', '6x + 4', 'x³ + 2x²', '2x + 1'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('area') || question.includes('circle')) {
        const answers = ['154 cm²', '49π cm²', '38.5 cm²', '196 cm²'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('force') || question.includes('acceleration')) {
        const answers = ['15 N', '30 N', '45 N', '60 N'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('energy') || question.includes('kinetic')) {
        const answers = ['50 J', '100 J', '150 J', '200 J'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('molar mass') || question.includes('moles')) {
        const answers = ['18 g/mol', '36 g/mol', '54 g/mol', '98 g/mol'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('cell') || question.includes('mitochondria')) {
        const answers = ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'];
        return answers.sort(() => Math.random() - 0.5);
      }
      if (question.includes('complexity') || question.includes('algorithm')) {
        const answers = ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'];
        return answers.sort(() => Math.random() - 0.5);
      }
    }
    
    // Fallback to subject-specific options
    if (lowerSubject.includes('math')) {
      return ['5', '10', '15', '20'];
    } else if (lowerSubject.includes('physics')) {
      return ['15 N', '30 N', '45 N', '60 N'];
    } else if (lowerSubject.includes('chemistry')) {
      return ['18 g/mol', '36 g/mol', '54 g/mol', '98 g/mol'];
    } else if (lowerSubject.includes('biology')) {
      return ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'];
    } else if (lowerSubject.includes('computer')) {
      return ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'];
    } else {
      return ['Option A', 'Option B', 'Option C', 'Option D'];
    }
  };

  const sectionAQuestions: Question[] = Array.from({ length: Math.min(questionsPerSection, params.numberOfQuestions) }, (_, i) => {
    // Cycle through question types if multiple are provided
    const questionType = params.questionTypes && params.questionTypes.length > 0
      ? params.questionTypes[i % params.questionTypes.length]
      : undefined;
    console.log(`Section A - Question ${i + 1}: Using question type ${questionType} (index ${i % (params.questionTypes?.length || 1)} of ${params.questionTypes?.length || 0})`);
    return generateQuestion(i, difficulties[i % difficulties.length], questionType);
  });

  const remainingQuestions = params.numberOfQuestions - sectionAQuestions.length;
  const sectionBQuestions: Question[] = Array.from({ length: remainingQuestions }, (_, i) => {
    // Cycle through question types if multiple are provided
    const questionType = params.questionTypes && params.questionTypes.length > 0
      ? params.questionTypes[(sectionAQuestions.length + i) % params.questionTypes.length]
      : undefined;
    console.log(`Section B - Question ${sectionAQuestions.length + i + 1}: Using question type ${questionType} (index ${(sectionAQuestions.length + i) % (params.questionTypes?.length || 1)} of ${params.questionTypes?.length || 0})`);
    return generateQuestion(sectionAQuestions.length + i, difficulties[(i + 1) % difficulties.length], questionType);
  });

  return {
    title: params.title,
    subject: params.subject,
    totalMarks: params.numberOfQuestions * params.marksPerQuestion,
    sections: [
      {
        title: 'Section A',
        instruction: 'Attempt all questions. Each question carries equal marks.',
        questions: sectionAQuestions,
      },
      {
        title: 'Section B',
        instruction: 'Attempt all questions. Show your work for full credit.',
        questions: sectionBQuestions,
      },
    ],
  };
}

export async function generateQuestionPaper(params: {
  title: string;
  subject: string;
  questionTypes: string[];
  numberOfQuestions: number;
  marksPerQuestion: number;
  instructions: string;
  fileContent?: string;
}): Promise<QuestionPaper> {
  // Check if we have a valid Gemini API key
  const isValidApiKey = process.env.GEMINI_API_KEY && 
    !process.env.GEMINI_API_KEY.includes('dummy-key') &&
    process.env.GEMINI_API_KEY.length > 20;

  if (!isValidApiKey) {
    console.log('Using mock mode - no valid Gemini API key provided');
    return generateMockQuestionPaper({
      title: params.title,
      subject: params.subject,
      numberOfQuestions: params.numberOfQuestions,
      marksPerQuestion: params.marksPerQuestion,
      questionTypes: params.questionTypes,
    });
  }

  console.log('Using Gemini AI for question generation with subject:', params.subject);

  const isMCQ = params.questionTypes.some(type => type.toLowerCase().includes('mcq') || type.toLowerCase().includes('multiple choice'));
  const isFillBlanks = params.questionTypes.some(type => type.toLowerCase().includes('fill') && type.toLowerCase().includes('blank'));
  const isMatching = params.questionTypes.some(type => type.toLowerCase().includes('match'));
  
  const prompt = `
You are an expert assessment creator. Generate a structured question paper based on the following requirements:

Title: ${params.title}
Subject: ${params.subject}
Question Types: ${params.questionTypes.join(', ')}
Number of Questions: ${params.numberOfQuestions}
Marks Per Question: ${params.marksPerQuestion}
Instructions: ${params.instructions}
${params.fileContent ? `Reference Material: ${params.fileContent}` : ''}

Requirements:
1. Create 2-3 sections (e.g., Section A, Section B, Section C)
2. Each section should have a clear instruction (e.g., "Attempt all questions")
3. Distribute questions across sections appropriately
4. Assign difficulty levels (easy, medium, hard) to each question
5. Ensure the total marks match: ${params.numberOfQuestions * params.marksPerQuestion}
6. Questions should be specific to the subject "${params.subject}" - not generic
7. ${isMCQ ? 'For MCQ questions, include 4 options (A, B, C, D) and mark the correct answer' : ''}
8. ${isFillBlanks ? 'For fill-in-the-blanks questions, use _____ to indicate the blank and provide the correct answer' : ''}
9. ${isMatching ? 'For matching questions, provide pairs of items to match with "left" and "right" properties' : ''}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "string",
  "subject": "string",
  "totalMarks": number,
  "sections": [
    {
      "title": "string",
      "instruction": "string",
      "questions": [
        {
          "id": "string",
          "text": "string",
          "difficulty": "easy" | "medium" | "hard",
          "marks": number,
          "type": "mcq" | "short-answer" | "essay" | "fill-in-the-blanks" | "matching",
          ${isMCQ ? '"options": ["A", "B", "C", "D"],' : ''}
          ${isMCQ ? '"correctAnswer": "A",' : ''}
          ${isFillBlanks ? '"correctAnswer": "answer",' : ''}
          ${isMatching ? '"pairs": [{"left": "A", "right": "B"}],' : ''}
        }
      ]
    }
  ]
}

Do not include any markdown formatting, explanations, or additional text. Return only the JSON.
`;

  try {
    const model = getGeminiClient().getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('No content generated');
    }

    // Clean the content - remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const questionPaper = JSON.parse(cleanedContent) as QuestionPaper;
    
    // Validate the structure
    if (!questionPaper.title || !questionPaper.subject || !questionPaper.sections) {
      throw new Error('Invalid question paper structure');
    }

    console.log('Gemini generated questions for subject:', questionPaper.subject);
    return questionPaper;
  } catch (error) {
    console.error('Gemini AI Generation Error:', error);
    // Fallback to mock mode if AI generation fails
    console.log('Falling back to mock mode due to AI generation error');
    return generateMockQuestionPaper({
      title: params.title,
      subject: params.subject,
      numberOfQuestions: params.numberOfQuestions,
      marksPerQuestion: params.marksPerQuestion,
      questionTypes: params.questionTypes,
    });
  }
}
