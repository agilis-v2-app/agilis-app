'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, ClipboardList, Clock, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import useProjectStore from '@/hooks/use-project-store';

const statusLabels: { [key: string]: string } = {
  todo: 'A Fazer',
  pending: 'Em Andamento',
  done: 'Concluído',
};

const statusColors: { [key: string]: string } = {
  todo: '#ef4444',
  pending: '#3b82f6',
  done: '#22c55e',
};

export default function ProjectOverviewPage() {
  const { stats, isLoading } = useProjectStore();

  const tasksByStatusData = stats
    ? Object.entries(stats.tasksByStatus)
        .map(([status, value]) => ({
          name: statusLabels[status] || status,
          value,
          color: statusColors[status],
        }))
        .filter((item) => item.value > 0)
    : [];

  const assignmentData = stats
    ? [
        { name: 'Atribuídas', value: stats.tasksAssignedCount, fill: '#3b82f6' },
        {
          name: 'Não Atribuídas',
          value: stats.tasksUnassignedCount,
          fill: '#6b7280',
        },
      ]
    : [];

  const renderStatCard = (
    title: string,
    value: number | string,
    icon: React.ReactNode,
    loading: boolean
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold">Erro ao carregar visão geral</h1>
        <p className="mt-2 text-muted-foreground">
          Não foi possível buscar as informações para este projeto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStatCard(
          'Total de Tarefas',
          stats.tasksCount,
          <ClipboardList className="h-4 w-4 text-muted-foreground" />,
          isLoading
        )}
        {renderStatCard(
          'Membros',
          stats.membersCount,
          <Users className="h-4 w-4 text-muted-foreground" />,
          isLoading
        )}
        {renderStatCard(
          'Tarefas Atrasadas',
          stats.overdueCount,
          <Clock className="h-4 w-4 text-muted-foreground" />,
          isLoading
        )}
        {renderStatCard(
          'Convites Pendentes',
          stats.pendingInvitations,
          <Mail className="h-4 w-4 text-muted-foreground" />,
          isLoading
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Tarefas por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tasksCount > 0 && tasksByStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tasksByStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {tasksByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  Nenhuma tarefa para exibir.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atribuição de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.tasksCount > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={assignmentData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      borderColor: 'hsl(var(--border))',
                    }}
                    itemStyle={{
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="value" name="Tarefas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <p className="text-muted-foreground">
                  Nenhuma tarefa para exibir.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
