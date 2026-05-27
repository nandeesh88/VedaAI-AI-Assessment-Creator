'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Card } from '@/components/ui/index';
import { useAssignmentStore } from '@/store/assignmentStore';
import { createAssignment } from '@/lib/api';

export default function CreateAssignmentPage() {
  const router = useRouter();
  const {
    form,
    setFormField,
    updateQuestionType,
    removeQuestionType,
    addQuestionType,
    resetForm,
    setAssignmentId,
    setGenerationStatus,
    resetGeneration,
  } = useAssignmentStore();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalQuestions = form.questionTypes.reduce((s, qt) => s + qt.questions, 0);
  const totalMarks = form.questionTypes.reduce((s, qt) => s + qt.questions * qt.marks, 0);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.topic.trim()) newErrors.topic = 'Topic is required';
    if (totalQuestions === 0) newErrors.questions = 'Add at least one question';
    form.questionTypes.forEach((qt) => {
      if (qt.questions < 0) newErrors[`qt_${qt.id}`] = 'Questions cannot be negative';
      if (qt.marks < 0) newErrors[`marks_${qt.id}`] = 'Marks cannot be negative';
      if (!qt.label.trim()) newErrors[`label_${qt.id}`] = 'Question type label required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setErrors((e) => ({ ...e, file: 'File must be under 10MB' }));
      return;
    }
    setFormField('uploadedFileName', file.name);
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    resetGeneration();

    try {
      const payload = {
        subject: form.subject,
        topic: form.topic,
        additionalInfo: form.additionalInfo,
        dueDate: form.dueDate,
        schoolName: form.schoolName,
        className: form.className,
        duration: form.duration,
        questionTypes: form.questionTypes.filter((qt) => qt.questions > 0),
      };

      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      const file = fileInput?.files?.[0] || null;
      const { assignmentId } = await createAssignment(payload, file);
      setAssignmentId(assignmentId);
      setGenerationStatus('queued', 5, 'Assignment queued for generation...');
      router.push(`/assignments/${assignmentId}/preview`);
    } catch (err: unknown) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to create assignment' });
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => router.push('/assignments')}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Assignments
          </Button>
          <div className="mb-4">
            <h1 className="text-2xl font-semibold mb-2">Create Assignment</h1>
            <p className="text-sm text-gray-600">Set up a new assignment for your students</p>
          </div>
        </div>

        <Card className="p-6">
          {/* Assignment Details */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Assignment Details</h2>
              <p className="text-sm text-gray-600">Basic information about your assignment</p>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <Label htmlFor="subject" className="mb-2 block">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="e.g. Science, Mathematics, English"
                value={form.subject}
                onChange={(e) => setFormField('subject', e.target.value)}
                className={errors.subject ? 'border-red-400' : ''}
              />
              {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
            </div>

            {/* Topic */}
            <div className="mb-4">
              <Label htmlFor="topic" className="mb-2 block">
                Topic / Chapter <span className="text-red-500">*</span>
              </Label>
              <Input
                id="topic"
                placeholder="e.g. Electricity, Photosynthesis, World War II"
                value={form.topic}
                onChange={(e) => setFormField('topic', e.target.value)}
                className={errors.topic ? 'border-red-400' : ''}
              />
              {errors.topic && <p className="text-xs text-red-500 mt-1">{errors.topic}</p>}
            </div>

            {/* School & Class Row */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="schoolName" className="mb-2 block">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="School name"
                  value={form.schoolName}
                  onChange={(e) => setFormField('schoolName', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="className" className="mb-2 block">Class</Label>
                <Input
                  id="className"
                  placeholder="e.g. 8th, Grade 10"
                  value={form.className}
                  onChange={(e) => setFormField('className', e.target.value)}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="mb-6">
              <Label htmlFor="duration" className="mb-2 block">Exam Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 3 hours, 90 minutes"
                value={form.duration}
                onChange={(e) => setFormField('duration', e.target.value)}
              />
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <Label className="mb-2 block">Upload Document (Optional)</Label>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files?.[0]);
                }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                  onChange={(e) => handleFileUpload(e.target.files?.[0])}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium mb-1">Choose a file or drag & drop it here</p>
                  <p className="text-xs text-gray-500 mb-4">JPEG, PNG, PDF, DOCX formats, up to 10MB</p>
                  <Button variant="outline" type="button">Browse Files</Button>
                </label>
              </div>
              {form.uploadedFileName && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <span>📎 {form.uploadedFileName}</span>
                  <button
                    onClick={() => setFormField('uploadedFileName', null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
            </div>

            {/* Due Date */}
            <div className="mb-6">
              <Label htmlFor="due-date" className="mb-2 block">Due Date</Label>
              <div className="relative">
                <Input
                  id="due-date"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setFormField('dueDate', e.target.value)}
                  className="pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Question Types */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Question Type</h2>
              <p className="text-sm text-gray-600">Define the types and distribution of questions</p>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 mb-3 text-sm font-medium text-gray-600">
              <div className="col-span-6">Question Type</div>
              <div className="col-span-3 text-center">No. of Questions</div>
              <div className="col-span-3 text-center">Marks Each</div>
            </div>

            <div className="space-y-3 mb-4">
              {form.questionTypes.map((qt) => (
                <div key={qt.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 flex items-center gap-2">
                    <input
                      type="text"
                      value={qt.label}
                      onChange={(e) => {
                        const updated = form.questionTypes.map((q) =>
                          q.id === qt.id ? { ...q, label: e.target.value } : q
                        );
                        useAssignmentStore.getState().setQuestionTypes(updated);
                      }}
                      className="flex-1 text-sm border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={() => removeQuestionType(qt.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={qt.questions}
                      onChange={(e) => updateQuestionType(qt.id, 'questions', parseInt(e.target.value) || 0)}
                      className="text-center"
                      min="0"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={qt.marks}
                      onChange={(e) => updateQuestionType(qt.id, 'marks', parseInt(e.target.value) || 0)}
                      className="text-center"
                      min="0"
                    />
                  </div>
                </div>
              ))}
            </div>

            {errors.questions && (
              <p className="text-xs text-red-500 mb-3">{errors.questions}</p>
            )}

            <Button variant="outline" className="w-full mb-6" onClick={addQuestionType}>
              + Add Question Type
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mb-8">
            <Label htmlFor="additional-info" className="mb-2 block">
              Additional Information (For better output)
            </Label>
            <Textarea
              id="additional-info"
              placeholder="e.g. Generate a question paper for 3 hour exam duration, focus on application-based questions..."
              rows={3}
              value={form.additionalInfo}
              onChange={(e) => setFormField('additionalInfo', e.target.value)}
            />
          </div>

          {/* Overview */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Overview</h3>
              <p className="text-xs text-gray-600">
                Here's an overview of the Assignment you are going to create
              </p>
            </div>
            <div className="space-y-2 text-sm">
              {form.subject && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium">{form.subject}</span>
                </div>
              )}
              {form.topic && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Topic:</span>
                  <span className="font-medium">{form.topic}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{form.dueDate || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Marks:</span>
                <span className="font-semibold">{totalMarks}</span>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.submit}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm();
                router.push('/assignments');
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-black hover:bg-gray-800"
              onClick={handleGenerate}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Generate Assignment'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
