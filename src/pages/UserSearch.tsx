import { useState } from "react";
import { trpc } from "../providers/trpcClient";
import { UserCard } from "../components/UserCard";
import { Input } from "../components/ui/input";
import { Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useDebounce } from "../hooks/useDebounce";

export default function UserSearch() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);

  const { data, isLoading } = trpc.user.searchUsers.useQuery(
    { q: debouncedQ },
    { enabled: debouncedQ.length >= 1 }
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-[#d4a843]" />
          <h1 className="font-display text-2xl font-bold">Find Users</h1>
        </div>

        <Input
          placeholder="Search by username or name..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-6"
          autoFocus
        />

        {isLoading && q.length > 0 && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {data && data.items.length === 0 && debouncedQ && (
          <p className="text-center text-muted-foreground py-8">No users found for "{debouncedQ}".</p>
        )}

        {data && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((user: any) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        )}

        {!q && (
          <p className="text-center text-muted-foreground py-12 text-sm">
            Type to search for users by handle or name.
          </p>
        )}
      </motion.div>
    </div>
  );
}

