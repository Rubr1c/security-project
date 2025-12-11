'use client';

import type { User } from '@/lib/db/types';
import { Button } from '@/components/ui';
import { Trash2 } from 'lucide-react';

interface UserTableProps {
  users: User[];
  onDelete?: (id: number) => void;
  isDeleting?: boolean;
}

export function UserTable({ users, onDelete, isDeleting }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Role
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              Created
            </th>
            {onDelete && (
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="transition hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                #{user.id}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {user.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              {onDelete && (
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(user.id)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
