const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'pages', 'citizen', 'IssueDetails.tsx');

let code = fs.readFileSync(file, 'utf8');

// Update imports
code = code.replace(/import \{ ChevronLeft, MapPin, Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Camera, User, Check \} from 'lucide-react';/,
"import { ChevronLeft, MapPin, Clock, ShieldAlert, CheckCircle2, XCircle, ArrowRight, Camera, User, Check, ThumbsUp, ThumbsDown, Users, Flame, MessageSquare, Send } from 'lucide-react';");

// Update useStore destructured properties
code = code.replace(/const \{ issues, updateIssueStatus \} = useStore\(\);/,
"const { issues, updateIssueStatus, voteIssue, addCommunityComment, requestCommunityRecheck, currentUser } = useStore();");

// Add state for comment
code = code.replace(/const \[hasVerified, setHasVerified\] = useState\(false\);/,
"const [hasVerified, setHasVerified] = useState(false);\n  const [commentText, setCommentText] = useState('');\n  const userId = currentUser?.id || 'demo-user-1';");

// Update handleVerify
code = code.replace(/updateIssueStatus\(issue.id, 'IN_PROGRESS'\); \/\/ Reopen/,
"updateIssueStatus(issue.id, 'IN_PROGRESS');\n      requestCommunityRecheck(issue.id);");

// Prepare Community Support JSX
const communityJSX = `
          {/* Community Support Block */}
          <Card className="flex flex-col gap-4 border-civic-primary/20">
            <h3 className="text-sm font-semibold text-civic-text border-b border-brand-100 pb-2 flex items-center gap-2">
              <Users size={16} className="text-civic-primary" />
              Community Support
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-brand-50 rounded-full p-1 border border-brand-200">
                  <button 
                    onClick={() => voteIssue(issue.id, issue.userVotes?.[userId] === 'up' ? null : 'up')}
                    className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors", issue.userVotes?.[userId] === 'up' ? "bg-civic-primary text-white" : "hover:bg-brand-100 text-civic-text")}
                  >
                    <ThumbsUp size={16} className={issue.userVotes?.[userId] === 'up' ? "fill-white" : ""} /> {issue.upvotes || 0}
                  </button>
                  <div className="w-px h-6 bg-brand-200"></div>
                  <button 
                    onClick={() => voteIssue(issue.id, issue.userVotes?.[userId] === 'down' ? null : 'down')}
                    className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors", issue.userVotes?.[userId] === 'down' ? "bg-civic-danger text-white" : "hover:bg-brand-100 text-civic-text")}
                  >
                    <ThumbsDown size={16} className={issue.userVotes?.[userId] === 'down' ? "fill-white" : ""} /> {issue.downvotes || 0}
                  </button>
                </div>
                
                {((issue.upvotes || 0) - (issue.downvotes || 0)) >= 10 && (
                  <div className="flex items-center gap-1 text-xs font-bold text-brand-500 uppercase tracking-wider bg-brand-100 px-3 py-1.5 rounded-lg">
                    <Flame size={14} className="text-brand-500" />
                    {Math.round(((issue.upvotes || 0) / ((issue.upvotes || 0) + (issue.downvotes || 0))) * 100)}% Support
                  </div>
                )}
              </div>
              
              <p className="text-xs text-civic-muted sm:text-right max-w-xs">
                Your vote helps CivicPulse understand which issues affect the community.
              </p>
            </div>
          </Card>

          {/* Community Comments Block */}
          <Card className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-civic-text border-b border-brand-100 pb-2 flex items-center gap-2">
              <MessageSquare size={16} className="text-civic-primary" />
              Community Discussion
            </h3>
            
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {(!issue.communityComments || issue.communityComments.length === 0) ? (
                <p className="text-sm text-civic-muted text-center py-4">No comments yet. Be the first to share your experience.</p>
              ) : (
                issue.communityComments.map(comment => (
                  <div key={comment.id} className="bg-brand-50 rounded-lg p-3 border border-brand-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-xs text-civic-text">{comment.author}</span>
                      <span className="text-[10px] text-civic-muted">{new Date(comment.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-civic-muted">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex gap-2 mt-2 pt-4 border-t border-brand-100">
              <input 
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 p-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-civic-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentText.trim()) {
                    addCommunityComment(issue.id, commentText.trim());
                    setCommentText('');
                  }
                }}
              />
              <Button 
                onClick={() => {
                  if (commentText.trim()) {
                    addCommunityComment(issue.id, commentText.trim());
                    setCommentText('');
                  }
                }}
                disabled={!commentText.trim()}
                className="px-4"
              >
                <Send size={16} />
              </Button>
            </div>
          </Card>
`;

// Insert the new blocks after the Description Card
code = code.replace(/<\/Card>\s*\{\/\* Verification UI if Resolved \*\/\}/, `</Card>\n\n${communityJSX}\n\n          {/* Verification UI if Resolved */}`);

// Update verification warning
code = code.replace(/<Button onClick=\{.*?handleVerify\(false\).*?className="flex-1 bg-white\/10 text-white hover:bg-white\/20 border border-white\/20">/s,
`<Button onClick={() => handleVerify(false)} className="flex-1 bg-white/10 text-white hover:bg-white/20 border border-white/20">`);

code = code.replace(/No, still broken\s*<\/Button>/,
`No, still broken
                </Button>
                {(issue.communityRecheckRequests || 0) > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md border border-red-400">
                    ⚠️ {issue.communityRecheckRequests} Recheck Requests
                  </div>
                )}`);

fs.writeFileSync(file, code);
console.log('IssueDetails patched!');
