import Link from 'next/link';
import { FileText, Sparkles, BookOpen, Users, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/index';

export default function HomePage() {
  return (
    <div className="min-h-full bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Welcome back! 👋</h1>
          <p className="text-gray-600">What would you like to do today?</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/assignments/create" className="flex items-start gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Create Assignment</h3>
                <p className="text-sm text-gray-600">Generate AI-powered question papers instantly</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 mt-0.5" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/assignments" className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">View Assignments</h3>
                <p className="text-sm text-gray-600">Manage all your created assignments</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 mt-0.5" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/ai-toolkit" className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">AI Toolkit</h3>
                <p className="text-sm text-gray-600">Explore AI tools for teaching</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 mt-0.5" />
            </Link>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/groups" className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">My Groups</h3>
                <p className="text-sm text-gray-600">Manage your student groups</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 mt-0.5" />
            </Link>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Assignments Created', value: '12' },
            { label: 'Questions Generated', value: '248' },
            { label: 'Students Reached', value: '84' },
          ].map((stat) => (
            <Card key={stat.label} className="p-4 text-center">
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
