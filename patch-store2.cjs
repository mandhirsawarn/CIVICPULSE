const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, 'src', 'store', 'useStore.ts');
const mockDataPath = path.join(__dirname, 'src', 'mockData.ts');

let mockData = fs.readFileSync(mockDataPath, 'utf8');

mockData = mockData.replace(/timeline: \[/g, `upvotes: Math.floor(Math.random() * 50) + 1, downvotes: Math.floor(Math.random() * 5), userVotes: {}, communityComments: [], communityRecheckRequests: 0, timeline: [`);

mockData = mockData.replace(/id: 'CP-1047',[\\s\\S]*?upvotes: Math.floor\\(Math.random\\(\\) \\* 50\\) \\+ 1, downvotes: Math.floor\\(Math.random\\(\\) \\* 5\\)/, (match) => {
    return match.replace(/upvotes: [\\s\\S]*?downvotes: [^,]*/, 'upvotes: 87, downvotes: 3');
});

fs.writeFileSync(mockDataPath, mockData);

let storeData = fs.readFileSync(storePath, 'utf8');

const interfaceActions = `
  voteIssue: (issueId: string, voteType: 'up' | 'down' | null) => void;
  addCommunityComment: (issueId: string, text: string) => void;
  requestCommunityRecheck: (issueId: string) => void;
}
`;

storeData = storeData.replace(/clearReportDraft: \\(\\) => void;\\n}/, `clearReportDraft: () => void;${interfaceActions}`);

const actionImplementations = `
      clearReportDraft: () => set({ reportDraft: null }),

      voteIssue: (issueId, voteType) => set((state) => {
        const userId = state.currentUser?.id || 'demo-user-1';
        return {
          issues: state.issues.map(issue => {
            if (issue.id === issueId) {
              const currentVote = issue.userVotes?.[userId];
              let newUpvotes = issue.upvotes || 0;
              let newDownvotes = issue.downvotes || 0;
              
              if (currentVote === 'up') newUpvotes = Math.max(0, newUpvotes - 1);
              if (currentVote === 'down') newDownvotes = Math.max(0, newDownvotes - 1);
              
              if (voteType === 'up') newUpvotes += 1;
              if (voteType === 'down') newDownvotes += 1;
              
              const newUserVotes = { ...(issue.userVotes || {}) };
              if (voteType) {
                newUserVotes[userId] = voteType;
              } else {
                delete newUserVotes[userId];
              }
              
              return { ...issue, upvotes: newUpvotes, downvotes: newDownvotes, userVotes: newUserVotes };
            }
            return issue;
          })
        };
      }),

      addCommunityComment: (issueId, text) => set((state) => {
        const userId = state.currentUser?.name || 'Concerned Citizen';
        return {
          issues: state.issues.map(issue => {
            if (issue.id === issueId) {
              const newComment = { id: \`c-\${Date.now()}\`, text, timestamp: new Date().toISOString(), author: userId };
              return { ...issue, communityComments: [...(issue.communityComments || []), newComment] };
            }
            return issue;
          })
        };
      }),

      requestCommunityRecheck: (issueId) => set((state) => ({
        issues: state.issues.map(issue => {
          if (issue.id === issueId) {
            return { ...issue, communityRecheckRequests: (issue.communityRecheckRequests || 0) + 1 };
          }
          return issue;
        })
      })),
`;

storeData = storeData.replace(/clearReportDraft: \\(\\) => set\\(\\{ reportDraft: null \\}\\),/, actionImplementations);

fs.writeFileSync(storePath, storeData);
console.log('Store patched!');
