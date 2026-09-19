import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  HelpCircle, 
  Mic, 
  BrainCircuit, 
  MapPin, 
  AlertTriangle, 
  Copy, 
  Users, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  Bell, 
  PhoneCall, 
  Lock, 
  ChevronDown, 
  ArrowRight, 
  Sparkles, 
  Check, 
  FileText,
  Building2,
  Camera,
  Navigation
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

const DOC_SECTIONS = [
  { id: 'overview', title: 'Overview', icon: BookOpen },
  { id: 'how-to-report', title: 'How to Report', icon: FileText },
  { id: 'voice-description', title: 'Voice Description', icon: Mic },
  { id: 'ai-analysis', title: 'AI Analysis', icon: BrainCircuit },
  { id: 'location', title: 'Location Services', icon: MapPin },
  { id: 'priority', title: 'Priority & Scoring', icon: AlertTriangle },
  { id: 'duplicates', title: 'Duplicate Reports', icon: Copy },
  { id: 'community-pulse', title: 'Community Pulse', icon: Users },
  { id: 'tracking', title: 'Tracking a Report', icon: Clock },
  { id: 'verification', title: 'Resolution Verification', icon: CheckCircle2 },
  { id: 'authority-portal', title: 'Authority Portal', icon: ShieldCheck },
  { id: 'collaboration', title: 'Collaboration Hub', icon: Layers },
  { id: 'notifications', title: 'Notifications', icon: Bell },
  { id: 'emergency', title: 'Emergency Help', icon: PhoneCall },
  { id: 'privacy', title: 'Privacy & Data', icon: Lock },
  { id: 'faq', title: 'Frequently Asked Questions', icon: HelpCircle },
];

const FAQS = [
  {
    q: 'Can I report without typing?',
    a: 'Yes. CivicPulse features built-in native voice description. Simply tap the microphone icon on the report form, speak naturally in English or Hindi, and your spoken description will be transcribed into text on screen for you to review.'
  },
  {
    q: 'Can I edit my report?',
    a: 'While drafting, you can freely edit category, photo, location pin, and text. Once submitted to municipal teams, you can add follow-up notes or comments in the report discussion area to provide fresh updates.'
  },
  {
    q: 'Can I report the same issue again?',
    a: 'Instead of creating a duplicate report, we recommend finding the existing report on the City Map or Community Feed and upvoting it. This reinforces its community urgency without splitting the case file across multiple municipal tickets.'
  },
  {
    q: 'How is priority decided?',
    a: 'Priority is calculated through multi-factor assessment: safety hazard severity (e.g. exposed live electrical wire vs cosmetic issue), location density (near schools, hospitals, or major transit corridors), report age, and community upvotes.'
  },
  {
    q: 'What happens if someone already reported it?',
    a: 'CivicPulse checks for nearby matching reports within a 250-meter radius. If a duplicate is detected, you will see a prompt linking directly to the original case, allowing you to upvote and add notes rather than creating repetitive municipal tickets.'
  },
  {
    q: 'Can I track my report?',
    a: 'Yes. Every report receives a unique tracking ID (e.g. #CP-7104). You can track real-time status in "My Reports", inspect departmental assignments, review estimated SLA windows, and view official completion evidence.'
  },
  {
    q: 'Can I verify a resolved issue?',
    a: 'Yes! When a municipal crew marks work completed, citizens can inspect the "After" photo evidence and cast an on-ground confirmation vote ("Looks Resolved" or "Still a Problem"). If citizens vote that an issue persists, it automatically triggers a re-review.'
  },
  {
    q: 'Can community votes force an authority to act?',
    a: 'Community votes serve as a strong prioritization signal to municipal administrators and zone commissioners. While community validation helps fast-track urgent issues, official department dispatch remains governed by public safety assessments and crew availability.'
  },
  {
    q: 'What should I do during an emergency?',
    a: 'CivicPulse is designed for non-emergency municipal infrastructure maintenance. If there is an immediate danger to human life, ongoing crime, severe fire, or road crash, call 112 immediately.'
  }
];

const Docs: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Docs Header / Hero */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-[0_4px_24px_rgba(15,23,42,0.03)] relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold tracking-wide">
            <BookOpen size={14} />
            <span>CIVICPULSE DOCUMENTATION & USER GUIDE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            How CivicPulse works
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Everything you need to know about reporting, tracking, and resolving civic issues across your neighbourhood. Written in plain, accessible language for all residents.
          </p>
        </div>
      </div>

      {/* Docs Layout: Left Sidebar + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sticky Navigation */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-3">
          <Card className="p-3 bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.03)] rounded-2xl">
            <div className="px-3 py-2 border-b border-slate-100 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Documentation Topics
              </span>
            </div>
            <nav className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
              {DOC_SECTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    <Icon size={15} className={isActive ? "text-blue-600" : "text-slate-400"} />
                    <span className="truncate">{item.title}</span>
                  </button>
                );
              })}
            </nav>
          </Card>
        </aside>

        {/* Right Content Stream */}
        <main className="lg:col-span-8 space-y-12">

          {/* 1. Overview */}
          <section id="overview" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <BookOpen size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">What is CivicPulse?</h2>
                <p className="text-xs text-slate-500">The civic intelligence platform connecting residents and city administration</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 leading-relaxed text-slate-700 text-sm">
              <p>
                <strong>CivicPulse</strong> is a modern citizen intelligence and municipal operations platform. It helps residents report problems in their neighbourhood, tracks those issues through municipal assignment, and allows citizens to verify when the work is actually completed on the ground.
              </p>
              
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Common civic issues you can report:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { name: 'Potholes & Road Cracks', emoji: '🕳️' },
                    { name: 'Uncollected Garbage', emoji: '🗑️' },
                    { name: 'Broken Streetlights', emoji: '💡' },
                    { name: 'Road Damage & Craters', emoji: '🚧' },
                    { name: 'Monsoon Waterlogging', emoji: '🌊' },
                    { name: 'Water Pipe Leakage', emoji: '💧' },
                    { name: 'Broken Footpaths', emoji: '🧱' },
                    { name: 'Damaged Traffic Signs', emoji: '🛑' },
                    { name: 'Fallen Trees & Debris', emoji: '🌳' },
                  ].map((issue) => (
                    <div key={issue.name} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800">
                      <span>{issue.emoji}</span>
                      <span className="truncate">{issue.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>

          {/* 2. How to Report */}
          <section id="how-to-report" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">How to Report an Issue</h2>
                <p className="text-xs text-slate-500">Step-by-step reporting walkthrough</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { step: '1', title: 'Open Report Form', desc: 'Click "Report an Issue" in the top navigation bar from any device.' },
                  { step: '2', title: 'Select Issue Category', desc: 'Pick the category that best matches (Roads, Sanitation, Lighting, Water, etc.).' },
                  { step: '3', title: 'Add Photo Evidence', desc: 'Take a quick smartphone picture or upload existing photo evidence.' },
                  { step: '4', title: 'Pin Exact Location', desc: 'Use automatic GPS detection or drag the pin on the map to mark the exact spot.' },
                  { step: '5', title: 'Describe the Problem', desc: 'Type details or tap the microphone to describe the issue using your voice.' },
                  { step: '6', title: 'Set Observed Urgency', desc: 'Indicate whether this is a minor nuisance or an immediate traffic/safety hazard.' },
                  { step: '7', title: 'Review Summary', desc: 'Review automated duplicate suggestions and department routing preview.' },
                  { step: '8', title: 'Submit & Track', desc: 'Submit your report to receive a live tracking ID and status updates.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-xs font-bold font-mono">
                      {s.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">{s.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* 3. Voice Description */}
          <section id="voice-description" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Mic size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Voice Description</h2>
                <p className="text-xs text-slate-500">Accessible reporting without typing</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                If you prefer not to type or are reporting while on the move, CivicPulse allows you to describe the problem using your voice.
              </p>

              <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Mic size={20} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-purple-950 text-sm">How voice transcription works:</h4>
                  <ol className="list-decimal list-inside text-xs text-purple-900 space-y-1 pt-1">
                    <li>Tap <strong>"Speak Description"</strong> on the report screen.</li>
                    <li>Grant your browser microphone permission when prompted.</li>
                    <li>Speak clearly about what happened and nearby landmarks.</li>
                    <li>Your words appear live in the description box.</li>
                    <li>Tap <strong>"Stop Recording"</strong> and edit the transcribed text if needed.</li>
                  </ol>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
                <strong>Please note:</strong> Speech transcription uses your browser's native speech recognition engine. While highly accurate, we advise reviewing the transcribed text before submitting.
              </div>
            </Card>
          </section>

          {/* 4. AI Analysis */}
          <section id="ai-analysis" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <BrainCircuit size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">AI-Assisted Assessment</h2>
                <p className="text-xs text-slate-500">Transparent assistive intelligence for triage</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                CivicPulse utilizes automated natural language and category classification to help organize high-volume citizen reports and prevent bureaucratic bottlenecks.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">1. Category Detection</span>
                  <p className="text-xs text-slate-500">Identifies whether the issue relates to Roads, Electricity, Drainage, or Sanitation.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">2. Department Suggestions</span>
                  <p className="text-xs text-slate-500">Recommends the appropriate municipal authority (e.g. Municipal Works, Public Health).</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">3. Severity Estimation</span>
                  <p className="text-xs text-slate-500">Evaluates whether immediate danger exists (e.g. exposed live wire, open manhole).</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">4. Duplicate Identification</span>
                  <p className="text-xs text-slate-500">Correlates location and descriptions to group identical complaints together.</p>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                <strong>Human Governance Commitment:</strong> AI recommendations assist municipal workflows; they do not replace human authority decisions or citizen accountability.
              </div>
            </Card>
          </section>

          {/* 5. Location Services */}
          <section id="location" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Location Identification</h2>
                <p className="text-xs text-slate-500">Pinpoint accuracy for municipal field crews</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Precise coordinates allow repair teams to locate the problem immediately without needing to call you for directions.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <Navigation size={20} className="mx-auto mb-2 text-blue-600" />
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Device GPS</h4>
                  <p className="text-[11px] text-slate-500">One-tap geolocation from your smartphone or tablet browser.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <MapPin size={20} className="mx-auto mb-2 text-amber-600" />
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Drop Pin</h4>
                  <p className="text-[11px] text-slate-500">Tap anywhere on the interactive map to adjust the exact location.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <Building2 size={20} className="mx-auto mb-2 text-emerald-600" />
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Address Search</h4>
                  <p className="text-[11px] text-slate-500">Type sector numbers, road names, or nearby local landmarks.</p>
                </div>
              </div>
            </Card>
          </section>

          {/* 6. Priority & Scoring */}
          <section id="priority" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Priority & Scoring</h2>
                <p className="text-xs text-slate-500">How urgent tasks are sorted and prioritized</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Priority helps municipal teams allocate limited repair crews to where they are needed most urgently.
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Factors influencing priority:</h4>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Severity of Hazard:</strong> Direct physical hazards (e.g. open electrical junction box) receive higher initial priority than cosmetic requests.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Location Sensitivity:</strong> Issues near primary hospitals, schools, and arterial avenues carry greater weight.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Community Validation:</strong> Widespread community support and upvotes signal collective neighborhood impact.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Duration & SLA Age:</strong> Reports pending beyond expected resolution milestones receive escalated review.</span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                <strong>Fair Allocation:</strong> High priority ensures urgent attention, but all validated reports remain queued until resolved.
              </div>
            </Card>
          </section>

          {/* 7. Duplicate Reports */}
          <section id="duplicates" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Copy size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Duplicate Report Detection</h2>
                <p className="text-xs text-slate-500">Grouping similar reports to eliminate wasted effort</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                When a water main breaks or a streetlight fails on a busy avenue, multiple citizens often submit reports within hours. CivicPulse identifies duplicates to benefit everyone:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Unified Case Files</h4>
                  <p className="text-xs text-slate-500">Consolidates photos and descriptions into a single municipal work order.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Prevents Redundant Dispatches</h4>
                  <p className="text-xs text-slate-500">Field teams receive one comprehensive task instead of five fragmented tickets.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <h4 className="font-bold text-xs text-slate-900 mb-1">Collective Notifications</h4>
                  <p className="text-xs text-slate-500">Every citizen who reported or upvoted the issue receives status updates when resolved.</p>
                </div>
              </div>
            </Card>
          </section>

          {/* 8. Community Pulse */}
          <section id="community-pulse" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Community Pulse & Voting</h2>
                <p className="text-xs text-slate-500">Neighborhood consensus and democratic participation</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                <strong>Community Pulse</strong> gives local residents a direct voice in identifying what matters most in their ward.
              </p>

              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-600 text-xs mt-0.5">👍 Upvote</span>
                  <p className="text-xs text-slate-600">Confirms you have noticed the same problem or agree that it requires municipal attention.</p>
                </div>
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-rose-600 text-xs mt-0.5">👎 Downvote</span>
                  <p className="text-xs text-slate-600">Flags that an issue is incorrect, on private property, or no longer an impediment.</p>
                </div>
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 text-xs mt-0.5">💬 Comments</span>
                  <p className="text-xs text-slate-600">Add ground updates, warning notes for drivers, or details for municipal engineers.</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Democratic Signal:</strong> Community support serves as a valuable signal into prioritization; it assists officials in understanding public sentiment while ensuring safety standards remain supreme.
              </div>
            </Card>
          </section>

          {/* 9. Tracking a Report */}
          <section id="tracking" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Clock size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Tracking Report Lifecycle</h2>
                <p className="text-xs text-slate-500">From submission to citizen verification</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4">
              <p className="text-sm text-slate-700">Every issue moves through clear, auditable lifecycle stages:</p>

              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
                {[
                  { title: '1. Submitted', desc: 'Report logged into the city ledger and assigned a unique ID.' },
                  { title: '2. AI & Zone Triage', desc: 'Category verified, duplicate check complete, routed to department.' },
                  { title: '3. Assigned to Crew', desc: 'Task delegated to field response officers in the corresponding ward.' },
                  { title: '4. In Progress', desc: 'Maintenance team deployed on-site with required equipment.' },
                  { title: '5. Resolved by Crew', desc: 'Technician uploads "After" photo proof of completed work.' },
                  { title: '6. Citizen Verified', desc: 'Local residents confirm on-site that the issue has been resolved.' },
                ].map((step, idx) => (
                  <div key={step.title} className="relative pl-6">
                    <span className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-white border-2 border-blue-600 shadow-xs" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{step.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* 10. Resolution Verification */}
          <section id="verification" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Resolution Verification</h2>
                <p className="text-xs text-slate-500">Citizens hold the final confirmation key</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                In traditional grievance systems, complaints are often marked "Resolved" administratively without on-ground inspection. CivicPulse introduces <strong>Citizen Verification</strong>:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={16} />
                    <span>Looks Resolved</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    If you inspect the site and confirm the pothole is patched or street light is operational, cast a confirmation vote. The ticket officially transitions to <strong>Verified</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={16} />
                    <span>Still a Problem</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    If the problem was partially addressed or remains hazardous, tap "Still a Problem". The ticket is immediately flagged for municipal re-review and returned to the field queue.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* 11. Authority Portal */}
          <section id="authority-portal" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Municipal Authority Portal</h2>
                <p className="text-xs text-slate-500">How city engineers and dispatch teams operate</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Municipal staff access a dedicated command center dashboard to manage citywide civic operations efficiently:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">Centralized Triage Queue</span>
                  <p className="text-xs text-slate-500">Live incoming reports with SLA countdown clocks and priority filters.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">GIS Ward Maps</span>
                  <p className="text-xs text-slate-500">Heatmaps displaying issue density, recurring clusters, and crew telemetry.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">Field Crew Dispatch</span>
                  <p className="text-xs text-slate-500">Assigning work orders directly to active municipal teams on the road.</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-xs text-slate-900 block mb-1">Photo Proof Upload</span>
                  <p className="text-xs text-slate-500">Field officers submit geo-stamped resolution evidence to verify completion.</p>
                </div>
              </div>
            </Card>
          </section>

          {/* 12. Collaboration Hub */}
          <section id="collaboration" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Collaboration Hub</h2>
                <p className="text-xs text-slate-500">Tackling complex urban problems beyond individual reports</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                Some challenges — such as chronic monsoon waterlogging, recurring solid waste accumulation, or outdated traffic signal cycles — cannot be solved with a single pothole patch.
              </p>
              <p>
                The <strong>Collaboration Hub</strong> bridges municipal bodies with universities, engineering research laboratories, and industry partners to pilot innovative technological solutions.
              </p>
            </Card>
          </section>

          {/* 13. Notifications */}
          <section id="notifications" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Notifications & Alerts</h2>
                <p className="text-xs text-slate-500">Stay informed as your report progresses</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-4 text-sm text-slate-700 leading-relaxed">
              <p>
                You receive notifications at key milestones:
              </p>
              <div className="space-y-2">
                {[
                  'When your report is accepted and assigned to a department.',
                  'When an estimated SLA resolution window is established.',
                  'When a maintenance team arrives on-site.',
                  'When resolution evidence is submitted and ready for your verification.',
                ].map((note, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* 14. Emergency Help */}
          <section id="emergency" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <PhoneCall size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Emergency Protocol</h2>
                <p className="text-xs text-slate-500">Understanding civic complaints vs urgent life safety</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-rose-200/80 bg-rose-50/20 space-y-4 text-sm text-slate-700 leading-relaxed border-l-4 border-l-rose-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-rose-950 text-base">CivicPulse is NOT an emergency dispatcher.</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    For ongoing crimes, medical distress, severe structural collapse, or active road crashes, contact National Emergency immediately:
                  </p>
                </div>
                <a href="tel:112" className="shrink-0">
                  <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2">
                    <PhoneCall size={16} />
                    <span>Call 112</span>
                  </Button>
                </a>
              </div>

              <div className="pt-2">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Dedicated 24x7 Helplines:</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">Police</span>
                    <strong className="text-slate-900 font-bold">100</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">Fire Control</span>
                    <strong className="text-slate-900 font-bold">101</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">Ambulance</span>
                    <strong className="text-slate-900 font-bold">108</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="text-slate-500 block text-[10px]">Women Helpline</span>
                    <strong className="text-slate-900 font-bold">1091</strong>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* 15. Privacy & Data */}
          <section id="privacy" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Lock size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Privacy & Data Governance</h2>
                <p className="text-xs text-slate-500">Transparent handling of your community data</p>
              </div>
            </div>

            <Card className="p-6 rounded-2xl border-slate-200/80 bg-white space-y-3 text-sm text-slate-700 leading-relaxed">
              <p>
                CivicPulse adheres to transparent data practices:
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Report Data:</strong> Information you submit (photos, descriptions, categories) is made visible on the public city pulse feed to encourage transparency.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Location Data:</strong> Coordinates are only requested when submitting an issue or browsing the city map.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Prototype Scope:</strong> This deployment is a technical proof-of-concept; simulated records are kept localized and can be cleared in profile preferences.</span>
                </li>
              </ul>
            </Card>
          </section>

          {/* 16. Frequently Asked Questions (FAQ) */}
          <section id="faq" className="scroll-mt-24 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <HelpCircle size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
                <p className="text-xs text-slate-500">Quick answers to common questions</p>
              </div>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = expandedFaq === idx;
                return (
                  <Card 
                    key={idx} 
                    className="p-0 overflow-hidden border-slate-200/80 bg-white shadow-xs rounded-2xl"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-50/80 gap-4"
                    >
                      <span className="font-bold text-slate-900 text-sm">{faq.q}</span>
                      <ChevronDown 
                        size={18} 
                        className={cn("text-slate-400 transition-transform duration-200 shrink-0", isOpen && "rotate-180 text-blue-600")} 
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {faq.a}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </section>

        </main>
      </div>

    </div>
  );
};

export default Docs;
