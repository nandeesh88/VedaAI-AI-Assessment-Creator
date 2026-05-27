'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Filter, Search, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Card } from '@/components/ui/index';
import { fetchAssignments, deleteAssignment } from '@/lib/api';
import { Assignment } from '@/types';
import { useAssignmentStore } from '@/store/assignmentStore';

export default function AssignmentsPage() {
  const { assignments, setAssignments } = useAssignmentStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments()
      .then(setAssignments)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [setAssignments]);

  const handleDelete = async (id: string) => {
    await deleteAssignment(id);
    setAssignments(assignments.filter((a) => a._id !== id));
    setOpenMenu(null);
  };

  const filtered = assignments.filter(
    (a) =>
      a.subject?.toLowerCase().includes(search.toLowerCase()) ||
      a.topic?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  if (filtered.length === 0 && !search) {
    return <EmptyState />;
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold">Assignments</h1>
            <Link href="/assignments/create">
              <Button className="hidden md:flex bg-black hover:bg-gray-800 text-white rounded-full gap-2">
                <Plus className="w-4 h-4" /> Create New
              </Button>
            </Link>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by subject or topic"
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No assignments found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((assignment) => (
              <div key={assignment._id} className="relative">
                <Link href={`/assignments/${assignment._id}/preview`}>
                  <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-base">
                          {assignment.subject || 'Assignment'}{' '}
                          {assignment.topic ? `- ${assignment.topic}` : ''}
                        </h3>
                        <StatusBadge status={assignment.status} />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenMenu(openMenu === assignment._id ? null : assignment._id);
                        }}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Assigned on:</span>{' '}
                        {new Date(assignment.createdAt).toLocaleDateString('en-IN')}
                      </div>
                      {assignment.dueDate && (
                        <div>
                          <span className="font-medium">Due:</span> {assignment.dueDate}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Questions:</span> {assignment.totalQuestions} |{' '}
                        <span className="font-medium">Marks:</span> {assignment.totalMarks}
                      </div>
                    </div>
                  </Card>
                </Link>
                {openMenu === assignment._id && (
                  <div className="absolute top-12 right-4 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={() => handleDelete(assignment._id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <Button
          asChild
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600"
        >
          <Link href="/assignments/create">
            <Plus className="w-6 h-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.queued}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="relative w-48 h-48">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="60" fill="#E5E7EB" />
              <circle cx="100" cy="100" r="50" fill="white" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="85" y1="85" x2="115" y2="85" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="85" y1="95" x2="115" y2="95" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="85" y1="105" x2="115" y2="105" stroke="#D1D5DB" strokeWidth="2" />
              <line x1="85" y1="115" x2="105" y2="115" stroke="#D1D5DB" strokeWidth="2" />
              <circle cx="100" cy="100" r="25" fill="#EF4444" opacity="0.1" />
              <line x1="90" y1="90" x2="110" y2="110" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="110" y1="90" x2="90" y2="110" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
              <line x1="145" y1="145" x2="165" y2="165" stroke="#9CA3AF" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-semibold mb-3">No assignments yet</h2>
        <p className="text-gray-600 mb-6 text-sm md:text-base leading-relaxed">
          Create your first assignment to start generating AI-powered question papers.
        </p>
        <Button asChild className="bg-black hover:bg-gray-800 text-white rounded-full px-6">
          <Link href="/assignments/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Assignment
          </Link>
        </Button>
        <Button asChild className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600">
          <Link href="/assignments/create">
            <Plus className="w-6 h-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
