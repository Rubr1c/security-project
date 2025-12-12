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
    <div className="overflow-x-auto border border-slate-200 bg-white">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              ID
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              Name
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              Email
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              Role
            </th>
            <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
              Created
            </th>
            {onDelete && (
              <th className="px-3 py-3 text-right text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-50">
              <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-700">
                {user.id}
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center border border-slate-300 bg-white text-sm font-semibold text-teal-800">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-slate-950">
                    {user.name}
                  </span>
                </div>
              </td>
              <td className="px-3 py-3 text-sm text-slate-700">{user.email}</td>
              <td className="px-3 py-3">
                <span className="inline-flex items-center border border-slate-300 px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-700 uppercase">
                  {user.role}
                </span>
              </td>
              <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-700">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              {onDelete && (
                <td className="px-3 py-3 text-right">
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
