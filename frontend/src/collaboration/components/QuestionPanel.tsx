import {useQuestion} from '../hooks/useQuestion';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-green-100 text-green-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'hard':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const parseTextWithCode = (text: string) => {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const code = part.slice(1, -1);
      return (
        <code key={index} className="bg-gray-100 px-1 rounded">
          {code}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function QuestionPanel({questionId}: {questionId: string}) {
  const {question, isLoading, error} = useQuestion(questionId);
  if (isLoading) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading question...</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto p-6">
        <div className="text-red-500">{error || 'Question not found'}</div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{question.title}</h1>

      {/* Tags */}
      <div className="flex gap-2 mb-6">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Problem Description */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Problem Description</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          {parseTextWithCode(question.description)}
        </p>
      </div>

      {/* Examples */}
      {question.examples.map((example, index) => {
        const lines = example.split('\n').filter(line => line.trim());
        return (
          <div key={index} className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              {lines[0].includes('Example') ? lines[0] : `Example ${index + 1}:`}
            </h3>
            <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
              {lines.slice(1).map((line, lineIndex) => {
                const trimmedLine = line.trim();
                return (
                  <div
                    key={lineIndex}
                    className={trimmedLine.startsWith('Explanation') ? 'text-gray-600' : ''}
                  >
                    {trimmedLine}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Constraints */}
      {question.constraints && question.constraints.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Constraints:</h3>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            {question.constraints.map((constraint, index) => (
              <li key={index}>{parseTextWithCode(constraint)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
