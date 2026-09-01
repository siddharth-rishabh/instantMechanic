import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Avatar, Button, Card, Input, PageHeader, PageState, Pagination, Select, StatusBadge } from '../components/ui';
import { useRemote } from '../hooks/useRemote';
import { mechanicsApi } from '../services/resources';

const initial = { search: '', status: '', specialization: '', sort: 'name', page: 1, limit: 12 };

export default function MechanicsPage() {
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState(initial);
  const { data, loading, error } = useRemote(() => mechanicsApi.list(query), [JSON.stringify(query)]);
  const apply = (event) => {
    event.preventDefault();
    setQuery({ ...draft, page: 1 });
  };

  return <>
    <PageHeader title="Mechanics" description="Monitor workforce availability, skills, and active assignments." />
    <Card className="mb-5 p-4">
      <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-3 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, email, phone…" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} />
        </div>
        <Select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
          <option value="">All statuses</option><option>available</option><option>busy</option><option>offline</option>
        </Select>
        <Input placeholder="Specialization" value={draft.specialization} onChange={(event) => setDraft({ ...draft, specialization: event.target.value })} />
        <div className="flex gap-2">
          <Select value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: event.target.value })}>
            <option value="name">Name A–Z</option><option value="-jobsCompleted">Most jobs</option><option value="status">Status</option><option value="-createdAt">Newest</option>
          </Select>
          <Button>Apply</Button>
        </div>
      </form>
    </Card>
    {loading ? <PageState /> : error ? <PageState type="error" message={error} /> : !data.mechanics.length ? <PageState type="empty" message="No mechanics found." /> :
      <Card className="overflow-hidden">
        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {data.mechanics.map((mechanic) =>
            <Link key={mechanic._id} to={`/mechanics/${mechanic._id}`} className="box-border h-full min-w-0 bg-card p-6 hover:bg-muted/40">
              <div className="flex min-w-0 items-start gap-4">
                <Avatar name={mechanic.name} src={mechanic.profileImage} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{mechanic.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{mechanic.email}</p>
                </div>
                <StatusBadge status={mechanic.status} className="shrink-0" />
              </div>
              <div className="mt-6 flex items-start justify-between gap-4 text-sm">
                <span className="min-w-0 flex-1"><b>{mechanic.jobsCompleted}</b> jobs completed</span>
                <span className="min-w-0 shrink text-right text-muted-foreground">{mechanic.currentBooking ? mechanic.currentBooking.bookingId : 'No active job'}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {mechanic.specializations.map((specialization) => <span key={specialization} className="rounded bg-muted px-2 py-1 text-xs">{specialization}</span>)}
              </div>
            </Link>)}
        </div>
        <Pagination pagination={data.pagination} onPage={(page) => setQuery({ ...query, page })} />
      </Card>}
  </>;
}
