'use client';
import { useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, Progress, Badge } from '@/components/ui/index';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useAssignmentWebSocket } from '@/lib/useWebSocket';
import { fetchAssignment } from '@/lib/api';
import { GeneratedPaper, GeneratedQuestion } from '@/types';

declare global {
  interface Window {
    html2pdf: any;
  }
}

export default function AssignmentPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.id as string;
  const printRef = useRef<HTMLDivElement>(null);

  const { generation, setAssignmentId, setGenerationStatus, setGenerationResult, setGenerationError } =
    useAssignmentStore();

  // Connect WebSocket
  const wsId = generation.assignmentId === assignmentId ? assignmentId : null;
  useAssignmentWebSocket(wsId);

  // On mount: set assignment ID and poll if needed
  useEffect(() => {
    setAssignmentId(assignmentId);

    // If no status from WS yet, poll the API
    const poll = async () => {
      try {
        const assignment = await fetchAssignment(assignmentId);
        if (assignment.status === 'completed' && assignment.result) {
          setGenerationResult(assignment.result);
        } else if (assignment.status === 'failed') {
          setGenerationError('Generation failed. Please try again.');
        } else if (assignment.status === 'processing' || assignment.status === 'queued') {
          setGenerationStatus(assignment.status, generation.progress || 20, 'Generating...');
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };

    // Poll every 3 seconds until completed/failed
    if (!generation.result && generation.status !== 'failed') {
      const interval = setInterval(async () => {
        const { generation: g } = useAssignmentStore.getState();
        if (g.result || g.status === 'failed') {
          clearInterval(interval);
          return;
        }
        await poll();
      }, 3000);

      poll(); // Immediate first poll
      return () => clearInterval(interval);
    }
  }, [
    assignmentId,
    generation.progress,
    generation.result,
    generation.status,
    setAssignmentId,
    setGenerationError,
    setGenerationResult,
    setGenerationStatus,
  ]);

  const handleRegenerate = () => {
    router.push('/assignments/create');
  };

  const paper = generation.result;
  const isLoading = !paper && generation.status !== 'failed';
  const isFailed = generation.status === 'failed';

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current || !paper) return;

    // Dynamically load html2pdf
    if (!window.html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
      await new Promise((resolve) => (script.onload = resolve));
    }

    const filename = `${paper.subject}_${paper.className}_QuestionPaper.pdf`.replace(/\s+/g, '_');

    const opt = {
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    window.html2pdf().set(opt).from(printRef.current).save();
  }, [paper]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 no-print">
          <Button variant="ghost" className="mb-4 -ml-2" onClick={() => router.push('/assignments')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Close View
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="no-print">
            <Card className="p-8 mb-6">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
                <h2 className="text-lg font-semibold mb-2">Generating Your Question Paper</h2>
                <p className="text-sm text-gray-600 mb-6">
                  {generation.message || 'AI is crafting your questions...'}
                </p>
                <div className="max-w-md mx-auto">
                  <Progress value={generation.progress} className="mb-2" />
                  <p className="text-xs text-gray-500 text-right">{generation.progress}%</p>
                </div>
                <div className="mt-6 space-y-2 text-left max-w-sm mx-auto">
                  {[
                    { label: 'Assignment queued', done: (generation.progress || 0) >= 5 },
                    { label: 'Building prompt', done: (generation.progress || 0) >= 20 },
                    { label: 'Generating with AI', done: (generation.progress || 0) >= 60 },
                    { label: 'Structuring sections', done: (generation.progress || 0) >= 80 },
                    { label: 'Finalizing paper', done: (generation.progress || 0) >= 100 },
                  ].map((step) => (
                    <div key={step.label} className="flex items-center gap-2 text-sm">
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={step.done ? 'text-gray-800' : 'text-gray-400'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Error State */}
        {isFailed && (
          <Card className="p-8 mb-6 no-print">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold mb-2">Generation Failed</h2>
              <p className="text-sm text-gray-600 mb-6">
                {generation.error || 'Something went wrong. Please try again.'}
              </p>
              <Button onClick={handleRegenerate} className="bg-black hover:bg-gray-800">
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          </Card>
        )}

        {/* Success: Show Paper */}
        {paper && (
          <>
            {/* Action Banner */}
            <div className="bg-gray-800 text-white rounded-lg p-4 mb-6 flex items-start gap-3 no-print">
              <div className="flex-1">
                <p className="text-sm">
                  ✅ Your question paper for <strong>{paper.subject}</strong> — {paper.className} is ready!
                  {paper.sections.length} sections, {paper.totalMarks} total marks.
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-gray-700"
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-gray-700"
                  onClick={handleDownloadPDF}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Question Paper */}
            <Card className="p-8 md:p-12 bg-white print-area" ref={printRef}>
              <QuestionPaper paper={paper} />
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionPaper({ paper }: { paper: GeneratedPaper }) {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-xl md:text-2xl font-bold mb-2">{paper.schoolName}</h1>
        <div className="text-sm md:text-base mb-1">
          <strong>Subject:</strong> {paper.subject}
        </div>
        <div className="text-sm md:text-base mb-4">
          <strong>Class:</strong> {paper.className}
        </div>

        <div className="border-t border-b border-gray-300 py-3 mb-4">
          <div className="flex flex-col md:flex-row justify-between text-sm">
            <div><strong>Time Allowed:</strong> {paper.duration}</div>
            <div><strong>Maximum Marks:</strong> {paper.totalMarks}</div>
          </div>
        </div>

        {/* General Instructions */}
        <div className="text-left text-sm text-gray-700 bg-gray-50 rounded p-3 mb-4">
          <p className="font-semibold mb-2">General Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            {paper.generalInstructions.map((inst, i) => (
              <li key={i} className="text-gray-600">{inst}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Student Info */}
      <div className="mb-8 space-y-3 text-sm">
        <div className="flex gap-2">
          <span className="font-medium whitespace-nowrap">Name:</span>
          <div className="flex-1 border-b border-gray-400"></div>
        </div>
        <div className="flex gap-2">
          <span className="font-medium whitespace-nowrap">Roll Number:</span>
          <div className="flex-1 border-b border-gray-400"></div>
        </div>
        <div className="flex gap-2">
          <span className="font-medium whitespace-nowrap">Class &amp; Section:</span>
          <div className="flex-1 border-b border-gray-400"></div>
        </div>
      </div>

      {/* Sections */}
      {paper.sections.map((section, sIdx) => (
        <div key={sIdx} className="mb-10">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold">{section.title}</h2>
            <p className="text-sm font-medium text-gray-700">{section.questionType}</p>
            <p className="text-sm text-gray-500 italic">{section.instruction}</p>
            <p className="text-sm text-gray-500">[Total: {section.totalMarks} marks]</p>
          </div>

          <ol className="space-y-4">
            {section.questions.map((q) => (
              <QuestionItem key={q.number} question={q} />
            ))}
          </ol>
        </div>
      ))}

      {/* Footer */}
      <div className="border-t border-gray-300 pt-4 mt-8 text-center text-xs text-gray-400">
        — End of Question Paper —
      </div>
    </>
  );
}

function QuestionItem({ question }: { question: GeneratedQuestion }) {
  const difficultyVariant = {
    easy: 'easy',
    medium: 'medium',
    hard: 'hard',
  }[question.difficulty] as 'easy' | 'medium' | 'hard';

  const difficultyLabel = {
    easy: 'Easy',
    medium: 'Moderate',
    hard: 'Hard',
  }[question.difficulty];

  return (
    <li className="flex gap-3">
      <span className="font-medium text-sm min-w-[28px] flex-shrink-0">{question.number}.</span>
      <div className="flex-1">
        <p className="text-sm leading-relaxed mb-1.5">{question.text}</p>
        <div className="flex items-center gap-2">
          <Badge variant={difficultyVariant} className="text-xs px-2 py-0.5 no-print">
            {difficultyLabel}
          </Badge>
          <span className="text-xs text-gray-500">({question.marks} {question.marks === 1 ? 'mark' : 'marks'})</span>
        </div>
        {/* Print-only difficulty indicator */}
        <span className="hidden print:inline text-xs text-gray-500">
          [{difficultyLabel}] ({question.marks} marks)
        </span>
      </div>
    </li>
  );
}
