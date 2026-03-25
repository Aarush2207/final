import React, { useEffect, useState, useRef } from 'react';
import { Brain, Mic, MicOff, ChevronRight, CheckCircle, RotateCcw } from 'lucide-react';
import EmployeeNavbar from '../../components/EmployeeNavbar';
import { Spinner, Alert, RatingBar } from '../../components/UI';
import { interviewAPI, rolesAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Setup', 'Interview', 'Results'];

export default function EmployeeInterview() {
  const { user } = useAuth();
  const [step, setStep]           = useState(0);
  const [roles, setRoles]         = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [alert, setAlert]         = useState(null);
  const [generating, setGenerating] = useState(false);

  // Interview
  const [questions, setQuestions]   = useState([]);
  const [interviewId, setInterviewId] = useState(null);
  const [answers, setAnswers]       = useState([]);
  const [currentQ, setCurrentQ]     = useState(0);
  const [listening, setListening]   = useState(false);
  const recognitionRef              = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  // Results
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    rolesAPI.getAll({ manager_id: user.manager_id || '' })
      .then(r => setRoles(r.data || []))
      .catch(() => {}); // roles optional
  }, [user.manager_id]);

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setAlert({ type: 'warning', msg: 'Speech recognition not supported. Please type your answer.' });
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setAnswers(prev => {
        const next = [...prev];
        next[currentQ] = (next[currentQ] || '') + ' ' + transcript.trim();
        return next;
      });
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setAlert(null);
    try {
      const { data } = await interviewAPI.generate({
        employee_id: user.id,
        role_id:     selectedRole || undefined,
      });
      setQuestions(data.questions);
      setInterviewId(data.interview_id || null);
      setAnswers(new Array(data.questions.length).fill(''));
      setCurrentQ(0);
      setStep(1);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to generate questions. Make sure you have uploaded a resume.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (answers.filter(a => a.trim()).length < Math.ceil(questions.length / 2)) {
      if (!confirm('You have answered fewer than half the questions. Submit anyway?')) return;
    }
    setSubmitting(true);
    try {
      const { data } = await interviewAPI.evaluate({
        interview_id: interviewId,
        employee_id:  user.id,
        role_id:      selectedRole || undefined,
        questions,
        answers,
      });
      setEvaluation(data.evaluation);
      setStep(2);
    } catch (err) {
      setAlert({ type: 'error', msg: err.response?.data?.error || 'Failed to evaluate answers.' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0); setQuestions([]); setAnswers([]); setEvaluation(null);
    setInterviewId(null); setCurrentQ(0); setSelectedRole(''); setAlert(null);
  };

  const typeColors = {
    technical:   'bg-blue-100 text-blue-700',
    behavioural: 'bg-purple-100 text-purple-700',
    situational: 'bg-orange-100 text-orange-700',
  };

  const recColors = {
    hire:     'bg-green-50 border-green-300 text-green-700',
    consider: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    reject:   'bg-red-50 border-red-300 text-red-700',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeeNavbar />
      <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
        {/* Step bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-sm font-medium ${i === step ? 'text-blue-600' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>

        {alert && <div className="mb-4"><Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} /></div>}

        {/* ── Step 0: Setup ── */}
        {step === 0 && (
          <div className="card space-y-5">
            <div className="flex items-center gap-2">
              <Brain size={22} className="text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Practice Interview</h2>
            </div>
            <p className="text-sm text-gray-500">
              The AI will generate custom questions based on your profile and skills.
              Upload your resume first if you haven't already.
            </p>

            {roles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interview for Role (optional)</label>
                <select className="input" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                  <option value="">General interview</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              <strong>Tips:</strong> Answer honestly and in detail. The AI evaluates technical depth,
              communication clarity, and problem-solving. Use the microphone for hands-free answering.
            </div>

            <button onClick={handleGenerate} disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              {generating ? <><Spinner size="sm" /> Preparing questions…</> : <><Brain size={18} /> Start Interview</>}
            </button>
          </div>
        )}

        {/* ── Step 1: Interview ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Question {currentQ + 1} / {questions.length}</span>
                <span className="text-gray-400">{answers.filter(a => a.trim()).length} answered</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
              </div>
            </div>

            <div className="card">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {questions[currentQ]?.type && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${typeColors[questions[currentQ].type] || 'bg-gray-100 text-gray-600'}`}>
                    {questions[currentQ].type}
                  </span>
                )}
                {questions[currentQ]?.skill_focus && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                    {questions[currentQ].skill_focus}
                  </span>
                )}
              </div>

              <p className="text-gray-900 font-medium text-lg leading-relaxed mb-5">
                {questions[currentQ]?.question || questions[currentQ]}
              </p>

              <div className="relative">
                <textarea
                  className="input h-40 resize-none pr-12"
                  placeholder="Type your answer or click the mic to speak…"
                  value={answers[currentQ] || ''}
                  onChange={e => setAnswers(prev => { const n = [...prev]; n[currentQ] = e.target.value; return n; })}
                />
                <button type="button" onClick={toggleListening}
                  className={`absolute right-3 bottom-3 p-2 rounded-full transition-colors ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'}`}>
                  {listening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
              {listening && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span className="animate-pulse">●</span> Recording…</p>}
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0}
                className="btn-secondary disabled:opacity-40">← Prev</button>

              <div className="flex gap-1.5">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrentQ(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentQ ? 'bg-blue-600' : answers[i]?.trim() ? 'bg-green-400' : 'bg-gray-300'}`}
                  />
                ))}
              </div>

              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ(q => q + 1)} className="btn-primary flex items-center gap-1">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  {submitting ? <><Spinner size="sm" /> Evaluating…</> : <><CheckCircle size={16} /> Submit</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Results ── */}
        {step === 2 && evaluation && (
          <div className="space-y-5">
            <div className="card text-center">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
              <h2 className="text-xl font-bold">Interview Complete!</h2>
              <p className="text-sm text-gray-500 mt-1">Your results have been saved to your profile</p>
            </div>

            {/* Scores */}
            <div className="card space-y-4">
              <h3 className="font-semibold text-gray-900">Your Scores</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{evaluation.overall_score}/10</div>
                  <div className="text-xs text-gray-500 mt-1">Overall</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{evaluation.communication_score}/10</div>
                  <div className="text-xs text-gray-500 mt-1">Communication</div>
                </div>
              </div>
              {evaluation.skill_scores && Object.keys(evaluation.skill_scores).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(evaluation.skill_scores).map(([skill, score]) => (
                    <RatingBar key={skill} label={skill} value={score}
                      color={score >= 7 ? 'green' : score >= 5 ? 'blue' : 'orange'} />
                  ))}
                </div>
              )}
            </div>

            {/* Recommendation + Summary */}
            {evaluation.recommendation && (
              <div className={`card border ${recColors[evaluation.recommendation] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <div className="font-semibold capitalize mb-1">Verdict: {evaluation.recommendation}</div>
                {evaluation.summary && <p className="text-sm opacity-90">{evaluation.summary}</p>}
              </div>
            )}

            {/* Strengths / Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              {evaluation.strengths?.length > 0 && (
                <div className="card">
                  <h4 className="font-medium text-green-700 mb-2 text-sm">✅ Strengths</h4>
                  <ul className="space-y-1">
                    {evaluation.strengths.map((s, i) => <li key={i} className="text-xs text-gray-600">• {s}</li>)}
                  </ul>
                </div>
              )}
              {evaluation.weaknesses?.length > 0 && (
                <div className="card">
                  <h4 className="font-medium text-orange-700 mb-2 text-sm">📈 Improve</h4>
                  <ul className="space-y-1">
                    {evaluation.weaknesses.map((w, i) => <li key={i} className="text-xs text-gray-600">• {w}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <button onClick={reset} className="btn-secondary w-full flex items-center justify-center gap-2">
              <RotateCcw size={16} /> Take Another Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
