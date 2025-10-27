export default function QuestionPanel() {
  return (
    <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Two Sum</h1>

      {/* Tags */}
      <div className="flex gap-2 mb-6">
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          Easy
        </span>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Arrays</span>
        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Hash Table</span>
      </div>

      {/* Problem Description */}
      <div className="mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Problem Description</h2>
        <p className="text-gray-700 text-sm leading-relaxed">
          Given an array of integers <code className="bg-gray-100 px-1 rounded">nums</code> and an
          integer <code className="bg-gray-100 px-1 rounded">target</code>, return indices of the
          two numbers such that they add up to target.
        </p>
      </div>

      {/* Example 1 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Example 1:</h3>
        <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
          <div>
            <span className="font-semibold">Input:</span> nums = [2, 7, 11, 15], target = 9
          </div>
          <div>
            <span className="font-semibold">Output:</span> [0, 1]
          </div>
          <div className="text-gray-600">
            <span className="font-semibold">Explanation:</span> Because nums[0] + nums[1] == 9, we
            return [0,1].
          </div>
        </div>
      </div>

      {/* Example 2 */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Example 2:</h3>
        <div className="bg-gray-50 p-3 rounded text-sm font-mono space-y-1">
          <div>
            <span className="font-semibold">Input:</span> nums = [3, 2, 4], target = 6
          </div>
          <div>
            <span className="font-semibold">Output:</span> [1, 2]
          </div>
        </div>
      </div>

      {/* Constraints */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Constraints:</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>2 &lt;= nums.length &lt;= 10^4</li>
          <li>-10^9 &lt;= nums[i] &lt;= 10^9</li>
          <li>-10^9 &lt;= target &lt;= 10^9</li>
          <li>Only one valid answer exists.</li>
        </ul>
      </div>
    </div>
  );
}
