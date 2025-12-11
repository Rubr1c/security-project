'use client';

import type { User } from '@/lib/db/types';
import { Button } from '@/components/ui';

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
          <tr className="border-b border-slate-800">
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
        <tbody className="divide-y divide-slate-800">
          {users.map((user) => (
            <tr key={user.id} className="transition hover:bg-slate-800/30">
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
                #{user.id}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-semibold text-slate-950">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white">{user.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-400">{user.email}</td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium capitalize text-slate-300">
                  {user.role}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-400">
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

