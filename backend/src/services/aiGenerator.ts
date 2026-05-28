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
      'A store offers a 20% discount on a $150 item. What is the final price after discount?',
      'If you save $200 per month, how much will you have in 2 years?',
      'A car travels 60 km in 1.5 hours. What is its average speed?',
      'Your phone bill is $45 per month. How much do you pay in a year?',
      'A recipe serves 4 people and requires 2 cups of flour. How much flour for 10 people?',
      'You earn $15 per hour and work 35 hours per week. What is your weekly income?',
      'A pizza is cut into 8 slices. If 3 people eat 2 slices each, how many slices remain?',
      'The temperature increased from 20°C to 35°C. What was the percentage increase?',
      'A rectangular garden is 12m by 8m. What is the area in square meters?',
      'If a product costs $80 and tax is 8%, what is the total cost?',
    ],
    'physics': [
      'A 60 kg person jumps off a 2m high wall. What is their velocity just before hitting the ground?',
      'How much energy does a 100W bulb consume if left on for 8 hours?',
      'A car accelerates from 0 to 60 km/h in 6 seconds. What is its acceleration?',
      'If you drop a ball from 10m height, how long does it take to reach the ground?',
      'A 2kg object is pushed with 10N force. What is its acceleration?',
      'How much force is needed to lift a 50kg box?',
      'A 1500W heater runs for 3 hours. How much energy does it use in kWh?',
      'What is the speed of sound if it travels 340m in 1 second?',
      'A 5kg mass falls from 20m. What is its kinetic energy just before impact?',
      'How much work is done to push a 30kg box 10m across a floor with 50N force?',
    ],
    'chemistry': [
      'If you mix 50g of salt in 200mL of water, what is the concentration in g/mL?',
      'A solution has pH 3. Is it acidic or basic?',
      'How many grams are in 2 moles of water (H₂O)?',
      'If you burn 10g of methane, how much CO₂ is produced?',
      'What happens when you mix baking soda and vinegar?',
      'How much water is produced when 4g of hydrogen reacts with oxygen?',
      'If a solution has 0.1M HCl, what is its pH?',
      'How many atoms are in 12g of carbon?',
      'What is the molar mass of table salt (NaCl)?',
      'If you dilute 100mL of 1M solution to 1L, what is the new concentration?',
    ],
    'biology': [
      'Why do we feel hungry after exercising?',
      'How does vaccination protect us from diseases?',
      'Why do leaves change color in autumn?',
      'How does our body fight infections?',
      'Why do we need to drink water daily?',
      'How do plants make food from sunlight?',
      'Why do we get fever when sick?',
      'How does digestion break down food into energy?',
      'Why do muscles get sore after exercise?',
      'How does blood carry oxygen throughout the body?',
    ],
    'computer science': [
      'How does a password protect your online account?',
      'Why do websites use cookies?',
      'How does a search engine find information?',
      'What happens when you click a link on a webpage?',
      'How does email travel from sender to receiver?',
      'Why do we need to update software regularly?',
      'How does a computer virus spread?',
      'What is the difference between HTTP and HTTPS in web browsing?',
      'How does cloud storage keep your files safe?',
      'Why do some websites load faster than others?',
    ],
    'history': [
      'How did the invention of the printing press change daily life?',
      'Why did people migrate from rural areas to cities during the Industrial Revolution?',
      'How did World War II affect ordinary families?',
      'What was daily life like before electricity was invented?',
      'How did the invention of the telephone change communication?',
      'Why did ancient civilizations build pyramids and monuments?',
      'How did the discovery of America change trade and daily life?',
      'What was the impact of the railroad on travel and commerce?',
      'How did the internet revolution change how we access information?',
      'Why did people fight for voting rights throughout history?',
    ],
    'current affairs': [
      'How does climate change affect our daily weather patterns?',
      'Why are electric vehicles becoming more popular?',
      'How does social media influence public opinion?',
      'What are the benefits and risks of remote work?',
      'How does inflation affect the cost of living?',
      'Why are renewable energy sources important for the future?',
      'How does online shopping change traditional retail?',
      'What are the impacts of artificial intelligence on everyday jobs?',
      'How do government policies affect healthcare access?',
      'Why is cybersecurity important for individuals and businesses?',
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
      `How does ${subject} affect our daily lives?`,
      `What are the practical uses of ${subject} in everyday situations?`,
      `How can understanding ${subject} help solve real-world problems?`,
      `What are the current trends in ${subject} that impact society?`,
      `How has ${subject} evolved over time to meet modern needs?`,
      `What are the benefits of learning ${subject} for personal and professional growth?`,
      `How does ${subject} interact with technology in our daily routines?`,
      `What are the common misconceptions about ${subject}?`,
      `How can ${subject} be applied to improve decision-making?`,
      `What role does ${subject} play in shaping our future?`,
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
      return `Case Study: A small business owner wants to optimize their pricing strategy. They sell 100 units per month at $20 each. For every $1 decrease in price, they sell 10 more units. ${question || 'Calculate the optimal price to maximize revenue and explain your reasoning.'}`;
    } else if (lowerSubject.includes('physics')) {
      return `Case Study: A family is planning a road trip. Their car has a fuel efficiency of 25 mpg and the gas tank holds 15 gallons. They need to travel 400 miles. ${question || 'Calculate if they need to stop for gas and determine the most fuel-efficient driving speed.'}`;
    } else if (lowerSubject.includes('chemistry')) {
      return `Case Study: A restaurant owner wants to understand food preservation. They notice that food spoils faster in summer than winter. ${question || 'Explain the chemical reasons behind this and suggest practical preservation methods.'}`;
    } else if (lowerSubject.includes('biology')) {
      return `Case Study: A school cafeteria wants to create healthier meal options. Students are complaining about feeling tired after lunch. ${question || 'Analyze the nutritional factors and suggest menu changes that would provide sustained energy.'}`;
    } else if (lowerSubject.includes('computer')) {
      return `Case Study: A local library wants to digitize their book collection. They have 10,000 books and limited budget. ${question || 'Design a practical digitization plan considering storage, accessibility, and cost-effectiveness.'}`;
    } else {
      return `Case Study: ${question || 'Analyze this real-world scenario and provide practical solutions based on the subject matter.'}`;
    }
  };

  const generateProblemSolving = (subject: string, question?: string): string => {
    const lowerSubject = subject.toLowerCase();
    
    if (lowerSubject.includes('math')) {
      return `Problem: You want to save money for a vacation. You can save $200 per month and the vacation costs $2,400. ${question || 'Calculate how many months you need to save and create a savings plan.'}`;
    } else if (lowerSubject.includes('physics')) {
      return `Problem: You need to move furniture to a second-floor apartment. The stairs are 3 meters high and you need to lift a 50kg box. ${question || 'Calculate the work required and determine if you can do it safely.'}`;
    } else if (lowerSubject.includes('chemistry')) {
      return `Problem: You are cooking and need to adjust a recipe. The original recipe calls for 2 cups of flour for 4 servings, but you need to make 6 servings. ${question || 'Calculate the correct amount of flour and explain the ratio.'}`;
    } else if (lowerSubject.includes('biology')) {
      return `Problem: Your friend wants to start a fitness routine. They want to lose 5kg in 2 months through exercise. ${question || 'Calculate the daily calorie deficit needed and suggest a realistic exercise plan.'}`;
    } else if (lowerSubject.includes('computer')) {
      return `Problem: You need to organize your digital photos. You have 1,000 photos taking up 5GB of storage. ${question || 'Calculate storage requirements for different compression options and recommend the best approach.'}`;
    } else {
      return `Problem: ${question || 'Solve this practical problem using appropriate methods and show your work.'}`;
    }
  };

  const generateBlankAnswer = (subject: string, question?: string): string => {
    const lowerSubject = subject.toLowerCase();
    
    // Generate varied answers based on question content
    if (question) {
      if (question.includes('equation') || question.includes('solve') || question.includes('x')) {
        const answers = ['5', '7', '10', '12', '15', '20', '25', '3', '8', '4'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('derivative') || question.includes('rate')) {
        const answers = ['6x + 4', '3x² + 2x', '2x + 5', '5x² - 3', '4x - 7'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('integral') || question.includes('area')) {
        const answers = ['x³ + 2x²', '2x³ + C', 'x²/2 + 3x', '5x² + C', 'x³/3'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('force') || question.includes('F = ma')) {
        const answers = ['15 N', '25 N', '30 N', '45 N', '50 N'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('energy') || question.includes('kinetic')) {
        const answers = ['100 J', '150 J', '200 J', '250 J', '300 J'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('velocity') || question.includes('speed')) {
        const answers = ['10 m/s', '15 m/s', '20 m/s', '25 m/s', '30 m/s'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('molar mass') || question.includes('H₂SO₄')) {
        const answers = ['98 g/mol', '18 g/mol', '36 g/mol', '58 g/mol', '74 g/mol'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('pH') || question.includes('acid')) {
        const answers = ['3', '5', '7', '9', '11'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('cell') || question.includes('powerhouse')) {
        const answers = ['mitochondria', 'nucleus', 'ribosome', 'golgi apparatus', 'endoplasmic reticulum'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('DNA') || question.includes('genetic')) {
        const answers = ['deoxyribonucleic acid', 'nucleotide', 'chromosome', 'gene', 'RNA'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('photosynthesis') || question.includes('chloroplast')) {
        const answers = ['chloroplast', 'chlorophyll', 'glucose', 'oxygen', 'carbon dioxide'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('algorithm') || question.includes('complexity')) {
        const answers = ['O(n)', 'O(n²)', 'O(log n)', 'O(1)', 'O(n log n)'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('database') || question.includes('transaction')) {
        const answers = ['ACID', 'SQL', 'NoSQL', 'schema', 'index'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
      if (question.includes('CPU') || question.includes('processor')) {
        const answers = ['Central Processing Unit', 'ALU', 'register', 'cache', 'clock speed'];
        return answers[Math.floor(Math.random() * answers.length)];
      }
    }
    
    // Fallback to subject-specific varied answers
    if (lowerSubject.includes('math')) {
      const answers = ['5', '7', '10', '12', '15', '20', '25', 'π', 'e', '√2'];
      return answers[Math.floor(Math.random() * answers.length)];
    } else if (lowerSubject.includes('physics')) {
      const answers = ['15 N', '25 N', '30 N', '45 N', '50 N', '9.8 m/s²', '3 × 10⁸ m/s', '1.6 × 10⁻¹⁹ C'];
      return answers[Math.floor(Math.random() * answers.length)];
    } else if (lowerSubject.includes('chemistry')) {
      const answers = ['98 g/mol', '18 g/mol', '36 g/mol', '58 g/mol', '74 g/mol', 'H₂O', 'CO₂', 'NaCl'];
      return answers[Math.floor(Math.random() * answers.length)];
    } else if (lowerSubject.includes('biology')) {
      const answers = ['mitochondria', 'nucleus', 'ribosome', 'DNA', 'enzyme', 'cell membrane', 'ATP'];
      return answers[Math.floor(Math.random() * answers.length)];
    } else if (lowerSubject.includes('computer')) {
      const answers = ['O(n)', 'O(n²)', 'O(log n)', 'CPU', 'RAM', 'algorithm', 'binary'];
      return answers[Math.floor(Math.random() * answers.length)];
    } else if (lowerSubject.includes('current')) {
      const answers = ['climate change', 'AI', 'globalization', 'sustainability', 'digital transformation'];
      return answers[Math.floor(Math.random() * answers.length)];
    } else {
      const answers = ['concept', 'principle', 'theory', 'application', 'methodology'];
      return answers[Math.floor(Math.random() * answers.length)];
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
    
    // Generate varied options based on question content
    if (question) {
      if (question.includes('equation') || question.includes('solve') || question.includes('x')) {
        const answerSets = [
          ['5', '7', '10', '12'],
          ['15', '20', '25', '30'],
          ['3', '4', '5', '6'],
          ['8', '10', '12', '14'],
          ['2', '5', '8', '11']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('derivative') || question.includes('integral')) {
        const answerSets = [
          ['3x² + 4x', '6x + 4', 'x³ + 2x²', '2x + 1'],
          ['2x + 5', '3x²', '4x - 3', '5x² + 2'],
          ['x² + 3x', '2x + 1', '3x² - 2', '4x + 5'],
          ['6x', '3x²', '2x³', 'x + 5']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('area') || question.includes('circle')) {
        const answerSets = [
          ['154 cm²', '49π cm²', '38.5 cm²', '196 cm²'],
          ['78.5 cm²', '153.94 cm²', '314 cm²', '50.24 cm²'],
          ['25π cm²', '36π cm²', '49π cm²', '64π cm²']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('force') || question.includes('acceleration')) {
        const answerSets = [
          ['15 N', '30 N', '45 N', '60 N'],
          ['25 N', '50 N', '75 N', '100 N'],
          ['10 N', '20 N', '30 N', '40 N']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('energy') || question.includes('kinetic')) {
        const answerSets = [
          ['50 J', '100 J', '150 J', '200 J'],
          ['75 J', '125 J', '175 J', '225 J'],
          ['80 J', '160 J', '240 J', '320 J']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('molar mass') || question.includes('moles')) {
        const answerSets = [
          ['18 g/mol', '36 g/mol', '54 g/mol', '98 g/mol'],
          ['44 g/mol', '58 g/mol', '74 g/mol', '106 g/mol'],
          ['32 g/mol', '64 g/mol', '80 g/mol', '98 g/mol']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('cell') || question.includes('mitochondria')) {
        const answerSets = [
          ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'],
          ['Chloroplast', 'Vacuole', 'Lysosome', 'Endoplasmic reticulum'],
          ['Cell membrane', 'Cytoplasm', 'Cytoskeleton', 'Centriole']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
      if (question.includes('complexity') || question.includes('algorithm')) {
        const answerSets = [
          ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
          ['O(n log n)', 'O(2ⁿ)', 'O(n!)', 'O(√n)'],
          ['O(n)', 'O(n³)', 'O(log² n)', 'O(n/2)']
        ];
        const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
        return selectedSet.sort(() => Math.random() - 0.5);
      }
    }
    
    // Fallback to subject-specific varied options
    if (lowerSubject.includes('math')) {
      const answerSets = [
        ['5', '7', '10', '12'],
        ['15', '20', '25', '30'],
        ['π', 'e', '√2', '√3'],
        ['2.5', '3.14', '1.618', '0.5']
      ];
      const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
      return selectedSet.sort(() => Math.random() - 0.5);
    } else if (lowerSubject.includes('physics')) {
      const answerSets = [
        ['15 N', '30 N', '45 N', '60 N'],
        ['9.8 m/s²', '10 m/s²', '8.9 m/s²', '11 m/s²'],
        ['50 J', '100 J', '150 J', '200 J'],
        ['3 × 10⁸ m/s', '2 × 10⁸ m/s', '4 × 10⁸ m/s', '1 × 10⁸ m/s']
      ];
      const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
      return selectedSet.sort(() => Math.random() - 0.5);
    } else if (lowerSubject.includes('chemistry')) {
      const answerSets = [
        ['18 g/mol', '36 g/mol', '54 g/mol', '98 g/mol'],
        ['H₂O', 'CO₂', 'NaCl', 'HCl'],
        ['Acid', 'Base', 'Salt', 'Oxide'],
        ['7', '3', '10', '14']
      ];
      const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
      return selectedSet.sort(() => Math.random() - 0.5);
    } else if (lowerSubject.includes('biology')) {
      const answerSets = [
        ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'],
        ['DNA', 'RNA', 'ATP', 'Enzyme'],
        ['Cell membrane', 'Cytoplasm', 'Vacuole', 'Lysosome'],
        ['Photosynthesis', 'Respiration', 'Digestion', 'Circulation']
      ];
      const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
      return selectedSet.sort(() => Math.random() - 0.5);
    } else if (lowerSubject.includes('computer')) {
      const answerSets = [
        ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
        ['CPU', 'RAM', 'ROM', 'GPU'],
        ['Binary', 'Hexadecimal', 'Decimal', 'Octal'],
        ['TCP', 'UDP', 'HTTP', 'FTP']
      ];
      const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
      return selectedSet.sort(() => Math.random() - 0.5);
    } else {
      const answerSets = [
        ['Option A', 'Option B', 'Option C', 'Option D'],
        ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
        ['True', 'False', 'Partially true', 'Cannot determine']
      ];
      const selectedSet = answerSets[Math.floor(Math.random() * answerSets.length)];
      return selectedSet.sort(() => Math.random() - 0.5);
    }
  };

  // Distribute question types evenly across all questions
  console.log('Received questionTypes:', params.questionTypes);
  const allQuestions: Question[] = Array.from({ length: params.numberOfQuestions }, (_, i) => {
    let questionType: string | undefined;
    
    if (params.questionTypes && params.questionTypes.length > 0) {
      // Distribute types evenly: if 2 types, alternate; if 3 types, cycle through them
      questionType = params.questionTypes[i % params.questionTypes.length];
      console.log(`Question ${i + 1}: Using question type "${questionType}" (index ${i % params.questionTypes.length} of ${params.questionTypes.length})`);
    }
    
    return generateQuestion(i, difficulties[i % difficulties.length], questionType);
  });

  // Split questions into sections
  const sectionAQuestions = allQuestions.slice(0, Math.min(questionsPerSection, params.numberOfQuestions));
  const sectionBQuestions = allQuestions.slice(Math.min(questionsPerSection, params.numberOfQuestions));

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
